"""Collecte brute des actes et communiqués carburants martiniquais.

Lit le manifeste versionné, télécharge chaque URL primaire unique une seule
fois, range séparément les communiqués secondaires. Aucun parsing de prix.

Usage :
  uv run python ingest/arretes_carburants_martinique.py [--dry-run]
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
import urllib.request

RACINE = Path(__file__).resolve().parent.parent
MANIFESTE = RACINE / "data" / "manifests" / "arretes_carburants_martinique.csv"
BRUT = RACINE / "data" / "raw" / "carburants" / "martinique"

TIMEOUT_S = 120
USER_AGENT = (
    "panyen/0.1 (+https://github.com/local/panyen; collecte actes carburants MQ)"
)

COLONNES = (
    "debut_effet",
    "reference_acte",
    "date_signature",
    "type_source_primaire",
    "url_source_primaire",
    "pages_acte",
    "url_communique",
    "motif_exception",
)
TYPES_PRIMAIRES = {"raa", "arrete_individuel", "communique_exception"}
DEBUT_FENETRE = date(2022, 4, 1)
FIN_FENETRE = date(2026, 9, 1)
DATE_OBLIGATOIRE = date(2022, 11, 16)
DOMAINES_OFFICIELS = (
    "martinique.gouv.fr",
    "martinique.deets.gouv.fr",
)


def maintenant_utc() -> datetime:
    return datetime.now(timezone.utc)


def _domaine_officiel(url: str) -> bool:
    hote = urlparse(url).hostname or ""
    return any(hote == d or hote.endswith("." + d) for d in DOMAINES_OFFICIELS)


def _parse_date(valeur: str, champ: str) -> date:
    try:
        return date.fromisoformat(valeur)
    except ValueError as exc:
        raise ValueError(f"date invalide pour {champ} : {valeur!r}") from exc


def lire_manifeste(chemin: Path | None = None) -> list[dict[str, str]]:
    chemin = MANIFESTE if chemin is None else chemin
    if not chemin.is_file():
        raise FileNotFoundError(f"manifeste introuvable : {chemin}")

    with chemin.open(encoding="utf-8", newline="") as fichier:
        lecteur = csv.DictReader(fichier)
        if lecteur.fieldnames != list(COLONNES):
            raise ValueError(
                f"schéma manifeste invalide : attendu {COLONNES}, "
                f"reçu {tuple(lecteur.fieldnames or ())}"
            )
        lignes = [{c: (row.get(c) or "").strip() for c in COLONNES} for row in lecteur]

    if not lignes:
        raise ValueError("manifeste vide")

    dates: list[date] = []
    for i, ligne in enumerate(lignes, start=2):
        debut = _parse_date(ligne["debut_effet"], f"debut_effet (ligne {i})")
        _parse_date(ligne["date_signature"], f"date_signature (ligne {i})")
        dates.append(debut)

        if not ligne["reference_acte"]:
            raise ValueError(f"reference_acte manquante (ligne {i})")
        if ligne["type_source_primaire"] not in TYPES_PRIMAIRES:
            raise ValueError(
                f"type_source_primaire invalide (ligne {i}) : "
                f"{ligne['type_source_primaire']!r}"
            )
        if not ligne["url_source_primaire"]:
            raise ValueError(f"url_source_primaire manquante (ligne {i})")
        if not _domaine_officiel(ligne["url_source_primaire"]):
            raise ValueError(
                f"domaine non officiel pour url_source_primaire (ligne {i})"
            )
        if ligne["url_communique"] and not _domaine_officiel(ligne["url_communique"]):
            raise ValueError(f"domaine non officiel pour url_communique (ligne {i})")

        if ligne["type_source_primaire"] == "communique_exception":
            if not ligne["motif_exception"]:
                raise ValueError(
                    f"motif_exception obligatoire pour communique_exception (ligne {i})"
                )
        elif ligne["motif_exception"]:
            raise ValueError(
                f"motif_exception doit être vide si l'acte est disponible (ligne {i})"
            )

        if ligne["type_source_primaire"] == "raa" and not ligne["pages_acte"]:
            raise ValueError(f"pages_acte obligatoire pour un RAA (ligne {i})")

    if dates != sorted(dates):
        raise ValueError("manifeste non trié par debut_effet croissant")
    if dates[0] != DEBUT_FENETRE:
        raise ValueError(
            f"première date hors borne : attendu {DEBUT_FENETRE.isoformat()}, "
            f"reçu {dates[0].isoformat()}"
        )
    if dates[-1] != FIN_FENETRE:
        raise ValueError(
            f"dernière date hors borne : attendu {FIN_FENETRE.isoformat()}, "
            f"reçu {dates[-1].isoformat()}"
        )
    if DATE_OBLIGATOIRE not in dates:
        raise ValueError("date d'effet obligatoire absente : 2022-11-16")

    # Au moins une date d'effet par mois civil de la fenêtre.
    mois_presents = {(d.year, d.month) for d in dates}
    curseur = date(DEBUT_FENETRE.year, DEBUT_FENETRE.month, 1)
    fin = date(FIN_FENETRE.year, FIN_FENETRE.month, 1)
    manquants = []
    while curseur <= fin:
        cle = (curseur.year, curseur.month)
        if cle not in mois_presents:
            manquants.append(f"{curseur.year:04d}-{curseur.month:02d}")
        if curseur.month == 12:
            curseur = date(curseur.year + 1, 1, 1)
        else:
            curseur = date(curseur.year, curseur.month + 1, 1)
    if manquants:
        raise ValueError(
            "mois civils sans date d'effet : " + ", ".join(manquants)
        )

    return lignes


def _slug(valeur: str) -> str:
    nettoye = re.sub(r"[^A-Za-z0-9._-]+", "_", valeur).strip("_")
    return nettoye[:80] or "document"


def nom_brut(categorie: str, reference: str, instant: datetime, suffixe: str) -> str:
    horodatage = instant.astimezone(timezone.utc).strftime("%Y-%m-%dT%H%M%SZ")
    return f"{categorie}_{_slug(reference)}_{horodatage}{suffixe}"


def _suffixe_url(url: str) -> str:
    chemin = urlparse(url).path.lower()
    for ext in (".pdf", ".odt", ".doc", ".docx", ".html", ".htm"):
        if chemin.endswith(ext):
            return ext if ext != ".htm" else ".html"
    return ".bin"


def _telecharger(url: str) -> bytes:
    requete = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    contenu = urllib.request.urlopen(requete, timeout=TIMEOUT_S).read()
    if not contenu:
        raise ValueError(f"réponse vide pour {url}")
    return contenu


def _ecrire(chemin: Path, contenu: bytes, meta: dict) -> None:
    chemin.parent.mkdir(parents=True, exist_ok=True)
    with chemin.open("xb") as fichier:
        fichier.write(contenu)
    sidecar = Path(str(chemin) + ".json")
    with sidecar.open("x", encoding="utf-8") as fichier:
        json.dump(meta, fichier, ensure_ascii=False, indent=2)
        fichier.write("\n")


def collecter(*, dry_run: bool = False) -> list[dict]:
    lignes = lire_manifeste()
    instant = maintenant_utc()

    telechargements: list[tuple[str, str, str, str]] = []
    vus: set[str] = set()

    for ligne in lignes:
        url = ligne["url_source_primaire"]
        if url not in vus:
            vus.add(url)
            telechargements.append(
                ("primaires", "source_primaire", ligne["reference_acte"], url)
            )
        url_cp = ligne["url_communique"]
        if url_cp and url_cp not in vus:
            vus.add(url_cp)
            telechargements.append(
                ("communiques", "communique_secondaire", ligne["reference_acte"], url_cp)
            )

    resultats: list[dict] = []
    for sous_dossier, categorie, reference, url in telechargements:
        contenu = _telecharger(url)
        empreinte = hashlib.sha256(contenu).hexdigest()
        if dry_run:
            print(
                f"{categorie} · {url} · {len(contenu):,} octets · "
                f"sha256={empreinte} · dry-run : aucune écriture"
            )
            continue
        nom = nom_brut(categorie, reference, instant, _suffixe_url(url))
        cible = BRUT / sous_dossier / nom
        meta = {
            "identifiant": f"{categorie}:{reference}",
            "url": url,
            "collecte_utc": instant.astimezone(timezone.utc).strftime(
                "%Y-%m-%dT%H:%M:%SZ"
            ),
            "taille_octets": len(contenu),
            "sha256": empreinte,
            "categorie": categorie,
            "periode": None,
            "nom_brut": nom,
            "reference_acte": reference,
        }
        _ecrire(cible, contenu, meta)
        print(
            f"{categorie} · {len(contenu):,} octets · sha256={empreinte} → "
            f"{cible.relative_to(RACINE)}"
        )
        resultats.append(
            {
                "chemin": str(cible),
                "url": url,
                "taille_octets": len(contenu),
                "sha256": empreinte,
                "categorie": categorie,
            }
        )
    return resultats


def principal(argv: list[str] | None = None) -> None:
    parseur = argparse.ArgumentParser(
        description=(
            "Collecte brute des URL du manifeste des arrêtés carburants martiniquais."
        )
    )
    parseur.add_argument(
        "--dry-run",
        action="store_true",
        help="exécute les requêtes sans écrire de dossier ni de fichier",
    )
    args = parseur.parse_args(argv)
    collecter(dry_run=args.dry_run)


if __name__ == "__main__":
    principal()
