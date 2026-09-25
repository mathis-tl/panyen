"""stg_correspondance_carburants — manifeste versionné des équivalences produit.

Grain : (carburant_mq, carburant_national).
"""

from __future__ import annotations

import csv
from transformation.carburants import RACINE_DEPOT

MANIFESTE = RACINE_DEPOT / "data" / "manifests" / "correspondance_carburants.csv"

COLONNES = (
    "carburant_mq",
    "libelle_mq",
    "carburant_national",
    "libelle_national",
    "statut_comparabilite",
    "url_justification",
    "note",
)


def model(dbt, session):
    dbt.config(materialized="table")
    if not MANIFESTE.is_file():
        raise FileNotFoundError(f"manifeste de correspondance introuvable : {MANIFESTE}")
    with MANIFESTE.open(encoding="utf-8", newline="") as fichier:
        lecteur = csv.DictReader(fichier)
        if list(lecteur.fieldnames or ()) != list(COLONNES):
            raise ValueError(
                f"schéma correspondance invalide : {lecteur.fieldnames}"
            )
        lignes = [{c: (row.get(c) or "").strip() for c in COLONNES} for row in lecteur]
    session.execute(
        """
        CREATE TEMP TABLE _stg_correspondance_carburants (
            carburant_mq VARCHAR,
            libelle_mq VARCHAR,
            carburant_national VARCHAR,
            libelle_national VARCHAR,
            statut_comparabilite VARCHAR,
            url_justification VARCHAR,
            note VARCHAR
        )
        """
    )
    session.executemany(
        f"INSERT INTO _stg_correspondance_carburants VALUES ({', '.join(['?'] * 7)})",
        [tuple(ligne[c] for c in COLONNES) for ligne in lignes],
    )
    return session.table("_stg_correspondance_carburants")
