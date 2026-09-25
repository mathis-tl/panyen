import { describe, it, expect } from "vitest";
import {
  calculerResumeCarburants,
  listerCarburantsComparables,
} from "./calculs-carburants.ts";
import type { LigneCarburant } from "./types-carburants.ts";

const lignes: LigneCarburant[] = [
  {
    type_ligne: "distribution_metropole",
    carburant: "Gazole",
    libelle_carburant: "Gazole",
    date_reference: new Date(Date.UTC(2022, 3, 1)),
    mois_complet: true,
    q10_eur_litre: 1.5,
    q25_eur_litre: 1.6,
    mediane_eur_litre: 1.7,
    q75_eur_litre: 1.8,
    q90_eur_litre: 1.9,
    nombre_stations: 100,
    prix_max_mq_eur_litre: null,
    fin_effet_exclusive: null,
    reference_acte: null,
    url_source_primaire: null,
    collecte_utc_nationale: new Date(Date.UTC(2026, 8, 10)),
  },
  {
    type_ligne: "distribution_metropole",
    carburant: "Gazole",
    libelle_carburant: "Gazole",
    date_reference: new Date(Date.UTC(2026, 8, 1)),
    mois_complet: false,
    q10_eur_litre: 1.4,
    q25_eur_litre: 1.5,
    mediane_eur_litre: 1.6,
    q75_eur_litre: 1.7,
    q90_eur_litre: 1.8,
    nombre_stations: 90,
    prix_max_mq_eur_litre: null,
    fin_effet_exclusive: null,
    reference_acte: null,
    url_source_primaire: null,
    collecte_utc_nationale: new Date(Date.UTC(2026, 8, 10)),
  },
  {
    type_ligne: "plafond_martinique",
    carburant: "gazole",
    libelle_carburant: "Gazole",
    date_reference: new Date(Date.UTC(2022, 3, 1)),
    mois_complet: null,
    q10_eur_litre: null,
    q25_eur_litre: null,
    mediane_eur_litre: null,
    q75_eur_litre: null,
    q90_eur_litre: null,
    nombre_stations: null,
    prix_max_mq_eur_litre: 1.55,
    fin_effet_exclusive: new Date(Date.UTC(2022, 10, 16)),
    reference_acte: "R02-TEST",
    url_source_primaire: "https://www.martinique.gouv.fr/x.pdf",
    collecte_utc_nationale: null,
  },
];

describe("calculs carburants", () => {
  it("liste les carburants comparables", () => {
    expect(listerCarburantsComparables(lignes)).toEqual(["Gazole"]);
  });

  it("calcule le résumé avec mois incomplet", () => {
    const resume = calculerResumeCarburants(lignes, "Gazole");
    expect(resume.distributions).toHaveLength(2);
    expect(resume.dernierMoisIncomplet).toBe(true);
    expect(resume.plafonds).toHaveLength(1);
    expect(resume.produitsNonComparables.length).toBeGreaterThan(0);
  });
});
