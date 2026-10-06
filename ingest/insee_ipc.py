"""Collecte les indices IPC Insee (cinq postes) et écrit la réponse brute.

Ce collecteur ne parse rien et ne corrige rien : il télécharge et il range. Le
brut est un journal, pas un état — c'est ce qui permet de rejouer une exécution
passée et de comprendre, plus tard, un chiffre qui a changé.

Usage :
  uv run python ingest/insee_ipc.py [--depuis YYYY-MM] [--dry-run]
  uv run python ingest/insee_ipc.py --carburants [--depuis YYYY-MM] [--dry-run]
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
from pathlib import Path
import urllib.request

# Base 2025, ensemble des ménages. Ordre déterministe : par poste
# (alimentation, énergie, produits manufacturés, services, ensemble),
# Martinique puis France métropolitaine. Voir docs/SOURCES.md. L'idbank
# France entière 011813717 n'est plus collecté ; le XML historique le conserve.
SERIES = {
    "011813726": {
        "poste": "alimentation",
        "code_territoire": "D972",
        "libelle": "D972 · alimentation · indice",
    },
    "011813720": {
        "poste": "alimentation",
        "code_territoire": "FM",
        "libelle": "FM · alimentation · indice",
    },
    "011813873": {
        "poste": "energie",
        "code_territoire": "D972",
        "libelle": "D972 · énergie · indice",
    },
    "011813867": {
        "poste": "energie",
        "code_territoire": "FM",
        "libelle": "FM · énergie · indice",
    },
    "011813789": {
        "poste": "produits_manufactures",
        "code_territoire": "D972",
        "libelle": "D972 · produits manufacturés · indice",
    },
    "011813783": {
        "poste": "produits_manufactures",
        "code_territoire": "FM",
        "libelle": "FM · produits manufacturés · indice",
    },
    "011813915": {
        "poste": "services",
        "code_territoire": "D972",
        "libelle": "D972 · services · indice",
    },
    "011813909": {
        "poste": "services",
        "code_territoire": "FM",
        "libelle": "FM · services · indice",
    },
    "011814618": {
        "poste": "ensemble",
        "code_territoire": "D972",
        "libelle": "D972 · ensemble · indice",
    },
    "011814612": {
        "poste": "ensemble",
        "code_territoire": "FM",
        "libelle": "FM · ensemble · indice",
    },
}

RACINE = Path(__file__).resolve().parent.parent
BRUT = RACINE / "data" / "raw" / "insee"

ENDPOINT = "https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/"
ENTETES = {"Accept": "application/vnd.sdmx.structurespecificdata+xml;version=2.1"}
DEPUIS_DEFAUT = "2022-04"
DEPUIS_CARBURANTS_DEFAUT = "2022-01"
IDBANK_CARBURANTS_GAZOLE = "000442588"
TIMEOUT_S = 60


def maintenant_utc() -> datetime:
    return datetime.now(timezone.utc)


def url_collecte(depuis: str) -> str:
    idbanks = "+".join(SERIES)
    return f"{ENDPOINT}{idbanks}?startPeriod={depuis}"


def url_collecte_carburants(depuis: str) -> str:
    return f"{ENDPOINT}{IDBANK_CARBURANTS_GAZOLE}?startPeriod={depuis}"


def nom_brut(instant: datetime) -> str:
    horodatage = instant.astimezone(timezone.utc).strftime("%Y-%m-%dT%H%M%SZ")
    return f"ipc_postes_{horodatage}.xml"


def nom_brut_carburants(instant: datetime) -> str:
    horodatage = instant.astimezone(timezone.utc).strftime("%Y-%m-%dT%H%M%SZ")
    return f"insee_carburants_{horodatage}.xml"


def collecter(depuis: str = DEPUIS_DEFAUT, *, dry_run: bool = False) -> Path | None:
    """Télécharge les dix séries IPC. Écrit le brut, sauf en dry-run."""
    requete = urllib.request.Request(url_collecte(depuis), headers=ENTETES)
    contenu = urllib.request.urlopen(requete, timeout=TIMEOUT_S).read()
    if not contenu:
        raise ValueError("réponse Insee vide : aucun fichier brut écrit")

    series = ", ".join(SERIES)
    if dry_run:
        print(
            f"{len(SERIES)} séries ({series}) · {len(contenu):,} octets · "
            "dry-run : aucune écriture"
        )
        return None

    cible = BRUT / nom_brut(maintenant_utc())
    BRUT.mkdir(parents=True, exist_ok=True)
    with cible.open("xb") as fichier:
        fichier.write(contenu)
    print(
        f"{len(SERIES)} séries ({series}) · {len(contenu):,} octets → "
        f"{cible.relative_to(RACINE)}"
    )
    return cible


def collecter_carburants(
    depuis: str = DEPUIS_CARBURANTS_DEFAUT, *, dry_run: bool = False
) -> Path | None:
    """Télécharge la série Insee 000442588 (gazole métropole). Écrit le brut."""
    requete = urllib.request.Request(url_collecte_carburants(depuis), headers=ENTETES)
    contenu = urllib.request.urlopen(requete, timeout=TIMEOUT_S).read()
    if not contenu:
        raise ValueError("réponse Insee carburants vide : aucun fichier brut écrit")

    if dry_run:
        print(
            f"1 série ({IDBANK_CARBURANTS_GAZOLE}) · {len(contenu):,} octets · "
            "dry-run : aucune écriture"
        )
        return None

    cible = BRUT / nom_brut_carburants(maintenant_utc())
    BRUT.mkdir(parents=True, exist_ok=True)
    with cible.open("xb") as fichier:
        fichier.write(contenu)
    print(
        f"1 série ({IDBANK_CARBURANTS_GAZOLE}) · {len(contenu):,} octets → "
        f"{cible.relative_to(RACINE)}"
    )
    return cible


def principal(argv: list[str] | None = None) -> None:
    parseur = argparse.ArgumentParser(
        description=(
            "Collecte brute des indices IPC Insee "
            "(cinq postes, France métropolitaine et Martinique)."
        )
    )
    parseur.add_argument(
        "--depuis",
        default=None,
        help=(
            "startPeriod SDMX "
            f"(défaut IPC : {DEPUIS_DEFAUT}, "
            f"défaut carburants : {DEPUIS_CARBURANTS_DEFAUT})"
        ),
    )
    parseur.add_argument(
        "--dry-run",
        action="store_true",
        help="exécute la requête sans créer de dossier ni de fichier brut",
    )
    parseur.add_argument(
        "--carburants",
        action="store_true",
        help="collecte la série 000442588 (prix moyen gazole métropole)",
    )
    args = parseur.parse_args(argv)
    if args.carburants:
        depuis = DEPUIS_CARBURANTS_DEFAUT if args.depuis is None else args.depuis
        collecter_carburants(depuis=depuis, dry_run=args.dry_run)
    else:
        depuis = DEPUIS_DEFAUT if args.depuis is None else args.depuis
        collecter(depuis=depuis, dry_run=args.dry_run)


if __name__ == "__main__":
    principal()
