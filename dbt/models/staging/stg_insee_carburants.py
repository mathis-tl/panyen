"""stg_insee_carburants — prix moyen mensuel Insee gazole métropole (000442588).

Grain : (fichier_source, idbank, periode).
"""

from __future__ import annotations

from dataclasses import astuple

from transformation.sdmx_carburants import DOSSIER_BRUT_INSEE, RACINE_DEPOT, parser_repertoire

DDL = """
CREATE TEMP TABLE _stg_insee_carburants (
    fichier_source VARCHAR,
    collecte_utc TIMESTAMPTZ,
    idbank VARCHAR,
    periode DATE,
    prix_moyen_eur_litre DOUBLE,
    statut_observation VARCHAR,
    titre VARCHAR,
    unite_mesure VARCHAR
)
"""


def _relation(session, observations):
    session.execute(DDL)
    session.executemany(
        f"INSERT INTO _stg_insee_carburants VALUES ({', '.join(['?'] * 8)})",
        [astuple(obs) for obs in observations],
    )
    return session.table("_stg_insee_carburants")


def model(dbt, session):
    dbt.config(materialized="table")
    observations = parser_repertoire(DOSSIER_BRUT_INSEE, racine=RACINE_DEPOT)
    return _relation(session, observations)
