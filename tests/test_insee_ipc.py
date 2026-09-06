"""Tests du collecteur IPC : brut intact, sans réseau réel."""

from datetime import datetime, timezone
import importlib.util
from pathlib import Path
import urllib.error
import urllib.request

import pytest

CHEMIN_COLLECTEUR = Path(__file__).resolve().parents[1] / "ingest" / "insee_ipc.py"
_spec = importlib.util.spec_from_file_location("insee_ipc", CHEMIN_COLLECTEUR)
assert _spec is not None and _spec.loader is not None
insee_ipc = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(insee_ipc)

XML_MINUSCULE = b"<message>ipc-postes-brut</message>"
URL_ATTENDUE = (
    "https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/"
    "011813726+011813720+011813873+011813867+011813789+011813783"
    "+011813915+011813909?startPeriod=2022-04"
)
ACCEPT = "application/vnd.sdmx.structurespecificdata+xml;version=2.1"
INSTANT = datetime(2026, 9, 2, 15, 1, 2, tzinfo=timezone.utc)
NOM_UTC = "ipc_postes_2026-09-02T150102Z.xml"
IDBANKS_ACTIFS = (
    "011813726",
    "011813720",
    "011813873",
    "011813867",
    "011813789",
    "011813783",
    "011813915",
    "011813909",
)


class FauxReponse:
    def __init__(self, contenu: bytes) -> None:
        self._contenu = contenu

    def read(self) -> bytes:
        return self._contenu


@pytest.fixture
def brut(tmp_path, monkeypatch):
    dossier = tmp_path / "data" / "raw" / "insee"
    monkeypatch.setattr(insee_ipc, "RACINE", tmp_path)
    monkeypatch.setattr(insee_ipc, "BRUT", dossier)
    return dossier


@pytest.fixture
def horloge(monkeypatch):
    monkeypatch.setattr(
        insee_ipc,
        "maintenant_utc",
        lambda: INSTANT,
        raising=False,
    )


def brancher_transport(monkeypatch, contenu=XML_MINUSCULE, erreur=None):
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
        return FauxReponse(contenu)

    monkeypatch.setattr(urllib.request, "urlopen", faux_urlopen)
    return appels


def test_un_seul_appel_huit_series_depuis_avril_2022(monkeypatch, brut, horloge):
    appels = brancher_transport(monkeypatch)
    insee_ipc.collecter()
    assert len(appels) == 1
    appel = appels[0]
    assert appel["url"] == URL_ATTENDUE
    for idbank in IDBANKS_ACTIFS:
        assert idbank in appel["url"]
    assert "011813717" not in appel["url"]
    assert appel["headers"].get("Accept") == ACCEPT
    assert appel["timeout"] == 60


def test_entete_sdmx_et_timeout_explicite(monkeypatch, brut, horloge):
    appels = brancher_transport(monkeypatch)
    insee_ipc.collecter()
    assert len(appels) == 1
    assert appels[0]["headers"].get("Accept") == ACCEPT
    assert appels[0]["timeout"] == 60


def test_depuis_personnalise_dans_l_url(monkeypatch, brut, horloge):
    appels = brancher_transport(monkeypatch)
    insee_ipc.collecter(depuis="2023-01")
    assert len(appels) == 1
    assert appels[0]["url"].endswith("?startPeriod=2023-01")
    assert "011813726+011813720" in appels[0]["url"]
    assert "011813717" not in appels[0]["url"]


def test_ecriture_octet_pour_octet(monkeypatch, brut, horloge):
    payload = b"\x00<?xml brut non parse&\xff>"
    brancher_transport(monkeypatch, contenu=payload)
    cible = insee_ipc.collecter()
    assert cible.read_bytes() == payload


def test_nom_fichier_horodate_utc(monkeypatch, brut, horloge):
    brancher_transport(monkeypatch)
    cible = insee_ipc.collecter()
    assert cible.name == NOM_UTC
    assert cible.parent == brut


def test_dry_run_n_ecrit_rien(monkeypatch, brut, horloge, capsys):
    brancher_transport(monkeypatch)
    resultat = insee_ipc.collecter(dry_run=True)
    sortie = capsys.readouterr().out
    assert resultat is None
    assert not brut.exists()
    for idbank in IDBANKS_ACTIFS:
        assert idbank in sortie
    assert "011813717" not in sortie
    assert f"{len(XML_MINUSCULE)}" in sortie.replace(",", "")
    assert "aucune écriture" in sortie


def test_collision_sans_ecrasement(monkeypatch, brut, horloge):
    brancher_transport(monkeypatch)
    cible = brut / NOM_UTC
    brut.mkdir(parents=True)
    cible.write_bytes(b"deja la")
    with pytest.raises(FileExistsError):
        insee_ipc.collecter()
    assert cible.read_bytes() == b"deja la"


def test_reponse_vide_sans_fichier(monkeypatch, brut, horloge):
    brancher_transport(monkeypatch, contenu=b"")
    with pytest.raises(ValueError, match="vide"):
        insee_ipc.collecter()
    assert not brut.exists() or list(brut.iterdir()) == []


def test_erreur_reseau_sans_fichier(monkeypatch, brut, horloge):
    brancher_transport(
        monkeypatch,
        erreur=urllib.error.URLError("réseau coupé"),
    )
    with pytest.raises(urllib.error.URLError):
        insee_ipc.collecter()
    assert not brut.exists() or list(brut.iterdir()) == []


def test_cli_depuis_et_dry_run(monkeypatch, brut, horloge, capsys):
    appels = brancher_transport(monkeypatch)
    insee_ipc.principal(["--depuis", "2022-04", "--dry-run"])
    assert len(appels) == 1
    assert appels[0]["url"] == URL_ATTENDUE
    assert not brut.exists()
    assert "aucune écriture" in capsys.readouterr().out
