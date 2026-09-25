/**
 * Validation pure du Parquet carburants.
 */
import {
  COLONNES_CARBURANTS_ATTENDUES,
  type LigneCarburant,
  type TypeLigneCarburant,
} from "./types-carburants.ts";

export class ErreurValidationCarburants extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ErreurValidationCarburants";
  }
}

const TYPES_LIGNE_VALIDES = new Set<TypeLigneCarburant>([
  "distribution_metropole",
  "plafond_martinique",
]);

export function formaterMoisUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function validerColonnesCarburants(colonnes: string[]): void {
  const attendu = COLONNES_CARBURANTS_ATTENDUES.join(",");
  const recu = colonnes.join(",");
  if (attendu !== recu) {
    throw new ErreurValidationCarburants(
      `Colonnes attendues : ${attendu}\nColonnes reçues : ${recu}`,
    );
  }
}

export function validerLignesCarburants(lignes: LigneCarburant[]): void {
  if (lignes.length === 0) {
    throw new ErreurValidationCarburants("Le fichier ne contient aucune ligne.");
  }

  for (const ligne of lignes) {
    if (!TYPES_LIGNE_VALIDES.has(ligne.type_ligne)) {
      throw new ErreurValidationCarburants(
        `type_ligne invalide : ${ligne.type_ligne}`,
      );
    }

    if (ligne.type_ligne === "distribution_metropole") {
      if (ligne.mois_complet === null) {
        throw new ErreurValidationCarburants(
          `mois_complet manquant pour distribution ${ligne.carburant} ${formaterMoisUtc(ligne.date_reference)}`,
        );
      }
      for (const champ of [
        "q10_eur_litre",
        "q25_eur_litre",
        "mediane_eur_litre",
        "q75_eur_litre",
        "q90_eur_litre",
      ] as const) {
        if (ligne[champ] === null) {
          throw new ErreurValidationCarburants(
            `${champ} manquant pour distribution ${ligne.carburant}`,
          );
        }
      }
      if (ligne.nombre_stations === null || ligne.nombre_stations < 1) {
        throw new ErreurValidationCarburants(
          `nombre_stations invalide pour distribution ${ligne.carburant}`,
        );
      }
      if (ligne.prix_max_mq_eur_litre !== null) {
        throw new ErreurValidationCarburants(
          "prix_max_mq_eur_litre doit être null pour une distribution.",
        );
      }
    } else {
      if (ligne.prix_max_mq_eur_litre === null || ligne.prix_max_mq_eur_litre <= 0) {
        throw new ErreurValidationCarburants(
          `prix_max_mq_eur_litre manquant pour plafond ${ligne.carburant}`,
        );
      }
      if (ligne.q10_eur_litre !== null) {
        throw new ErreurValidationCarburants(
          "q10_eur_litre doit être null pour un plafond.",
        );
      }
    }
  }

  const distributions = lignes.filter((l) => l.type_ligne === "distribution_metropole");
  if (distributions.length === 0) {
    throw new ErreurValidationCarburants(
      "Aucune ligne distribution_metropole : rien à comparer.",
    );
  }
}
