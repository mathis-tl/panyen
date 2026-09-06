/**
 * Validation pure du jeu de données lu depuis le Parquet.
 * Lève une erreur explicite pour chaque cas pathologique.
 */
import { COLONNES_ATTENDUES, type LigneDifferentiel, type NatureEcart } from "./types.ts";

export class ErreurValidation extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ErreurValidation";
  }
}

const NATURES_VALIDES = new Set<NatureEcart>([
  "mesure_ecsp_2022",
  "estimation_a_partir_ecsp_2022",
]);

/** Valide les colonnes brutes avant le typage. */
export function validerColonnes(colonnes: string[]): void {
  const attendu = COLONNES_ATTENDUES.join(",");
  const recu = colonnes.join(",");
  if (attendu !== recu) {
    throw new ErreurValidation(
      `Colonnes attendues : ${attendu}\nColonnes reçues : ${recu}`
    );
  }
}

/** Valide le contenu des lignes typées. */
export function validerLignes(lignes: LigneDifferentiel[]): void {
  if (lignes.length === 0) {
    throw new ErreurValidation("Le fichier ne contient aucune ligne.");
  }

  // Périodes strictement croissantes, sans doublons ni trous
  const periodes = lignes.map((l) => l.periode.getTime());
  for (let i = 1; i < periodes.length; i++) {
    if (periodes[i] <= periodes[i - 1]) {
      throw new ErreurValidation(
        `Périodes non strictement croissantes à l'index ${i}.`
      );
    }
  }

  // Vérifier qu'aucun mois ne manque (pas de trou intérieur)
  for (let i = 1; i < lignes.length; i++) {
    const precedente = lignes[i - 1].periode;
    const courante = lignes[i].periode;
    const moisAttendu = new Date(
      Date.UTC(
        precedente.getUTCFullYear(),
        precedente.getUTCMonth() + 1,
        1
      )
    );
    if (courante.getTime() !== moisAttendu.getTime()) {
      throw new ErreurValidation(
        `Mois manquant entre ${formaterMoisUtc(precedente)} et ${formaterMoisUtc(courante)}.`
      );
    }
  }

  // Vérifier nature_ecart
  for (const ligne of lignes) {
    if (!NATURES_VALIDES.has(ligne.nature_ecart)) {
      throw new ErreurValidation(
        `Valeur inconnue pour nature_ecart : « ${ligne.nature_ecart} ».`
      );
    }
  }

  // Exactement 1 ligne mesure_ecsp_2022
  const mesures = lignes.filter((l) => l.nature_ecart === "mesure_ecsp_2022");
  if (mesures.length !== 1) {
    throw new ErreurValidation(
      `Attendu exactement 1 ligne mesure_ecsp_2022, trouvé ${mesures.length}.`
    );
  }
}

/** Formate un Date UTC en « mois année » français. */
export function formaterMoisUtc(date: Date): string {
  const mois = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
  ];
  return `${mois[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}
