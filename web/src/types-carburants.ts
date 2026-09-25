/** Colonnes publiées par fct_comparaison_carburants, dans l'ordre exact. */
export const COLONNES_CARBURANTS_ATTENDUES = [
  "type_ligne",
  "carburant",
  "libelle_carburant",
  "date_reference",
  "mois_complet",
  "q10_eur_litre",
  "q25_eur_litre",
  "mediane_eur_litre",
  "q75_eur_litre",
  "q90_eur_litre",
  "nombre_stations",
  "prix_max_mq_eur_litre",
  "fin_effet_exclusive",
  "reference_acte",
  "url_source_primaire",
  "collecte_utc_nationale",
] as const;

export type TypeLigneCarburant = "distribution_metropole" | "plafond_martinique";

export interface LigneCarburant {
  type_ligne: TypeLigneCarburant;
  carburant: string;
  libelle_carburant: string;
  date_reference: Date;
  mois_complet: boolean | null;
  q10_eur_litre: number | null;
  q25_eur_litre: number | null;
  mediane_eur_litre: number | null;
  q75_eur_litre: number | null;
  q90_eur_litre: number | null;
  nombre_stations: number | null;
  prix_max_mq_eur_litre: number | null;
  fin_effet_exclusive: Date | null;
  reference_acte: string | null;
  url_source_primaire: string | null;
  collecte_utc_nationale: Date | null;
}

export interface ProduitNonComparable {
  carburantMq: string;
  libelleMq: string;
  raison: string;
}
