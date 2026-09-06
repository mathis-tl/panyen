"""Parse les XML SDMX-ML 2.1 bruts de l'IPC Insee.

Ce module ne télécharge rien et ne modifie jamais le brut : il lit, il structure,
il échoue bruyamment. Il accepte les lots alimentaires historiques
({011813726, 011813717} ou {011813726, 011813720}) et le lot actif des huit
séries (quatre postes). Il ne compare pas les niveaux d'indice entre territoires.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timezone
from pathlib import Path
import re
from xml.etree import ElementTree as ET

# idbank → (poste, code_territoire). Neuf entrées : huit actives + FE historique.
IDBANK_REFERENTIEL: dict[str, tuple[str, str]] = {
    "011813726": ("alimentation", "D972"),
    "011813717": ("alimentation", "FE"),
    "011813720": ("alimentation", "FM"),
    "011813873": ("energie", "D972"),
    "011813867": ("energie", "FM"),
    "011813789": ("produits_manufactures", "D972"),
    "011813783": ("produits_manufactures", "FM"),
    "011813915": ("services", "D972"),
    "011813909": ("services", "FM"),
}

IDBANKS_ACTIFS = frozenset(
    idbank
    for idbank, (_poste, territoire) in IDBANK_REFERENTIEL.items()
    if territoire != "FE"
)

# Préfixe de fichier → ensemble d'idbanks → (lot_collecte, perimetre_reference)
LOTS_PAR_PREFIXE: dict[str, dict[frozenset[str], tuple[str, str]]] = {
    "ipc_alimentation_": {
        frozenset({"011813726", "011813717"}): (
            "alimentation_france_entiere",
            "france_entiere_historique",
        ),
        frozenset({"011813726", "011813720"}): (
            "alimentation_france_metropolitaine",
            "france_metropolitaine",
        ),
    },
    "ipc_postes_": {
        IDBANKS_ACTIFS: (
            "quatre_postes_france_metropolitaine",
            "france_metropolitaine",
        ),
    },
}

IDBANKS_AUTORISES = frozenset(IDBANK_REFERENTIEL)
MOTIF_NOM_BRUT = re.compile(
    r"^(ipc_alimentation_|ipc_postes_)(\d{4}-\d{2}-\d{2}T\d{6}Z)\.xml$"
)
ATTRIBUTS_SERIE = (
    "IDBANK",
    "FREQ",
    "REF_AREA",
    "LAST_UPDATE",
    "UNIT_MEASURE",
    "UNIT_MULT",
    "DECIMALS",
)
ATTRIBUTS_OBS = ("TIME_PERIOD", "OBS_STATUS", "OBS_QUAL", "OBS_TYPE")

RACINE_DEPOT = Path(__file__).resolve().parent.parent
DOSSIER_BRUT_INSEE = RACINE_DEPOT / "data" / "raw" / "insee"


class ErreurSdmx(ValueError):
    """Échec de structure ou de provenance sur un XML SDMX IPC."""


@dataclass(frozen=True)
class Observation:
    fichier_source: str
    collecte_utc: datetime
    idbank: str
    poste: str
    code_territoire: str
    lot_collecte: str
    perimetre_reference: str
    frequence: str
    titre: str
    mise_a_jour_source: str
    unite_mesure: str
    multiplicateur_unite: int
    decimales: int
    periode: date
    valeur_indice: float | None
    statut_observation: str
    qualite_observation: str
    type_observation: str


def _nom_local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def _enfants(element: ET.Element, nom: str) -> list[ET.Element]:
    return [enfant for enfant in list(element) if _nom_local(enfant.tag) == nom]


def _attr(element: ET.Element, nom: str) -> str:
    valeur = element.get(nom)
    if valeur is None or valeur == "":
        raise ErreurSdmx(f"attribut obligatoire manquant : {nom}")
    return valeur


def _titre(serie: ET.Element) -> str:
    for nom in ("TITLE_FR", "TITLE", "TITLE_EN"):
        valeur = serie.get(nom)
        if valeur:
            return valeur
    raise ErreurSdmx("attribut obligatoire manquant : TITLE_FR")


def _entier(texte: str, nom: str) -> int:
    try:
        return int(texte)
    except ValueError as exc:
        raise ErreurSdmx(f"attribut obligatoire mal formé : {nom}") from exc


def _periode(texte: str) -> date:
    parties = texte.split("-")
    if len(parties) != 2 or len(parties[0]) != 4 or len(parties[1]) != 2:
        raise ErreurSdmx(f"période mal formée : {texte}")
    try:
        return date(int(parties[0]), int(parties[1]), 1)
    except ValueError as exc:
        raise ErreurSdmx(f"période mal formée : {texte}") from exc


def _valeur_indice(element: ET.Element, statut: str) -> float | None:
    if "OBS_VALUE" not in element.attrib or element.get("OBS_VALUE") == "":
        if statut == "ND":
            return None
        raise ErreurSdmx("valeur absente sans statut ND")
    texte = _attr(element, "OBS_VALUE")
    try:
        return float(texte)
    except ValueError as exc:
        raise ErreurSdmx(f"valeur mal formée : {texte}") from exc


def collecte_utc_depuis_nom(nom: str) -> datetime:
    correspondance = MOTIF_NOM_BRUT.fullmatch(nom)
    if correspondance is None:
        raise ErreurSdmx(f"nom de fichier non conforme : {nom}")
    instant = datetime.strptime(correspondance.group(2), "%Y-%m-%dT%H%M%SZ")
    return instant.replace(tzinfo=timezone.utc)


def _prefixe_depuis_nom(nom: str) -> str:
    correspondance = MOTIF_NOM_BRUT.fullmatch(nom)
    if correspondance is None:
        raise ErreurSdmx(f"nom de fichier non conforme : {nom}")
    return correspondance.group(1)


def _fichier_source(chemin: Path, racine: Path) -> str:
    return chemin.resolve().relative_to(racine.resolve()).as_posix()


def _erreur_lot(nom: str, idbanks: set[str], prefixe: str) -> ErreurSdmx:
    attendus = LOTS_PAR_PREFIXE.get(prefixe, {})
    attendus_aplatis = set().union(*attendus.keys()) if attendus else set()
    manquants = sorted(attendus_aplatis - idbanks) if attendus else []
    surnumeraires = sorted(idbanks - attendus_aplatis) if attendus else sorted(idbanks)
    parties = [f"lot non conforme dans {nom}"]
    if manquants:
        parties.append(f"manquants : {', '.join(manquants)}")
    if surnumeraires:
        parties.append(f"surnuméraires : {', '.join(surnumeraires)}")
    if not manquants and not surnumeraires:
        parties.append(f"idbanks : {', '.join(sorted(idbanks))}")
    return ErreurSdmx(" ; ".join(parties))


def _resoudre_lot(nom: str, idbanks: set[str]) -> tuple[str, str]:
    prefixe = _prefixe_depuis_nom(nom)
    lots = LOTS_PAR_PREFIXE.get(prefixe)
    if lots is None:
        raise ErreurSdmx(f"préfixe inconnu dans {nom}")
    resultat = lots.get(frozenset(idbanks))
    if resultat is None:
        # Messages historiques pour les paires alimentaires.
        if prefixe == "ipc_alimentation_":
            if len(idbanks) < 2:
                raise ErreurSdmx(f"paire incomplète dans {nom}")
            if len(idbanks) > 2:
                raise ErreurSdmx(f"troisième idbank dans {nom}")
            raise ErreurSdmx(
                f"paire mélangée dans {nom} : {', '.join(sorted(idbanks))}"
            )
        raise _erreur_lot(nom, idbanks, prefixe)
    return resultat


def parser_fichier(chemin: Path, *, racine: Path) -> list[Observation]:
    collecte_utc = collecte_utc_depuis_nom(chemin.name)
    fichier_source = _fichier_source(chemin, racine)
    try:
        racine_xml = ET.parse(chemin).getroot()
    except ET.ParseError as exc:
        raise ErreurSdmx(f"XML invalide : {chemin.name}") from exc

    series = [el for el in racine_xml.iter() if _nom_local(el.tag) == "Series"]
    if not series:
        raise ErreurSdmx(f"XML vide : {chemin.name}")

    idbanks_vus: set[str] = set()
    for serie in series:
        for nom in ATTRIBUTS_SERIE:
            _attr(serie, nom)
        idbank = _attr(serie, "IDBANK")
        if idbank not in IDBANKS_AUTORISES:
            raise ErreurSdmx(f"idbank non autorisé : {idbank}")
        frequence = _attr(serie, "FREQ")
        if frequence != "M":
            raise ErreurSdmx(f"fréquence autre que M : {frequence}")
        code_territoire = _attr(serie, "REF_AREA")
        _poste, attendu = IDBANK_REFERENTIEL[idbank]
        if code_territoire != attendu:
            raise ErreurSdmx(
                f"territoire incohérent pour {idbank} : {code_territoire} "
                f"(attendu {attendu})"
            )
        if idbank in idbanks_vus:
            raise ErreurSdmx(f"doublon du grain dans {chemin.name}")
        idbanks_vus.add(idbank)
        if not _enfants(serie, "Obs"):
            raise ErreurSdmx(f"XML vide : {chemin.name}")

    lot_collecte, perimetre = _resoudre_lot(chemin.name, idbanks_vus)

    observations: list[Observation] = []
    for serie in series:
        idbank = _attr(serie, "IDBANK")
        poste, _territoire = IDBANK_REFERENTIEL[idbank]
        frequence = _attr(serie, "FREQ")
        code_territoire = _attr(serie, "REF_AREA")
        vus_periode: set[date] = set()
        for obs in _enfants(serie, "Obs"):
            for nom in ATTRIBUTS_OBS:
                _attr(obs, nom)
            periode = _periode(_attr(obs, "TIME_PERIOD"))
            if periode in vus_periode:
                raise ErreurSdmx(f"doublon du grain dans {chemin.name}")
            vus_periode.add(periode)
            statut = _attr(obs, "OBS_STATUS")
            observations.append(
                Observation(
                    fichier_source=fichier_source,
                    collecte_utc=collecte_utc,
                    idbank=idbank,
                    poste=poste,
                    code_territoire=code_territoire,
                    lot_collecte=lot_collecte,
                    perimetre_reference=perimetre,
                    frequence=frequence,
                    titre=_titre(serie),
                    mise_a_jour_source=_attr(serie, "LAST_UPDATE"),
                    unite_mesure=_attr(serie, "UNIT_MEASURE"),
                    multiplicateur_unite=_entier(_attr(serie, "UNIT_MULT"), "UNIT_MULT"),
                    decimales=_entier(_attr(serie, "DECIMALS"), "DECIMALS"),
                    periode=periode,
                    valeur_indice=_valeur_indice(obs, statut),
                    statut_observation=statut,
                    qualite_observation=_attr(obs, "OBS_QUAL"),
                    type_observation=_attr(obs, "OBS_TYPE"),
                )
            )
    return observations


def parser_repertoire(dossier: Path, *, racine: Path) -> list[Observation]:
    if not dossier.is_dir():
        raise ErreurSdmx("aucun fichier brut trouvé")
    fichiers = sorted(
        list(dossier.glob("ipc_alimentation_*.xml"))
        + list(dossier.glob("ipc_postes_*.xml"))
    )
    if not fichiers:
        raise ErreurSdmx("aucun fichier brut trouvé")
    observations: list[Observation] = []
    for fichier in fichiers:
        observations.extend(parser_fichier(fichier, racine=racine))
    return observations
