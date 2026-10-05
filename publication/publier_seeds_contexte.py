"""Publication Parquet des seeds de contexte.

Même enchaînement que la publication IPC : dbt vert, export candidat,
relecture, os.replace en dernier. N'écrit pas les Parquet IPC ni carburants.
"""

from __future__ import annotations

import hashlib
import os
import subprocess
import sys
import uuid
from pathlib import Path

import duckdb

RACINE = Path(__file__).resolve().parents[1]
CHEMIN_BASE_DEFAUT = RACINE / "build" / "panyen.duckdb"
DOSSIER_DESTINATION = RACINE / "web" / "public" / "data"

# (table duckdb, fichier, colonnes dans l'ordre du seed, clause order by)
TABLES: tuple[tuple[str, str, tuple[str, ...], str], ...] = (
    (
        "ecsp_niveaux",
        "ecsp_niveaux.parquet",
        (
            "annee_enquete",
            "poste",
            "ecart_fisher_pct",
            "precision_pct",
            "source_url",
            "consulte_le",
            "remarque",
        ),
        "annee_enquete, poste",
    ),
    (
        "ecsp_alimentation_formules",
        "ecsp_alimentation_formules.parquet",
        (
            "annee_enquete",
            "formule",
            "ecart_pct",
            "source_url",
            "consulte_le",
            "remarque",
        ),
        "annee_enquete, formule",
    ),
    (
        "revenus_ecart_national",
        "revenus_ecart_national.parquet",
        (
            "annee",
            "indicateur",
            "ecart_moyenne_nationale_pct",
            "source_url",
            "consulte_le",
            "champ",
        ),
        "annee, indicateur",
    ),
    (
        "evenements_contexte",
        "evenements_contexte.parquet",
        (
            "date_evenement",
            "precision_date",
            "titre",
            "type_evenement",
            "postes_concernes",
            "url_source",
            "type_source",
            "consulte_le",
        ),
        "date_evenement, titre",
    ),
)


class PublicationErreur(Exception):
    """Échec bruyant de la publication des seeds."""


def _sha256(chemin: Path) -> str:
    return hashlib.sha256(chemin.read_bytes()).hexdigest()


def _sql_liste(colonnes: tuple[str, ...]) -> str:
    return ", ".join(colonnes)


def lancer_dbt(racine: Path = RACINE) -> int:
    """Seeds nouveaux et événements, avec leurs tests. Pas le pipeline carburants."""
    resultat = subprocess.run(
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
            "ecsp_niveaux+",
            "ecsp_alimentation_formules+",
            "revenus_ecart_national+",
            "evenements_contexte+",
        ],
        cwd=racine,
        check=False,
    )
    return resultat.returncode


def _exporter_une_table(
    connexion: duckdb.DuckDBPyConnection,
    nom: str,
    colonnes: tuple[str, ...],
    ordre: str,
    candidat: Path,
) -> tuple:
    liste = _sql_liste(colonnes)
    sql = f"select {liste} from {nom} order by {ordre}"
    curseur = connexion.execute(sql)
    recues = tuple(col[0] for col in curseur.description)
    lignes = curseur.fetchall()
    if recues != colonnes:
        raise PublicationErreur(f"schéma inattendu pour {nom} : {recues}")
    if not lignes:
        raise PublicationErreur(f"table vide : {nom}")
    chemin_sql = str(candidat).replace("'", "''")
    connexion.execute(
        f"copy ({sql}) to '{chemin_sql}' (format parquet, compression zstd)"
    )
    return recues, lignes


def _relire(candidat: Path, colonnes: tuple[str, ...], ordre: str) -> tuple:
    liste = _sql_liste(colonnes)
    chemin_sql = str(candidat).replace("'", "''")
    connexion = duckdb.connect()
    try:
        curseur = connexion.execute(
            f"select {liste} from read_parquet('{chemin_sql}') order by {ordre}"
        )
        recues = tuple(col[0] for col in curseur.description)
        lignes = curseur.fetchall()
    finally:
        connexion.close()
    return recues, lignes


def publier_tables(
    *,
    chemin_base: Path = CHEMIN_BASE_DEFAUT,
    dossier: Path = DOSSIER_DESTINATION,
    lancer_verification=lancer_dbt,
) -> list[dict]:
    """dbt vert, puis un Parquet par seed. os.replace est la dernière écriture."""
    code = lancer_verification()
    if code != 0:
        raise PublicationErreur(f"dbt a renvoyé le code {code}")
    if not chemin_base.is_file():
        raise PublicationErreur(f"base absente : {chemin_base}")

    dossier.mkdir(parents=True, exist_ok=True)
    resumes: list[dict] = []
    connexion = duckdb.connect(str(chemin_base), read_only=True)
    try:
        for nom, fichier, colonnes, ordre in TABLES:
            destination = dossier / fichier
            candidat = dossier / f".{nom}.{uuid.uuid4().hex}.parquet.tmp"
            try:
                empreinte = _exporter_une_table(
                    connexion, nom, colonnes, ordre, candidat
                )
                relu = _relire(candidat, colonnes, ordre)
                if relu != empreinte:
                    raise PublicationErreur(
                        f"validation échouée : {nom} ne correspond pas au candidat"
                    )
                os.replace(candidat, destination)
            except Exception:
                if candidat.exists():
                    candidat.unlink()
                raise
            resumes.append(
                {
                    "table": nom,
                    "chemin": str(destination),
                    "lignes": len(empreinte[1]),
                    "colonnes": list(colonnes),
                    "sha256": _sha256(destination),
                }
            )
    finally:
        connexion.close()
    return resumes


def main() -> int:
    try:
        resumes = publier_tables()
    except PublicationErreur as exc:
        print(f"erreur de publication : {exc}", file=sys.stderr)
        return 1
    for resume in resumes:
        print(
            f"publié : {resume['chemin']}\n"
            f"lignes : {resume['lignes']}\n"
            f"colonnes : {', '.join(resume['colonnes'])}\n"
            f"sha256 : {resume['sha256']}"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
