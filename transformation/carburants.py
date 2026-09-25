"""Parsing aval des ZIP nationaux prix-carburants (sans extraction sur disque).

Grain d'une observation : (fichier_source, membre_zip, id_station,
carburant_national, releve_utc).
"""

from __future__ import annotations

import io
import json
import zipfile
import xml.etree.ElementTree as ET
from collections.abc import Iterable, Iterator
from dataclasses import dataclass, fields
from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import BinaryIO

RACINE_DEPOT = Path(__file__).resolve().parents[1]
DOSSIER_BRUT_NATIONAL = RACINE_DEPOT / "data" / "raw" / "carburants" / "national"

DEBUT_FENETRE = date(2022, 4, 1)
FACTEUR_COORDONNEES = Decimal("100000")
CARBURANTS_CONNUS = frozenset({"Gazole", "SP95", "SP98", "E10", "E85", "GPLc"})
IDENTIFIANTS_HISTORIQUES = frozenset(
    {"annee_2022", "annee_2023", "annee_2024", "annee_2025", "stock_2026"}
)


@dataclass(frozen=True)
class ObservationCarburant:
    fichier_source: str
    sha256_source: str
    collecte_utc: datetime
    membre_zip: str
    id_station: str
    code_postal: str
    commune: str
    latitude: Decimal
    longitude: Decimal
    carburant_national: str
    id_carburant: str
    releve_utc: datetime
    prix_eur_litre: Decimal


class CarburantErreur(ValueError):
    """Erreur de parsing métier avec provenance."""


def _lire_sidecar(chemin_zip: Path) -> dict:
    sidecar = Path(str(chemin_zip) + ".json")
    if not sidecar.is_file():
        raise CarburantErreur(f"sidecar introuvable pour {chemin_zip}")
    meta = json.loads(sidecar.read_text(encoding="utf-8"))
    requis = (
        "identifiant",
        "url",
        "collecte_utc",
        "taille_octets",
        "sha256",
        "categorie",
        "nom_brut",
    )
    manquants = [c for c in requis if c not in meta]
    if manquants:
        raise CarburantErreur(f"sidecar incomplet ({chemin_zip.name}) : {manquants}")
    return meta


def _parse_collecte_utc(valeur: str) -> datetime:
    instant = datetime.strptime(valeur, "%Y-%m-%dT%H:%M:%SZ").replace(
        tzinfo=timezone.utc
    )
    return instant


def _parse_releve(valeur: str, *, station: str, source: str) -> datetime:
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S"):
        try:
            local = datetime.strptime(valeur, fmt)
            return local.replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    raise CarburantErreur(
        f"horodatage de relevé invalide ({valeur!r}) station={station} source={source}"
    )


def _parse_decimal(valeur: str, *, champ: str, station: str, source: str) -> Decimal:
    try:
        nombre = Decimal(valeur)
    except (InvalidOperation, TypeError) as exc:
        raise CarburantErreur(
            f"{champ} invalide ({valeur!r}) station={station} source={source}"
        ) from exc
    return nombre


def _coordonnee(valeur: str, *, champ: str, station: str, source: str) -> Decimal:
    brut = _parse_decimal(valeur, champ=champ, station=station, source=source)
    return brut / FACTEUR_COORDONNEES


def _est_metropole(code_postal: str) -> bool:
    if len(code_postal) != 5 or not code_postal.isdigit():
        return False
    return not code_postal.startswith("97") and not code_postal.startswith("98")


