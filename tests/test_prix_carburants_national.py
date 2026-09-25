"""Tests du collecteur national carburants : brut intact, sans réseau réel."""

from __future__ import annotations

import hashlib
import importlib.util
import io
import json
from datetime import datetime, timezone
from pathlib import Path
import urllib.error
import urllib.request
import zipfile

import pytest

CHEMIN_COLLECTEUR = (
    Path(__file__).resolve().parents[1] / "ingest" / "prix_carburants_national.py"
)
_spec = importlib.util.spec_from_file_location(
    "prix_carburants_national", CHEMIN_COLLECTEUR
)
assert _spec is not None and _spec.loader is not None
collecteur = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(collecteur)

INSTANT = datetime(2026, 9, 10, 12, 0, 0, tzinfo=timezone.utc)
URLS_ATTENDUES = (
    "https://donnees.roulez-eco.fr/opendata/annee/2022",
    "https://donnees.roulez-eco.fr/opendata/annee/2023",
    "https://donnees.roulez-eco.fr/opendata/annee/2024",
    "https://donnees.roulez-eco.fr/opendata/annee/2025",
    "https://donnees.roulez-eco.fr/opendata/annee",
    "https://donnees.roulez-eco.fr/opendata/jour",
)


def _zip_sur(membres: dict[str, bytes]) -> bytes:
    tampon = io.BytesIO()
    with zipfile.ZipFile(tampon, "w") as archive:
        for nom, contenu in membres.items():
            archive.writestr(nom, contenu)
    return tampon.getvalue()


ZIP_SUR = _zip_sur({"PrixCarburants_annuel_2022.xml": b"<pdv_liste/>"})
ZIP_HTML = b"<!DOCTYPE html><html><body>pas un zip</body></html>"
ZIP_SANS_XML = _zip_sur({"readme.txt": b"rien"})
ZIP_MEMBRE_DANGEREUX = _zip_sur({"../evil.xml": b"<pdv_liste/>"})
ZIP_MEMBRE_ABSOLU = _zip_sur({"/tmp/evil.xml": b"<pdv_liste/>"})


class FauxReponse:
    def __init__(self, contenu: bytes) -> None:
        self._contenu = contenu

    def read(self) -> bytes:
        return self._contenu


@pytest.fixture
def brut(tmp_path, monkeypatch):
    dossier = tmp_path / "data" / "raw" / "carburants" / "national"
    monkeypatch.setattr(collecteur, "RACINE", tmp_path)
    monkeypatch.setattr(collecteur, "BRUT", dossier)
    return dossier


@pytest.fixture
def horloge(monkeypatch):
    monkeypatch.setattr(collecteur, "maintenant_utc", lambda: INSTANT)


def brancher_transport(monkeypatch, contenus: dict[str, bytes] | None = None, erreur=None):
    contenus = contenus or {url: ZIP_SUR for url in URLS_ATTENDUES}
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
        url = requete.full_url
        if url not in contenus:
            raise urllib.error.URLError(f"URL inattendue : {url}")
        return FauxReponse(contenus[url])

    monkeypatch.setattr(urllib.request, "urlopen", faux_urlopen)
    return appels


def test_six_url_nationales_exactes(monkeypatch, brut, horloge):
    appels = brancher_transport(monkeypatch)
    collecteur.collecter()
    assert [a["url"] for a in appels] == list(URLS_ATTENDUES)
    for appel in appels:
        assert appel["timeout"] == collecteur.TIMEOUT_S
        assert "panyen" in appel["headers"].get("User-agent", "").lower()


def test_ecriture_octet_pour_octet_et_sidecar(monkeypatch, brut, horloge):
    payload = ZIP_SUR
    brancher_transport(monkeypatch, {url: payload for url in URLS_ATTENDUES})
    resultats = collecteur.collecter()
    assert len(resultats) == 6
    for resultat in resultats:
        chemin = Path(resultat["chemin"])
        assert chemin.read_bytes() == payload
        sidecar = chemin.with_suffix(chemin.suffix + ".json")
        if chemin.suffix == ".zip":
            sidecar = Path(str(chemin) + ".json")
        meta = json.loads(sidecar.read_text(encoding="utf-8"))
        assert meta["url"] == resultat["url"]
        assert meta["taille_octets"] == len(payload)
        assert meta["sha256"] == hashlib.sha256(payload).hexdigest()
        assert meta["categorie"]
        assert meta["nom_brut"] == chemin.name
        assert meta["collecte_utc"].endswith("Z")


def test_zip_synthetique_sur_accepte(monkeypatch, brut, horloge):
    brancher_transport(monkeypatch)
    resultats = collecteur.collecter()
    assert len(resultats) == 6


def test_refus_reponse_vide(monkeypatch, brut, horloge):
    brancher_transport(monkeypatch, {url: b"" for url in URLS_ATTENDUES})
    with pytest.raises(ValueError, match="vide"):
        collecteur.collecter()
    assert not brut.exists() or list(brut.iterdir()) == []


def test_refus_zip_invalide(monkeypatch, brut, horloge):
    brancher_transport(monkeypatch, {url: ZIP_HTML for url in URLS_ATTENDUES})
    with pytest.raises(ValueError, match="ZIP|zip|HTML|html"):
        collecteur.collecter()


def test_refus_sans_membre_xml(monkeypatch, brut, horloge):
    brancher_transport(monkeypatch, {url: ZIP_SANS_XML for url in URLS_ATTENDUES})
    with pytest.raises(ValueError, match="XML|xml"):
        collecteur.collecter()


def test_refus_membre_chemin_relatif_dangereux(monkeypatch, brut, horloge):
    brancher_transport(monkeypatch, {url: ZIP_MEMBRE_DANGEREUX for url in URLS_ATTENDUES})
    with pytest.raises(ValueError, match=r"\.\.|dangereux|absolu"):
        collecteur.collecter()


def test_refus_membre_absolu(monkeypatch, brut, horloge):
    brancher_transport(monkeypatch, {url: ZIP_MEMBRE_ABSOLU for url in URLS_ATTENDUES})
    with pytest.raises(ValueError, match=r"absolu|\.\.|dangereux"):
        collecteur.collecter()


def test_collision_sans_ecrasement(monkeypatch, brut, horloge):
    brancher_transport(monkeypatch)
    brut.mkdir(parents=True)
    premier = collecteur.RESSOURCES[0]
    nom = collecteur.nom_brut(premier["identifiant"], INSTANT)
    cible = brut / nom
    cible.write_bytes(b"deja la")
    with pytest.raises(FileExistsError):
        collecteur.collecter()
    assert cible.read_bytes() == b"deja la"


def test_dry_run_sans_ecriture(monkeypatch, brut, horloge, capsys):
    brancher_transport(monkeypatch)
    resultats = collecteur.collecter(dry_run=True)
    assert resultats == []
    assert not brut.exists()
    sortie = capsys.readouterr().out
    assert "dry-run" in sortie
    assert "aucune écriture" in sortie


def test_erreur_reseau_sans_faux_succes(monkeypatch, brut, horloge):
    brancher_transport(
        monkeypatch,
        erreur=urllib.error.URLError("réseau coupé"),
    )
    with pytest.raises(urllib.error.URLError):
        collecteur.collecter()
    assert not brut.exists() or list(brut.iterdir()) == []
