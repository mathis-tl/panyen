import { describe, it, expect } from "vitest";
import {
  validerColonnesCarburants,
  validerLignesCarburants,
} from "./validation-carburants.ts";
import type { LigneCarburant } from "./types-carburants.ts";

function ligneDistribution(partial: Partial<LigneCarburant> = {}): LigneCarburant {
  return {
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
    ...partial,
  };
}

function lignePlafond(partial: Partial<LigneCarburant> = {}): LigneCarburant {
  return {
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
    fin_effet_exclusive: new Date(Date.UTC(2022, 4, 1)),
    reference_acte: "R02-TEST",
    url_source_primaire: "https://www.martinique.gouv.fr/x.pdf",
    collecte_utc_nationale: null,
    ...partial,
  };
}

describe("validation carburants", () => {
  it("accepte le schéma exact", () => {
    validerColonnesCarburants([
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
    ]);
  });

  it("valide des lignes discriminées par type_ligne", () => {
    validerLignesCarburants([ligneDistribution(), lignePlafond()]);
  });

  it("refuse une distribution sans quantiles", () => {
    expect(() =>
      validerLignesCarburants([ligneDistribution({ mediane_eur_litre: null })]),
    ).toThrow(/mediane_eur_litre/);
  });

  it("refuse un plafond sans prix", () => {
    expect(() =>
      validerLignesCarburants([
        ligneDistribution(),
        lignePlafond({ prix_max_mq_eur_litre: null }),
      ]),
    ).toThrow(/prix_max_mq_eur_litre/);
  });
});