def _observations_depuis_pdv(
    pdv: ET.Element,
    *,
    fichier_source: str,
    sha256_source: str,
    collecte_utc: datetime,
    membre_zip: str,
) -> list[ObservationCarburant]:
    station = (pdv.get("id") or "").strip()
    if not station:
        raise CarburantErreur(
            f"station sans identifiant dans {fichier_source}:{membre_zip}"
        )
    code_postal = (pdv.get("cp") or "").strip()
    if not _est_metropole(code_postal):
        # Métropole seulement, contrôlée par CP ; les DOM ne sont pas un
        # filtre opportuniste déduit de leur absence.
        return []
    latitude_brute = (pdv.get("latitude") or "").strip()
    longitude_brute = (pdv.get("longitude") or "").strip()
    if not latitude_brute or not longitude_brute:
        # PDV sans coordonnées (ex. station 1200004, archive 2022) : aucune
        # observation géolocalisable ; on ignore le point de vente entier.
        return []
    lat = _coordonnee(
        latitude_brute,
        champ="latitude",
        station=station,
        source=fichier_source,
    )
    lon = _coordonnee(
        longitude_brute,
        champ="longitude",
        station=station,
        source=fichier_source,
    )
    commune_el = pdv.find("ville")
    commune = (commune_el.text or "").strip() if commune_el is not None else ""

    # Certaines stations portent plusieurs balises <prix> pour le même
    # carburant et le même horodatage (ex. 76400009 SP98 2023-12-15) :
    # on retient la dernière occurrence du membre XML, déterministe.
    grains_pdv: dict[tuple[str, datetime], ObservationCarburant] = {}

    for prix_el in pdv.findall("prix"):
        nom = (prix_el.get("nom") or "").strip()
        valeur_brute = (prix_el.get("valeur") or "").strip()
        maj_brute = (prix_el.get("maj") or "").strip()
        # Certains PDV portent des balises <prix/> vides (ex. station 1000002
        # dans l'archive 2022) : sans nom, valeur ni horodatage, ce n'est pas
        # une observation et on l'ignore.
        if not nom and not valeur_brute and not maj_brute:
            continue
        if not nom or not valeur_brute or not maj_brute:
            raise CarburantErreur(
                f"prix incomplet (nom={nom!r}, valeur={valeur_brute!r}, "
                f"maj={maj_brute!r}) station={station} "
                f"source={fichier_source}"
            )
        if nom not in CARBURANTS_CONNUS:
            raise CarburantErreur(
                f"carburant inconnu ({nom!r}) station={station} "
                f"source={fichier_source}"
            )
        id_carburant = (prix_el.get("id") or "").strip()
        if not id_carburant:
            raise CarburantErreur(
                f"id carburant manquant station={station} source={fichier_source}"
            )
        releve = _parse_releve(
            maj_brute,
            station=station,
            source=fichier_source,
        )
        if releve.date() < DEBUT_FENETRE:
            continue
        prix = _parse_decimal(
            valeur_brute,
            champ="prix",
            station=station,
            source=fichier_source,
        )
        if prix <= 0:
            raise CarburantErreur(
                f"prix non positif ({prix}) station={station} "
                f"source={fichier_source}"
            )
        grains_pdv[(nom, releve)] = ObservationCarburant(
            fichier_source=fichier_source,
            sha256_source=sha256_source,
            collecte_utc=collecte_utc,
            membre_zip=membre_zip,
            id_station=station,
            code_postal=code_postal,
            commune=commune,
            latitude=lat,
            longitude=lon,
            carburant_national=nom,
            id_carburant=id_carburant,
            releve_utc=releve,
            prix_eur_litre=prix,
        )
    return list(grains_pdv.values())


def iterer_membre_xml(
    flux: BinaryIO,
    *,
    fichier_source: str,
    sha256_source: str,
    collecte_utc: datetime,
    membre_zip: str,
) -> Iterator[ObservationCarburant]:
    try:
        contexte = ET.iterparse(flux, events=("start", "end"))
        _, racine = next(contexte)
        for event, elem in contexte:
            if event != "end" or elem.tag != "pdv":
                continue
            yield from _observations_depuis_pdv(
                elem,
                fichier_source=fichier_source,
                sha256_source=sha256_source,
                collecte_utc=collecte_utc,
                membre_zip=membre_zip,
            )
            racine.clear()
    except ET.ParseError as exc:
        raise CarburantErreur(
            f"XML mal formé dans {fichier_source}:{membre_zip}"
        ) from exc
    except StopIteration as exc:
        raise CarburantErreur(
            f"XML mal formé dans {fichier_source}:{membre_zip}"
        ) from exc


def parser_membre_xml(
    contenu: bytes,
    *,
    fichier_source: str,
    sha256_source: str,
    collecte_utc: datetime,
    membre_zip: str,
) -> list[ObservationCarburant]:
    return list(
        iterer_membre_xml(
            io.BytesIO(contenu),
            fichier_source=fichier_source,
            sha256_source=sha256_source,
            collecte_utc=collecte_utc,
            membre_zip=membre_zip,
        )
    )


