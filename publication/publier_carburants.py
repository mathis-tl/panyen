"""Publication atomique de web/public/data/carburants.parquet.

Ordre : vérifier → build carburants → exporter → valider → os.replace.
"""

from __future__ import annotations

import hashlib
import os
import subprocess
import sys
import uuid
from pathlib import Path
from typing import Callable

import duckdb

RACINE = Path(__file__).resolve().parents[1]
CHEMIN_BASE_DEFAUT = RACINE / "build" / "panyen.duckdb"
CHEMIN_DESTINATION_DEFAUT = RACINE / "web" / "public" / "data" / "carburants.parquet"
NOM_TABLE = "fct_comparaison_carburants"

COLONNES_EXPORT = (
    "type_ligne",
    "carburant",
    "libelle_carburant",
    "date_reference",
    "mois_complet",
    "q10_eur_litre",
    "q25_eur_litre",
    "mediane_eur_litre",
    "q75_eur_litre",
    "q90_eur_litre",
    "nombre_stations",
    "prix_max_mq_eur_litre",
    "fin_effet_exclusive",
    "reference_acte",
    "url_source_primaire",
    "collecte_utc_nationale",
)

LISTE_COLONNES_SQL = ", ".join(COLONNES_EXPORT)


class PublicationErreur(Exception):
    """Échec bruyant de la publication carburants."""


def lancer_make_verify(racine: Path = RACINE) -> int:
    return subprocess.run(["make", "verify"], cwd=racine, check=False).returncode


def lancer_build_carburants(racine: Path = RACINE) -> int:
    return subprocess.run(
        [
            "uv",
            "run",
            "dbt",
            "build",
            "--project-dir",
            "dbt",
            "--profiles-dir",
            "dbt",
            "--select",
            "stg_carburants+",
            "stg_arretes+",
            "stg_correspondance_carburants+",
            "prix_max_carburants_martinique+",
        ],
        cwd=racine,
        check=False,
    ).returncode


def _requete_source() -> str:
    return (
        f"select {LISTE_COLONNES_SQL} from {NOM_TABLE} "
        "order by type_ligne, carburant, date_reference"
    )


def _supprimer_candidat(chemin: Path | None) -> None:
    if chemin is not None and chemin.exists():
        chemin.unlink()


def _sha256_fichier(chemin: Path) -> str:
    return hashlib.sha256(chemin.read_bytes()).hexdigest()


def _exiger_table_non_vide(connexion: duckdb.DuckDBPyConnection) -> int:
    tables = {
        ligne[0]
        for ligne in connexion.execute(
            "select table_name from information_schema.tables "
            "where table_schema = 'main'"
        ).fetchall()
    }
    if NOM_TABLE not in tables:
        raise PublicationErreur(f"table absente : {NOM_TABLE}")
    n = connexion.execute(f"select count(*) from {NOM_TABLE}").fetchone()[0]
    if n < 1:
        raise PublicationErreur(f"table vide : {NOM_TABLE}")
    return int(n)


def _lire_empreinte(connexion: duckdb.DuckDBPyConnection, sql: str) -> tuple:
    curseur = connexion.execute(sql)
    colonnes = tuple(col[0] for col in curseur.description)
    lignes = curseur.fetchall()
    if not lignes:
        raise PublicationErreur("empreinte vide : aucune ligne à publier")
    dates = [ligne[3] for ligne in lignes]
    return colonnes, len(lignes), dates[0], dates[-1], tuple(lignes)


def exporter_candidat(*, chemin_base: Path, dossier_destination: Path) -> Path:
    if not chemin_base.is_file():
        raise PublicationErreur(f"base absente : {chemin_base}")
    dossier_destination.mkdir(parents=True, exist_ok=True)
    candidat = dossier_destination / f".carburants.{uuid.uuid4().hex}.parquet.tmp"
    connexion = duckdb.connect(str(chemin_base), read_only=True)
    try:
        _exiger_table_non_vide(connexion)
        chemin_sql = str(candidat).replace("'", "''")
        connexion.execute(
            f"copy ({_requete_source()}) to '{chemin_sql}' "
            "(format parquet, compression zstd)"
        )
    except PublicationErreur:
        _supprimer_candidat(candidat)
        raise
    except Exception as exc:
        _supprimer_candidat(candidat)
        raise PublicationErreur(f"export impossible : {exc}") from exc
    finally:
        connexion.close()
    if not candidat.is_file():
        raise PublicationErreur("export invalide : candidat Parquet non créé")
    return candidat


