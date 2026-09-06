"""Orchestrateur de publication Parquet du différentiel IPC (quatre postes).

Ordre strict : vérifier → exporter → valider → remplacer (os.replace en dernier).
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
CHEMIN_DESTINATION_DEFAUT = (
    RACINE / "web" / "public" / "data" / "differentiel_ipc.parquet"
)
NOM_TABLE = "fct_differentiel_ipc"

COLONNES_EXPORT = (
    "periode",
    "dernier_mois_commun",
    "poste",
    "libelle_poste",
    "fichier_source",
    "collecte_utc",
    "idbank_martinique",
    "idbank_france_metropolitaine",
    "facteur_martinique",
    "facteur_france_metropolitaine",
    "evolution_martinique_pct",
    "evolution_france_metropolitaine_pct",
    "differentiel_evolution_points",
    "coefficient_ecart",
    "ancre_ecsp_disponible",
    "ecart_ecsp_2022_pct",
    "ecart_prix_estime_pct",
    "source_ecsp",
    "nature_ecart",
)

LISTE_COLONNES_SQL = ", ".join(COLONNES_EXPORT)


class PublicationErreur(Exception):
    """Échec bruyant de la publication."""


def lancer_make_verify(racine: Path = RACINE) -> int:
    """Lance `make verify` depuis la racine ; aucun drapeau de contournement."""
    resultat = subprocess.run(
        ["make", "verify"],
        cwd=racine,
        check=False,
    )
    return resultat.returncode


def _requete_source() -> str:
    return (
        f"select {LISTE_COLONNES_SQL} "
        f"from {NOM_TABLE} "
        "order by poste, periode"
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
        raise PublicationErreur(
            f"table absente : {NOM_TABLE} introuvable dans la base"
        )
    n = connexion.execute(f"select count(*) from {NOM_TABLE}").fetchone()[0]
    if n < 1:
        raise PublicationErreur(f"table vide : {NOM_TABLE} ne contient aucune ligne")
    return int(n)


def _lire_empreinte(connexion: duckdb.DuckDBPyConnection, sql: str) -> tuple:
    """Empreinte comparable : colonnes, lignes, périodes, contenu ordonné."""
    curseur = connexion.execute(sql)
    colonnes = tuple(col[0] for col in curseur.description)
    lignes = curseur.fetchall()
    if not lignes:
        raise PublicationErreur("empreinte vide : aucune ligne à publier")
    periodes = [ligne[0] for ligne in lignes]
    return colonnes, len(lignes), periodes[0], periodes[-1], tuple(lignes)


def exporter_candidat(
    *,
    chemin_base: Path,
    dossier_destination: Path,
) -> Path:
    """Exporte un candidat Parquet Zstandard voisin de la destination."""
    if not chemin_base.is_file():
        raise PublicationErreur(f"base absente : {chemin_base}")

    dossier_destination.mkdir(parents=True, exist_ok=True)
    candidat = dossier_destination / f".differentiel_ipc.{uuid.uuid4().hex}.parquet.tmp"

    connexion = duckdb.connect(str(chemin_base), read_only=True)
    try:
        _exiger_table_non_vide(connexion)
        sql = _requete_source()
        chemin_sql = str(candidat).replace("'", "''")
        connexion.execute(
            f"copy ({sql}) to '{chemin_sql}' "
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
    """Relit le candidat et exige une correspondance exacte avec la fact."""
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
            "order by poste, periode",
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

    colonnes, n_lignes, periode_min, periode_max, lignes = empreinte_candidat
    if colonnes != COLONNES_EXPORT:
        raise PublicationErreur(
            f"schéma invalide : attendu {COLONNES_EXPORT}, reçu {colonnes}"
        )
    if "valeur_indice" in colonnes:
        raise PublicationErreur("niveau territorial interdit : valeur_indice présent")

    idx_poste = colonnes.index("poste")
    postes = {ligne[idx_poste] for ligne in lignes}

    return {
        "colonnes": colonnes,
        "n_lignes": n_lignes,
        "n_postes": len(postes),
        "periode_min": periode_min,
        "periode_max": periode_max,
    }


def publier(
    *,
    chemin_base: Path = CHEMIN_BASE_DEFAUT,
    chemin_destination: Path = CHEMIN_DESTINATION_DEFAUT,
    lancer_verification: Callable[[], int] | None = None,
    exporter: Callable[..., Path] | None = None,
    remplacer: Callable[[Path, Path], None] | None = None,
    racine: Path = RACINE,
) -> dict:
    """Vérifier → exporter → valider → remplacer. os.replace est la dernière mutation."""
    if lancer_verification is None:

        def lancer_verification() -> int:
            return lancer_make_verify(racine)

    code = lancer_verification()
    if code != 0:
        raise PublicationErreur(
            f"vérification échouée : make verify a renvoyé le code {code}"
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
        raise PublicationErreur("publication incomplete : destination absente après remplacement")

    taille = chemin_destination.stat().st_size
    empreinte = _sha256_fichier(chemin_destination)
    resume = {
        "chemin": str(chemin_destination),
        "taille": taille,
        "sha256": empreinte,
        "n_lignes": meta["n_lignes"],
        "n_postes": meta["n_postes"],
        "periode_min": meta["periode_min"],
        "periode_max": meta["periode_max"],
    }
    return resume


def afficher_succes(resume: dict) -> None:
    print(
        f"publié : {resume['chemin']}\n"
        f"taille : {resume['taille']} octets\n"
        f"sha256 : {resume['sha256']}\n"
        f"lignes : {resume['n_lignes']}\n"
        f"postes : {resume['n_postes']}\n"
        f"période : {resume['periode_min']} → {resume['periode_max']}"
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
