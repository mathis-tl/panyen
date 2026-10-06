"""Tests collecteur et parseur Insee carburants (hors réseau)."""

from datetime import datetime, timezone
import importlib.util
from pathlib import Path
import urllib.request

import pytest

from transformation.sdmx_carburants import parser_fichier

CHEMIN_COLLECTEUR = Path(__file__).resolve().parents[1] / "ingest" / "insee_ipc.py"
_spec = importlib.util.spec_from_file_location("insee_ipc", CHEMIN_COLLECTEUR)
assert _spec is not None and _spec.loader is not None
insee_ipc = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(insee_ipc)

XML_ECHANTILLON = b"""<?xml version='1.0' encoding='UTF-8'?>
<message:StructureSpecificData xmlns:ss="http://www.sdmx.org/resources/sdmxml/schemas/v2_1/data/structurespecific"
 xmlns:message="http://www.sdmx.org/resources/sdmxml/schemas/v2_1/message">
<message:DataSet>
<Series IDBANK="000442588" FREQ="M" TITLE_FR="Gazole" UNIT_MEASURE="EUROS"
 UNIT_MULT="0" REF_AREA="FM" DECIMALS="2">
<Obs TIME_PERIOD="2026-03" OBS_VALUE="2.06" OBS_STATUS="A" OBS_QUAL="DEF" OBS_TYPE="A"/>
</Series>
</message:DataSet>
</message:StructureSpecificData>"""

URL_CARBURANTS = (
    "https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/000442588?startPeriod=2022-01"
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


def test_parseur_carburants(tmp_path):
    fichier = tmp_path / "insee_carburants_2026-09-30T120000Z.xml"
    fichier.write_bytes(XML_ECHANTILLON)
    obs = parser_fichier(fichier, racine=tmp_path)
    assert len(obs) == 1
    assert obs[0].prix_moyen_eur_litre == 2.06
    assert obs[0].idbank == "000442588"


def test_collecter_carburants_ecrit_brut(brut, monkeypatch):
    def faux_urlopen(requete, timeout=0):
        assert requete.full_url == URL_CARBURANTS
        return FauxReponse(XML_ECHANTILLON)

    instant = datetime(2026, 9, 30, 12, 0, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(urllib.request, "urlopen", faux_urlopen)
    monkeypatch.setattr(insee_ipc, "maintenant_utc", lambda: instant)

    cible = insee_ipc.collecter_carburants()
    assert cible is not None
    assert cible.name == "insee_carburants_2026-09-30T120000Z.xml"
    assert cible.read_bytes() == XML_ECHANTILLON


def test_cli_carburants_depuis_explicite_n_est_pas_remplace(brut, monkeypatch):
    appels = []

    def faux_urlopen(requete, timeout=0):
        appels.append(requete.full_url)
        return FauxReponse(XML_ECHANTILLON)

    monkeypatch.setattr(urllib.request, "urlopen", faux_urlopen)
    insee_ipc.principal(["--carburants", "--depuis", "2022-04", "--dry-run"])
    assert appels == [
        "https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/000442588?startPeriod=2022-04"
    ]
    assert not brut.exists()


def test_cli_carburants_sans_depuis_part_de_janvier(brut, monkeypatch):
    appels = []

    def faux_urlopen(requete, timeout=0):
        appels.append(requete.full_url)
        return FauxReponse(XML_ECHANTILLON)

    monkeypatch.setattr(urllib.request, "urlopen", faux_urlopen)
    insee_ipc.principal(["--carburants", "--dry-run"])
    assert appels == [URL_CARBURANTS]
    assert not brut.exists()


def test_collecter_carburants_sans_ecrasement(brut, monkeypatch):
    def faux_urlopen(_requete, timeout=0):
        return FauxReponse(XML_ECHANTILLON)

    monkeypatch.setattr(urllib.request, "urlopen", faux_urlopen)
    t1 = datetime(2026, 9, 30, 12, 0, 0, tzinfo=timezone.utc)
    t2 = datetime(2026, 9, 30, 13, 0, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(insee_ipc, "maintenant_utc", lambda: t1)
    insee_ipc.collecter_carburants()
    monkeypatch.setattr(insee_ipc, "maintenant_utc", lambda: t2)
    insee_ipc.collecter_carburants()
    assert len(list(brut.glob("insee_carburants_*.xml"))) == 2
