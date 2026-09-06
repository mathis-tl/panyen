"""stg_ipc — observations IPC brutes, une par fichier, idbank et période.

Grain : (fichier_source, idbank, periode).
Cette table décrit les observations SDMX ; elle ne compare jamais les niveaux
d'indice entre territoires. poste et lot_collecte distinguent les lots
alimentaires historiques du lot actif à quatre postes.
"""

from __future__ import annotations

from dataclasses import astuple

from transformation.sdmx import DOSSIER_BRUT_INSEE, RACINE_DEPOT, parser_repertoire

DDL = """
CREATE TEMP TABLE _stg_ipc (
    fichier_source VARCHAR,
    collecte_utc TIMESTAMPTZ,
    idbank VARCHAR,
    poste VARCHAR,
    code_territoire VARCHAR,
    lot_collecte VARCHAR,
    perimetre_reference VARCHAR,
    frequence VARCHAR,
    titre VARCHAR,
    mise_a_jour_source VARCHAR,
    unite_mesure VARCHAR,
    multiplicateur_unite INTEGER,
    decimales INTEGER,
    periode DATE,
    valeur_indice DOUBLE,
    statut_observation VARCHAR,
    qualite_observation VARCHAR,
    type_observation VARCHAR
)
"""


def _relation(session, observations):
    session.execute(DDL)
    session.executemany(
        f"INSERT INTO _stg_ipc VALUES ({', '.join(['?'] * 18)})",
        [astuple(obs) for obs in observations],
    )
    return session.table("_stg_ipc")


def model(dbt, session):
    dbt.config(materialized="table")
    observations = parser_repertoire(DOSSIER_BRUT_INSEE, racine=RACINE_DEPOT)
    return _relation(session, observations)
