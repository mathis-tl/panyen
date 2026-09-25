"""Tests du collecteur d'actes carburants martiniquais, sans réseau réel."""

from __future__ import annotations

import csv
import hashlib
import importlib.util
import json
from datetime import datetime, timezone
from pathlib import Path
import urllib.error
import urllib.request

import pytest

CHEMIN_COLLECTEUR = (
    Path(__file__).resolve().parents[1]
    / "ingest"
    / "arretes_carburants_martinique.py"
)
_spec = importlib.util.spec_from_file_location(
    "arretes_carburants_martinique", CHEMIN_COLLECTEUR
)
assert _spec is not None and _spec.loader is not None
collecteur = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(collecteur)

INSTANT = datetime(2026, 9, 10, 13, 0, 0, tzinfo=timezone.utc)

COLONNES_MANIFESTE = (
    "debut_effet",
    "reference_acte",
    "date_signature",
    "type_source_primaire",
    "url_source_primaire",
    "pages_acte",
    "url_communique",
    "motif_exception",
)


class FauxReponse:
    def __init__(self, contenu: bytes) -> None:
        self._contenu = contenu

    def read(self) -> bytes:
        return self._contenu


def ecrire_manifeste(chemin: Path, lignes: list[dict]) -> None:
    chemin.parent.mkdir(parents=True, exist_ok=True)
    with chemin.open("w", encoding="utf-8", newline="") as fichier:
        ecrivain = csv.DictWriter(fichier, fieldnames=COLONNES_MANIFESTE)
        ecrivain.writeheader()
        for ligne in lignes:
            ecrivain.writerow(ligne)


@pytest.fixture
def environnement(tmp_path, monkeypatch):
    manifeste = tmp_path / "data" / "manifests" / "arretes_carburants_martinique.csv"
    brut = tmp_path / "data" / "raw" / "carburants" / "martinique"
    monkeypatch.setattr(collecteur, "RACINE", tmp_path)
    monkeypatch.setattr(collecteur, "MANIFESTE", manifeste)
    monkeypatch.setattr(collecteur, "BRUT", brut)
    monkeypatch.setattr(collecteur, "maintenant_utc", lambda: INSTANT)
    return {"manifeste": manifeste, "brut": brut}


def brancher_transport(monkeypatch, contenus: dict[str, bytes], erreur=None):
    appels = []

    def faux_urlopen(requete, timeout=None):
        appels.append(
            {
                "url": requete.full_url,
                "headers": dict(requete.header_items()),
                "timeout": timeout,
            }
        )
        if erreur is not None:
            raise erreur
        if requete.full_url not in contenus:
            raise urllib.error.URLError(f"URL inattendue : {requete.full_url}")
        return FauxReponse(contenus[requete.full_url])

    monkeypatch.setattr(urllib.request, "urlopen", faux_urlopen)
    return appels


def ligne_valide(**kwargs) -> dict:
    base = {
        "debut_effet": "2022-04-01",
        "reference_acte": "R02-2022-03-31-00001",
        "date_signature": "2022-03-31",
        "type_source_primaire": "raa",
        "url_source_primaire": "https://www.martinique.gouv.fr/contenu/telechargement/1/a.pdf",
        "pages_acte": "3-7",
        "url_communique": "https://martinique.deets.gouv.fr/sites/x/cp.pdf",
        "motif_exception": "",
    }
    base.update(kwargs)
    return base


def manifeste_couverture_minimale() -> list[dict]:
    """Une date d'effet par mois civil, avec 2022-11-16 à la place du 1er novembre."""
    from datetime import date

    lignes = []
    curseur = date(2022, 4, 1)
    fin = date(2026, 9, 1)
    url = "https://www.martinique.gouv.fr/contenu/telechargement/1/a.pdf"
    while curseur <= fin:
        debut = (
            date(2022, 11, 16)
            if (curseur.year, curseur.month) == (2022, 11)
            else curseur
        )
        ref = f"R02-{debut.year}-{debut.month:02d}-01-00001"
        lignes.append(
            ligne_valide(
                debut_effet=debut.isoformat(),
                reference_acte=ref,
                date_signature=debut.isoformat(),
                url_source_primaire=url,
                url_communique="",
                pages_acte="3-7",
            )
        )
        if curseur.month == 12:
            curseur = date(curseur.year + 1, 1, 1)
        else:
            curseur = date(curseur.year, curseur.month + 1, 1)
    return lignes