def _membre_dangereux(nom: str) -> bool:
    if nom.startswith("/") or nom.startswith("\\"):
        return True
    return any(partie in ("..", "") for partie in Path(nom).parts)


def iterer_zip(
    chemin_zip: Path, *, racine: Path = RACINE_DEPOT
) -> Iterator[ObservationCarburant]:
    meta = _lire_sidecar(chemin_zip)
    if meta["identifiant"] not in IDENTIFIANTS_HISTORIQUES:
        raise CarburantErreur(
            f"ressource non historique exclue du parsing : {meta['identifiant']}"
        )
    collecte_utc = _parse_collecte_utc(meta["collecte_utc"])
    try:
        archive = zipfile.ZipFile(chemin_zip)
    except zipfile.BadZipFile as exc:
        raise CarburantErreur(f"ZIP illisible : {chemin_zip}") from exc

    with archive:
        noms = archive.namelist()
        for nom in noms:
            if _membre_dangereux(nom):
                raise CarburantErreur(f"membre ZIP dangereux : {nom}")
        fichier_source = str(chemin_zip.relative_to(racine))
        for nom in noms:
            if not nom.lower().endswith(".xml"):
                continue
            with archive.open(nom) as flux_membre:
                yield from iterer_membre_xml(
                    flux_membre,
                    fichier_source=fichier_source,
                    sha256_source=meta["sha256"],
                    collecte_utc=collecte_utc,
                    membre_zip=nom,
                )


def parser_zip(chemin_zip: Path, *, racine: Path = RACINE_DEPOT) -> list[ObservationCarburant]:
    return list(iterer_zip(chemin_zip, racine=racine))


def _serialiser_champ_ndjson(nom: str, valeur: object) -> str:
    if isinstance(valeur, Decimal):
        return str(valeur)
    if isinstance(valeur, datetime):
        if valeur.tzinfo is None:
            raise CarburantErreur(
                f"datetime sans fuseau pour le champ {nom!r}"
            )
        return valeur.isoformat()
    if isinstance(valeur, str):
        return valeur
    raise CarburantErreur(
        f"type inattendu pour le champ {nom!r} : {type(valeur).__name__}"
    )


def ecrire_lot_ndjson(
    observations: Iterable[ObservationCarburant], chemin: Path | str
) -> None:
    champs = fields(ObservationCarburant)
    with open(chemin, "w", encoding="utf-8") as sortie:  # noqa: PTH123
        for obs in observations:
            ligne = {
                champ.name: _serialiser_champ_ndjson(champ.name, getattr(obs, champ.name))
                for champ in champs
            }
            sortie.write(json.dumps(ligne, ensure_ascii=False) + "\n")


def lister_zips_historiques(dossier: Path = DOSSIER_BRUT_NATIONAL) -> list[Path]:
    if not dossier.is_dir():
        return []
    candidats = []
    for chemin in sorted(dossier.glob("*.zip")):
        sidecar = Path(str(chemin) + ".json")
        if not sidecar.is_file():
            continue
        meta = json.loads(sidecar.read_text(encoding="utf-8"))
        if meta.get("identifiant") in IDENTIFIANTS_HISTORIQUES:
            candidats.append(chemin)
    # Dernier stock 2026 seulement : garder le plus récent par identifiant.
    par_id: dict[str, Path] = {}
    for chemin in candidats:
        meta = json.loads(Path(str(chemin) + ".json").read_text(encoding="utf-8"))
        identifiant = meta["identifiant"]
        precedent = par_id.get(identifiant)
        if precedent is None or chemin.name > precedent.name:
            par_id[identifiant] = chemin
    return [par_id[k] for k in sorted(par_id)]


def parser_repertoire(
    dossier: Path = DOSSIER_BRUT_NATIONAL,
    *,
    racine: Path = RACINE_DEPOT,
) -> list[ObservationCarburant]:
    observations: list[ObservationCarburant] = []
    for chemin in lister_zips_historiques(dossier):
        observations.extend(parser_zip(chemin, racine=racine))
    return observations
