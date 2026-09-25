"""Tests de publication atomique carburants.parquet."""

from __future__ import annotations

import hashlib
from pathlib import Path

import duckdb
import pytest

from publication import publier_carburants as pub

CONTENU_SAIN = b"PARQUET-CARBURANTS-SAIN-v1"


def sha256(chemin: Path) -> str:
    return hashlib.sha256(chemin.read_bytes()).hexdigest()


def creer_base(chemin_db: Path, *, creer_table: bool = True, lignes: list | None = None) -> Path:
    chemin_db.parent.mkdir(parents=True, exist_ok=True)
    if lignes is None:
        lignes = [
            {
                "type_ligne": "distribution_metropole",
                "carburant": "Gazole",
                "libelle_carburant": "Gazole",
                "date_reference": "2022-04-01",
                "mois_complet": True,
                "q10_eur_litre": 1.5,
                "q25_eur_litre": 1.6,
                "mediane_eur_litre": 1.7,
                "q75_eur_litre": 1.8,
                "q90_eur_litre": 1.9,
                "nombre_stations": 100,
                "prix_max_mq_eur_litre": None,
                "fin_effet_exclusive": None,
                "reference_acte": None,
                "url_source_primaire": None,
                "collecte_utc_nationale": "2026-09-10 12:00:00+00",
            },
            {
                "type_ligne": "plafond_martinique",
                "carburant": "gazole",
                "libelle_carburant": "Gazole",
                "date_reference": "2022-04-01",
                "mois_complet": None,
                "q10_eur_litre": None,
                "q25_eur_litre": None,
                "mediane_eur_litre": None,
                "q75_eur_litre": None,
                "q90_eur_litre": None,
                "nombre_stations": None,
                "prix_max_mq_eur_litre": 1.55,
                "fin_effet_exclusive": "2022-05-01",
                "reference_acte": "R02-TEST",
                "url_source_primaire": "https://www.martinique.gouv.fr/x.pdf",
                "collecte_utc_nationale": None,
            },
        ]
    con = duckdb.connect(str(chemin_db))
    if creer_table:
        con.execute(
            """
            create table fct_comparaison_carburants (
              type_ligne varchar,
              carburant varchar,
              libelle_carburant varchar,
              date_reference date,
              mois_complet boolean,
              q10_eur_litre double,
              q25_eur_litre double,
              mediane_eur_litre double,
              q75_eur_litre double,
              q90_eur_litre double,
              nombre_stations bigint,
              prix_max_mq_eur_litre double,
              fin_effet_exclusive date,
              reference_acte varchar,
              url_source_primaire varchar,
              collecte_utc_nationale timestamptz
            )
            """
        )
        for ligne in lignes:
            con.execute(
                f"insert into fct_comparaison_carburants values ({', '.join(['?'] * 16)})",
                [
                    ligne["type_ligne"],
                    ligne["carburant"],
                    ligne["libelle_carburant"],
                    ligne["date_reference"],
                    ligne["mois_complet"],
                    ligne["q10_eur_litre"],
                    ligne["q25_eur_litre"],
                    ligne["mediane_eur_litre"],
                    ligne["q75_eur_litre"],
                    ligne["q90_eur_litre"],
                    ligne["nombre_stations"],
                    ligne["prix_max_mq_eur_litre"],
                    ligne["fin_effet_exclusive"],
                    ligne["reference_acte"],
                    ligne["url_source_primaire"],
                    ligne["collecte_utc_nationale"],
                ],
            )
    con.close()
    return chemin_db


@pytest.fixture
def environnement(tmp_path):
    base = creer_base(tmp_path / "base.duckdb")
    destination = tmp_path / "carburants.parquet"
    destination.write_bytes(CONTENU_SAIN)
    return {"base": base, "destination": destination, "sha": sha256(destination)}


def test_echec_verify_conserve_parquet(environnement):
    with pytest.raises(pub.PublicationErreur, match="vérification"):
        pub.publier(
            chemin_base=environnement["base"],
            chemin_destination=environnement["destination"],
            lancer_verification=lambda: 1,
            lancer_build=lambda: 0,
        )
    assert environnement["destination"].read_bytes() == CONTENU_SAIN
    assert sha256(environnement["destination"]) == environnement["sha"]


def test_table_absente_conserve(environnement, tmp_path):
    base_vide = creer_base(tmp_path / "vide.duckdb", creer_table=False)
    with pytest.raises(pub.PublicationErreur, match="absente|vide"):
        pub.publier(
            chemin_base=base_vide,
            chemin_destination=environnement["destination"],
            lancer_verification=lambda: 0,
            lancer_build=lambda: 0,
        )
    assert sha256(environnement["destination"]) == environnement["sha"]


def test_succes_remplacement_en_dernier(environnement, tmp_path):
    appels = []

    def remplacer(src: Path, dst: Path) -> None:
        appels.append("replace")
        dst.write_bytes(src.read_bytes())
        src.unlink()

    resume = pub.publier(
        chemin_base=environnement["base"],
        chemin_destination=environnement["destination"],
        lancer_verification=lambda: 0,
        lancer_build=lambda: 0,
        remplacer=remplacer,
    )
    assert appels == ["replace"]
    assert resume["n_lignes"] == 2
    assert environnement["destination"].is_file()
    assert sha256(environnement["destination"]) != environnement["sha"]
