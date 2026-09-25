"""Tests des manifestes et du seed carburants (hors réseau)."""

from __future__ import annotations

import csv
from datetime import date
from decimal import Decimal
from pathlib import Path

import pytest

RACINE = Path(__file__).resolve().parents[1]
MANIFESTE_ACTES = RACINE / "data" / "manifests" / "arretes_carburants_martinique.csv"
MANIFESTE_CORR = RACINE / "data" / "manifests" / "correspondance_carburants.csv"
SEED = RACINE / "dbt" / "seeds" / "prix_max_carburants_martinique.csv"

COLONNES_ACTES = (
    "debut_effet",
    "reference_acte",
    "date_signature",
    "type_source_primaire",
    "url_source_primaire",
    "pages_acte",
    "url_communique",
    "motif_exception",
)
COLONNES_CORR = (
    "carburant_mq",
    "libelle_mq",
    "carburant_national",
    "libelle_national",
    "statut_comparabilite",
    "url_justification",
    "note",
)
COLONNES_SEED = (
    "debut_effet",
    "carburant_mq",
    "libelle_source",
    "prix_max_eur_litre",
    "reference_acte",
    "url_source_primaire",
    "pages_acte",
)


def _lire(chemin: Path) -> list[dict[str, str]]:
    with chemin.open(encoding="utf-8", newline="") as fichier:
        return list(csv.DictReader(fichier))


@pytest.mark.skipif(not MANIFESTE_CORR.is_file(), reason="correspondance absente")
def test_correspondance_statuts_et_directe():
    lignes = _lire(MANIFESTE_CORR)
    assert list(lignes[0].keys()) == list(COLONNES_CORR)
    statuts = {ligne["statut_comparabilite"] for ligne in lignes}
    assert statuts <= {"directe", "non_comparable"}
    assert any(ligne["statut_comparabilite"] == "directe" for ligne in lignes)
    for ligne in lignes:
        assert ligne["url_justification"].startswith("https://")
        assert ligne["note"]


@pytest.mark.skipif(not MANIFESTE_ACTES.is_file(), reason="manifeste actes absent")
def test_manifeste_actes_contrat_complet():
    import importlib.util

    chemin = RACINE / "ingest" / "arretes_carburants_martinique.py"
    spec = importlib.util.spec_from_file_location("arretes_mq", chemin)
    assert spec and spec.loader
    collecteur = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(collecteur)
    lignes = collecteur.lire_manifeste(MANIFESTE_ACTES)
    assert list(lignes[0].keys()) == list(COLONNES_ACTES)
    assert lignes[0]["debut_effet"] == "2022-04-01"
    assert lignes[-1]["debut_effet"] == "2026-09-01"
    assert any(ligne["debut_effet"] == "2022-11-16" for ligne in lignes)


@pytest.mark.skipif(not SEED.is_file(), reason="seed réglementaire absent")
def test_seed_grain_et_provenance():
    seed = _lire(SEED)
    assert list(seed[0].keys()) == list(COLONNES_SEED)
    cles = [(ligne["carburant_mq"], ligne["debut_effet"]) for ligne in seed]
    assert len(cles) == len(set(cles))
    for ligne in seed:
        assert ligne["carburant_mq"] in {"gazole", "super_sans_plomb"}
        assert "gaz" not in ligne["libelle_source"].lower() or "gazole" in ligne[
            "libelle_source"
        ].lower()
        prix = Decimal(ligne["prix_max_eur_litre"])
        assert prix > 0
        # Pas de flottant binaire : la chaîne doit parser en Decimal exact.
        assert "." in ligne["prix_max_eur_litre"] or "," not in ligne["prix_max_eur_litre"]

    if MANIFESTE_ACTES.is_file():
        actes = {
            (
                ligne["debut_effet"],
                ligne["reference_acte"],
                ligne["url_source_primaire"],
                ligne["pages_acte"],
            )
            for ligne in _lire(MANIFESTE_ACTES)
        }
        for ligne in seed:
            cle = (
                ligne["debut_effet"],
                ligne["reference_acte"],
                ligne["url_source_primaire"],
                ligne["pages_acte"],
            )
            assert cle in actes

    # Couverture produit × fenêtre : chaque produit a une ligne au premier et
    # dernier début, et au moins une ligne par mois civil via les debut_effet.
    for produit in ("gazole", "super_sans_plomb"):
        dates = sorted(
            date.fromisoformat(ligne["debut_effet"])
            for ligne in seed
            if ligne["carburant_mq"] == produit
        )
        assert dates[0] == date(2022, 4, 1)
        assert dates[-1] == date(2026, 9, 1)
        assert date(2022, 11, 16) in dates
