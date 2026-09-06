"""Collecte les indices IPC Insee (quatre postes) et écrit la réponse brute.

Ce collecteur ne parse rien et ne corrige rien : il télécharge et il range. Le
brut est un journal, pas un état — c'est ce qui permet de rejouer une exécution
passée et de comprendre, plus tard, un chiffre qui a changé.

Usage :
  uv run python ingest/insee_ipc.py [--depuis YYYY-MM] [--dry-run]
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
from pathlib import Path
import urllib.request

# Base 2025, ensemble des ménages. Ordre déterministe : par poste
# (alimentation, énergie, produits manufacturés, services), Martinique puis
# France métropolitaine. Voir docs/SOURCES.md. L'idbank France entière
# 011813717 n'est plus collecté ; le XML historique le conserve.
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
}

RACINE = Path(__file__).resolve().parent.parent
BRUT = RACINE / "data" / "raw" / "insee"

ENDPOINT = "https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/"
ENTETES = {"Accept": "application/vnd.sdmx.structurespecificdata+xml;version=2.1"}
DEPUIS_DEFAUT = "2022-04"
TIMEOUT_S = 60


def maintenant_utc() -> datetime:
    return datetime.now(timezone.utc)


def url_collecte(depuis: str) -> str:
    idbanks = "+".join(SERIES)
    return f"{ENDPOINT}{idbanks}?startPeriod={depuis}"


def nom_brut(instant: datetime) -> str:
    horodatage = instant.astimezone(timezone.utc).strftime("%Y-%m-%dT%H%M%SZ")
    return f"ipc_postes_{horodatage}.xml"


def collecter(depuis: str = DEPUIS_DEFAUT, *, dry_run: bool = False) -> Path | None:
    """Télécharge les huit séries IPC. Écrit le brut, sauf en dry-run."""
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


def principal(argv: list[str] | None = None) -> None:
    parseur = argparse.ArgumentParser(
        description=(
            "Collecte brute des indices IPC Insee "
            "(quatre postes, France métropolitaine et Martinique)."
        )
    )
    parseur.add_argument(
        "--depuis",
        default=DEPUIS_DEFAUT,
        help=f"startPeriod SDMX (défaut : {DEPUIS_DEFAUT})",
    )
    parseur.add_argument(
        "--dry-run",
        action="store_true",
        help="exécute la requête sans créer de dossier ni de fichier brut",
    )
    args = parseur.parse_args(argv)
    collecter(depuis=args.depuis, dry_run=args.dry_run)


if __name__ == "__main__":
    principal()
