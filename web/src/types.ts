/** Colonnes publiées par fct_differentiel_alimentation, dans l'ordre exact. */
export const COLONNES_ATTENDUES = [
  "periode",
  "dernier_mois_commun",
  "poste",
  "fichier_source",
  "collecte_utc",
  "idbank_martinique",
  "idbank_france_metropolitaine",
  "facteur_martinique",
  "facteur_france_metropolitaine",
  "evolution_martinique_pct",
  "evolution_france_metropolitaine_pct",
  "differentiel_evolution_points",
  "coefficient_ecart",
  "ecart_ecsp_2022_pct",
  "ecart_prix_estime_pct",
  "source_ecsp",
  "nature_ecart",
] as const;

export type NatureEcart = "mesure_ecsp_2022" | "estimation_a_partir_ecsp_2022";

export interface LigneDifferentiel {
  periode: Date;
  dernier_mois_commun: Date;
  poste: string;
  fichier_source: string;
  collecte_utc: Date;
  idbank_martinique: string;
  idbank_france_metropolitaine: string;
  facteur_martinique: number;
  facteur_france_metropolitaine: number;
  evolution_martinique_pct: number;
  evolution_france_metropolitaine_pct: number;
  differentiel_evolution_points: number;
  coefficient_ecart: number;
  ecart_ecsp_2022_pct: number;
  ecart_prix_estime_pct: number;
  source_ecsp: string;
  nature_ecart: NatureEcart;
}
