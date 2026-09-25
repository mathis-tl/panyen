"""Collecte brute des archives et flux nationaux prix-carburants.

Ce collecteur ne parse aucune valeur métier : il télécharge, valide le transport
ZIP/XML et range le brut horodaté avec sidecar SHA-256.

Usage :
  uv run python ingest/prix_carburants_national.py [--dry-run]
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
from datetime import datetime, timezone
from pathlib import Path
import urllib.request
import zipfile

RACINE = Path(__file__).resolve().parent.parent
BRUT = RACINE / "data" / "raw" / "carburants" / "national"

BASE = "https://donnees.roulez-eco.fr/opendata"
TIMEOUT_S = 120
USER_AGENT = (
    "panyen/0.1 (+https://github.com/local/panyen; collecte opendata carburants)"
)

RESSOURCES = (
    {
        "identifiant": "annee_2022",
        "url": f"{BASE}/annee/2022",
        "categorie": "archive_annuelle",
        "periode": "2022",
    },
    {
        "identifiant": "annee_2023",
        "url": f"{BASE}/annee/2023",
        "categorie": "archive_annuelle",
        "periode": "2023",
    },
    {
        "identifiant": "annee_2024",
        "url": f"{BASE}/annee/2024",
        "categorie": "archive_annuelle",
        "periode": "2024",
    },
    {
        "identifiant": "annee_2025",
        "url": f"{BASE}/annee/2025",
        "categorie": "archive_annuelle",
        "periode": "2025",
    },
    {
        "identifiant": "stock_2026",
        "url": f"{BASE}/annee",
        "categorie": "stock_annuel_mutable",
        "periode": "2026",
    },
    {
        "identifiant": "jour",
        "url": f"{BASE}/jour",
        "categorie": "flux_quotidien",
        "periode": None,
    },
)


def maintenant_utc() -> datetime:
    return datetime.now(timezone.utc)


def nom_brut(identifiant: str, instant: datetime) -> str:
    horodatage = instant.astimezone(timezone.utc).strftime("%Y-%m-%dT%H%M%SZ")
    return f"{identifiant}_{horodatage}.zip"


def _chemin_sidecar(chemin_brut: Path) -> Path:
    return Path(str(chemin_brut) + ".json")


def _membre_zip_dangereux(nom: str) -> bool:
    if nom.startswith("/") or nom.startswith("\\"):
        return True
    parties = Path(nom).parts
    return any(partie in ("..", "") for partie in parties) or Path(nom).is_absolute()


def valider_zip_transport(contenu: bytes, *, url: str) -> None:
    """Valide ZIP non vide, lisible, avec au moins un XML sûr ; n'extrait rien."""
    if not contenu:
        raise ValueError(f"réponse vide pour {url} : aucun fichier brut écrit")
    tete = contenu.lstrip()[:32].lower()
    if tete.startswith(b"<!doctype html") or tete.startswith(b"<html"):
        raise ValueError(f"HTML inattendu à la place d'un ZIP pour {url}")
    try:
        archive = zipfile.ZipFile(io.BytesIO(contenu))
    except zipfile.BadZipFile as exc:
        raise ValueError(f"ZIP invalide pour {url}") from exc

    with archive:
        membres = archive.namelist()
        if not membres:
            raise ValueError(f"ZIP vide (aucun membre) pour {url}")
        xmls = []
        for nom in membres:
            if _membre_zip_dangereux(nom):
                raise ValueError(
                    f"membre ZIP dangereux ou absolu refusé ({nom!r}) pour {url}"
                )
            if nom.lower().endswith(".xml"):
                xmls.append(nom)
        if not xmls:
            raise ValueError(f"aucun membre XML dans le ZIP pour {url}")


def _telecharger(url: str) -> bytes:
    requete = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    return urllib.request.urlopen(requete, timeout=TIMEOUT_S).read()


def _ecrire_brut_et_sidecar(
    *,
    ressource: dict,
    contenu: bytes,
    instant: datetime,
) -> dict:
    BRUT.mkdir(parents=True, exist_ok=True)
    nom = nom_brut(ressource["identifiant"], instant)
    cible = BRUT / nom
    empreinte = hashlib.sha256(contenu).hexdigest()
    meta = {
        "identifiant": ressource["identifiant"],
        "url": ressource["url"],
        "collecte_utc": instant.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "taille_octets": len(contenu),
        "sha256": empreinte,
        "categorie": ressource["categorie"],
        "periode": ressource["periode"],
        "nom_brut": nom,
    }
    with cible.open("xb") as fichier:
        fichier.write(contenu)
    sidecar = _chemin_sidecar(cible)
    with sidecar.open("x", encoding="utf-8") as fichier:
        json.dump(meta, fichier, ensure_ascii=False, indent=2)
        fichier.write("\n")
    return {
        "chemin": str(cible),
        "url": ressource["url"],
        "taille_octets": len(contenu),
        "sha256": empreinte,
        "identifiant": ressource["identifiant"],
    }


def collecter(*, dry_run: bool = False) -> list[dict]:
    """Télécharge les six ressources nationales. Écrit bruts+sidecars sauf dry-run."""
    instant = maintenant_utc()
    resultats: list[dict] = []

    for ressource in RESSOURCES:
        contenu = _telecharger(ressource["url"])
        valider_zip_transport(contenu, url=ressource["url"])
        empreinte = hashlib.sha256(contenu).hexdigest()
        if dry_run:
            print(
                f"{ressource['identifiant']} · {len(contenu):,} octets · "
                f"sha256={empreinte} · dry-run : aucune écriture"
            )
            continue
        resume = _ecrire_brut_et_sidecar(
            ressource=ressource,
            contenu=contenu,
            instant=instant,
        )
        print(
            f"{ressource['identifiant']} · {resume['taille_octets']:,} octets · "
            f"sha256={resume['sha256']} → "
            f"{Path(resume['chemin']).relative_to(RACINE)}"
        )
        resultats.append(resume)

    return resultats


def principal(argv: list[str] | None = None) -> None:
    parseur = argparse.ArgumentParser(
        description=(
            "Collecte brute des archives annuelles 2022–2025, du stock 2026 "
            "et du flux /jour (opendata prix-carburants)."
        )
    )
    parseur.add_argument(
        "--dry-run",
        action="store_true",
        help="exécute les requêtes et validations sans écrire de fichier",
    )
    args = parseur.parse_args(argv)
    collecter(dry_run=args.dry_run)


if __name__ == "__main__":
    principal()