def test_deduplication_url_primaire_unique(monkeypatch, environnement):
    url = "https://www.martinique.gouv.fr/contenu/telechargement/1/a.pdf"
    lignes = manifeste_couverture_minimale()
    # Deuxième ligne du même mois d'avril pour forcer la dédup d'URL déjà présente.
    lignes.insert(
        1,
        ligne_valide(
            debut_effet="2022-04-15",
            reference_acte="R02-2022-04-14-00001",
            date_signature="2022-04-14",
            url_source_primaire=url,
            pages_acte="8-12",
            url_communique="",
        ),
    )
    ecrire_manifeste(environnement["manifeste"], lignes)
    appels = brancher_transport(monkeypatch, {url: b"%PDF-1.4 primaire"})
    resultats = collecteur.collecter()
    urls = [a["url"] for a in appels]
    assert urls.count(url) == 1
    assert len(resultats) == 1


def test_communiques_ranges_a_part(monkeypatch, environnement):
    lignes = manifeste_couverture_minimale()
    for ligne in lignes:
        ligne["url_communique"] = "https://martinique.deets.gouv.fr/sites/x/cp.pdf"
    ecrire_manifeste(environnement["manifeste"], lignes)
    brancher_transport(
        monkeypatch,
        {
            "https://www.martinique.gouv.fr/contenu/telechargement/1/a.pdf": b"%PDF-prim",
            "https://martinique.deets.gouv.fr/sites/x/cp.pdf": b"%PDF-cp",
        },
    )
    collecteur.collecter()
    primaires = list((environnement["brut"] / "primaires").glob("*.pdf"))
    secondaires = list((environnement["brut"] / "communiques").glob("*.pdf"))
    assert len(primaires) == 1
    assert len(secondaires) == 1
    sidecar = Path(str(primaires[0]) + ".json")
    meta = json.loads(sidecar.read_text(encoding="utf-8"))
    assert meta["categorie"] == "source_primaire"
    assert meta["sha256"] == hashlib.sha256(b"%PDF-prim").hexdigest()


def test_dry_run_sans_ecriture(monkeypatch, environnement, capsys):
    ecrire_manifeste(environnement["manifeste"], manifeste_couverture_minimale())
    brancher_transport(
        monkeypatch,
        {
            "https://www.martinique.gouv.fr/contenu/telechargement/1/a.pdf": b"%PDF-prim",
        },
    )
    assert collecteur.collecter(dry_run=True) == []
    assert not environnement["brut"].exists()
    assert "aucune écriture" in capsys.readouterr().out


def test_erreur_reseau_sans_faux_succes(monkeypatch, environnement):
    ecrire_manifeste(environnement["manifeste"], manifeste_couverture_minimale())
    brancher_transport(
        monkeypatch,
        {},
        erreur=urllib.error.URLError("réseau coupé"),
    )
    with pytest.raises(urllib.error.URLError):
        collecteur.collecter()
    assert not environnement["brut"].exists() or list(environnement["brut"].rglob("*")) == []


def test_manifeste_schema_et_bornes(environnement):
    lignes = manifeste_couverture_minimale()
    ecrire_manifeste(environnement["manifeste"], lignes)
    lues = collecteur.lire_manifeste()
    assert lues[0]["debut_effet"] == "2022-04-01"
    assert any(ligne["debut_effet"] == "2022-11-16" for ligne in lues)
    assert lues[-1]["debut_effet"] == "2026-09-01"


def test_manifeste_refuse_hors_borne(environnement):
    lignes = manifeste_couverture_minimale()
    lignes[0]["debut_effet"] = "2022-03-01"
    ecrire_manifeste(environnement["manifeste"], lignes)
    with pytest.raises(ValueError, match="borne|2022-04-01"):
        collecteur.lire_manifeste()


def test_manifeste_exige_2022_11_16(environnement):
    lignes = manifeste_couverture_minimale()
    for ligne in lignes:
        if ligne["debut_effet"] == "2022-11-16":
            ligne["debut_effet"] = "2022-11-01"
            ligne["reference_acte"] = "R02-2022-11-01-00001"
            ligne["date_signature"] = "2022-11-01"
    ecrire_manifeste(environnement["manifeste"], lignes)
    with pytest.raises(ValueError, match="2022-11-16"):
        collecteur.lire_manifeste()
