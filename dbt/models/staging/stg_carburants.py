"""stg_carburants — relevés nationaux bruts après parsing ZIP/XML.

Grain : (fichier_source, membre_zip, id_station, carburant_national, releve_utc).
Métropole seulement (filtre code postal) ; aucune enseigne.
"""

from __future__ import annotations

import tempfile
from dataclasses import fields
from pathlib import Path

from transformation.carburants import (
    DOSSIER_BRUT_NATIONAL,
    ObservationCarburant,
    RACINE_DEPOT,
    ecrire_lot_ndjson,
    iterer_zip,
    lister_zips_historiques,
)

DDL = """
CREATE TEMP TABLE _stg_carburants (
    fichier_source VARCHAR,
    sha256_source VARCHAR,
    collecte_utc TIMESTAMPTZ,
    membre_zip VARCHAR,
    id_station VARCHAR,
    code_postal VARCHAR,
    commune VARCHAR,
    latitude DECIMAL(12, 7),
    longitude DECIMAL(12, 7),
    carburant_national VARCHAR,
    id_carburant VARCHAR,
    releve_utc TIMESTAMPTZ,
    prix_eur_litre DECIMAL(12, 4)
)
"""

COLONNES = [champ.name for champ in fields(ObservationCarburant)]
TAILLE_LOT = 500_000
_COLUMNS_VARCHAR = "{" + ", ".join(f"{c}: 'VARCHAR'" for c in COLONNES) + "}"


def _inserer_lot_ndjson(session, observations, dossier_tmp: Path, indice: int) -> None:
    if not observations:
        return
    chemin = dossier_tmp / f"lot_{indice:05d}.ndjson"
    ecrire_lot_ndjson(observations, chemin)
    cols = ", ".join(COLONNES)
    session.execute(
        f"INSERT INTO _stg_carburants ({cols}) "
        f"SELECT {cols} FROM read_json(?, format='newline_delimited', "
        f"columns={_COLUMNS_VARCHAR})",
        [str(chemin)],
    )


def model(dbt, session):
    dbt.config(materialized="table")
    session.execute(DDL)
    dossier_build = RACINE_DEPOT / "build"
    dossier_build.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=dossier_build) as tmp:
        dossier_tmp = Path(tmp)
        indice = 0
        for chemin in lister_zips_historiques(DOSSIER_BRUT_NATIONAL):
            lot: list[ObservationCarburant] = []
            for obs in iterer_zip(chemin, racine=RACINE_DEPOT):
                lot.append(obs)
                if len(lot) >= TAILLE_LOT:
                    _inserer_lot_ndjson(session, lot, dossier_tmp, indice)
                    indice += 1
                    lot = []
            if lot:
                _inserer_lot_ndjson(session, lot, dossier_tmp, indice)
                indice += 1
    return session.table("_stg_carburants")
