"""Parse les XML SDMX bruts de la série Insee carburants (gazole métropole).

Grain fichier : une série 000442588 par fichier insee_carburants_*.xml.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timezone
from pathlib import Path
import re
from xml.etree import ElementTree as ET

from transformation.sdmx import (
    ErreurSdmx,
    _attr,
    _enfants,
    _nom_local,
    _periode,
    _titre,
    _valeur_indice,
)

IDBANK_GAZOLE_METROPOLE = "000442588"
MOTIF_NOM_BRUT = re.compile(
    r"^insee_carburants_(\d{4}-\d{2}-\d{2}T\d{6}Z)\.xml$"
)
RACINE_DEPOT = Path(__file__).resolve().parent.parent
DOSSIER_BRUT_INSEE = RACINE_DEPOT / "data" / "raw" / "insee"


@dataclass(frozen=True)
class ObservationCarburant:
    fichier_source: str
    collecte_utc: datetime
    idbank: str
    periode: date
    prix_moyen_eur_litre: float | None
    statut_observation: str
    titre: str
    unite_mesure: str


def collecte_utc_depuis_nom(nom: str) -> datetime:
    correspondance = MOTIF_NOM_BRUT.fullmatch(nom)
    if correspondance is None:
        raise ErreurSdmx(f"nom de fichier non conforme : {nom}")
    instant = datetime.strptime(correspondance.group(1), "%Y-%m-%dT%H%M%SZ")
    return instant.replace(tzinfo=timezone.utc)


def _fichier_source(chemin: Path, racine: Path) -> str:
    return chemin.resolve().relative_to(racine.resolve()).as_posix()


def parser_fichier(chemin: Path, *, racine: Path) -> list[ObservationCarburant]:
    collecte_utc = collecte_utc_depuis_nom(chemin.name)
    fichier_source = _fichier_source(chemin, racine)
    try:
        racine_xml = ET.parse(chemin).getroot()
    except ET.ParseError as exc:
        raise ErreurSdmx(f"XML invalide : {chemin.name}") from exc

    series = [el for el in racine_xml.iter() if _nom_local(el.tag) == "Series"]
    if len(series) != 1:
        raise ErreurSdmx(f"série unique attendue dans {chemin.name}")

    serie = series[0]
    idbank = _attr(serie, "IDBANK")
    if idbank != IDBANK_GAZOLE_METROPOLE:
        raise ErreurSdmx(f"idbank attendu {IDBANK_GAZOLE_METROPOLE}, reçu {idbank}")
    if _attr(serie, "FREQ") != "M":
        raise ErreurSdmx(f"fréquence autre que M : {chemin.name}")
    if _attr(serie, "REF_AREA") != "FM":
        raise ErreurSdmx(f"territoire autre que FM : {chemin.name}")

    titre = _titre(serie)
    unite = _attr(serie, "UNIT_MEASURE")
    observations: list[ObservationCarburant] = []
    vus_periode: set[date] = set()
    for obs in _enfants(serie, "Obs"):
        periode = _periode(_attr(obs, "TIME_PERIOD"))
        if periode in vus_periode:
            raise ErreurSdmx(f"doublon du grain dans {chemin.name}")
        vus_periode.add(periode)
        statut = _attr(obs, "OBS_STATUS")
        valeur = _valeur_indice(obs, statut)
        if valeur is None:
            raise ErreurSdmx(f"valeur absente pour {periode} dans {chemin.name}")
        observations.append(
            ObservationCarburant(
                fichier_source=fichier_source,
                collecte_utc=collecte_utc,
                idbank=idbank,
                periode=periode,
                prix_moyen_eur_litre=valeur,
                statut_observation=statut,
                titre=titre,
                unite_mesure=unite,
            )
        )
    return observations


def parser_repertoire(dossier: Path, *, racine: Path) -> list[ObservationCarburant]:
    if not dossier.is_dir():
        raise ErreurSdmx("aucun fichier brut carburants trouvé")
    fichiers = sorted(dossier.glob("insee_carburants_*.xml"))
    if not fichiers:
        raise ErreurSdmx("aucun fichier brut carburants trouvé")
    observations: list[ObservationCarburant] = []
    for fichier in fichiers:
        observations.extend(parser_fichier(fichier, racine=racine))
    return observations