def valider_candidat(*, chemin_base: Path, chemin_candidat: Path) -> dict:
    connexion_base = duckdb.connect(str(chemin_base), read_only=True)
    try:
        empreinte_source = _lire_empreinte(connexion_base, _requete_source())
    finally:
        connexion_base.close()

    connexion_parquet = duckdb.connect()
    try:
        chemin_sql = str(chemin_candidat).replace("'", "''")
        empreinte_candidat = _lire_empreinte(
            connexion_parquet,
            f"select {LISTE_COLONNES_SQL} from read_parquet('{chemin_sql}') "
            "order by type_ligne, carburant, date_reference",
        )
    except PublicationErreur:
        raise
    except Exception as exc:
        raise PublicationErreur(f"lecture du candidat impossible : {exc}") from exc
    finally:
        connexion_parquet.close()

    if empreinte_candidat != empreinte_source:
        raise PublicationErreur(
            "validation échouée : le candidat Parquet ne correspond pas à la fact"
        )
    colonnes, n_lignes, date_min, date_max, _lignes = empreinte_candidat
    if colonnes != COLONNES_EXPORT:
        raise PublicationErreur(
            f"schéma invalide : attendu {COLONNES_EXPORT}, reçu {colonnes}"
        )
    return {
        "colonnes": colonnes,
        "n_lignes": n_lignes,
        "date_min": date_min,
        "date_max": date_max,
    }


def publier(
    *,
    chemin_base: Path = CHEMIN_BASE_DEFAUT,
    chemin_destination: Path = CHEMIN_DESTINATION_DEFAUT,
    lancer_verification: Callable[[], int] | None = None,
    lancer_build: Callable[[], int] | None = None,
    exporter: Callable[..., Path] | None = None,
    remplacer: Callable[[Path, Path], None] | None = None,
    racine: Path = RACINE,
) -> dict:
    if lancer_verification is None:

        def lancer_verification() -> int:
            return lancer_make_verify(racine)

    if lancer_build is None:

        def lancer_build() -> int:
            return lancer_build_carburants(racine)

    code = lancer_verification()
    if code != 0:
        raise PublicationErreur(
            f"vérification échouée : make verify a renvoyé le code {code}"
        )

    code_build = lancer_build()
    if code_build != 0:
        raise PublicationErreur(
            f"build carburants échoué : code {code_build}"
        )

    def exporter_par_defaut() -> Path:
        return exporter_candidat(
            chemin_base=chemin_base,
            dossier_destination=chemin_destination.parent,
        )

    exporter_effectif = exporter or exporter_par_defaut
    remplacer_effectif = remplacer or os.replace

    candidat: Path | None = None
    try:
        candidat = exporter_effectif()
        if not isinstance(candidat, Path):
            raise PublicationErreur("export invalide : chemin candidat manquant")
        meta = valider_candidat(chemin_base=chemin_base, chemin_candidat=candidat)
        remplacer_effectif(candidat, chemin_destination)
        candidat = None
    except PublicationErreur:
        _supprimer_candidat(candidat)
        raise
    except Exception as exc:
        _supprimer_candidat(candidat)
        raise PublicationErreur(f"remplacement impossible : {exc}") from exc

    if not chemin_destination.is_file():
        raise PublicationErreur("publication incomplete : destination absente")

    return {
        "chemin": str(chemin_destination),
        "taille": chemin_destination.stat().st_size,
        "sha256": _sha256_fichier(chemin_destination),
        "n_lignes": meta["n_lignes"],
        "date_min": meta["date_min"],
        "date_max": meta["date_max"],
    }


def afficher_succes(resume: dict) -> None:
    print(
        f"publié : {resume['chemin']}\n"
        f"taille : {resume['taille']} octets\n"
        f"sha256 : {resume['sha256']}\n"
        f"lignes : {resume['n_lignes']}\n"
        f"période : {resume['date_min']} → {resume['date_max']}"
    )


def main(argv: list[str] | None = None) -> int:
    del argv
    try:
        resume = publier()
    except PublicationErreur as exc:
        print(f"erreur de publication : {exc}", file=sys.stderr)
        return 1
    afficher_succes(resume)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
