import { describe, it, expect } from "vitest";
import { validerColonnes, validerLignes, formaterMoisUtc, ErreurValidation } from "./validation.ts";
import { COLONNES_ATTENDUES, type LigneDifferentiel, type NatureEcart } from "./types.ts";

/** Fabrique une ligne synthétique valide. */
function ligneSynthetique(
  overrides: Partial<LigneDifferentiel> & { periode?: Date; nature_ecart?: NatureEcart } = {},
): LigneDifferentiel {
  return {
    periode: new Date(Date.UTC(2022, 3, 1)), // avril 2022
    dernier_mois_commun: new Date(Date.UTC(2022, 3, 1)),
    poste: "alimentation",
    fichier_source: "data/raw/insee/ipc.xml",
    collecte_utc: new Date(Date.UTC(2026, 8, 1)),
    idbank_martinique: "011813726",
    idbank_france_metropolitaine: "011813720",
    facteur_martinique: 1.0,
    facteur_france_metropolitaine: 1.0,
    evolution_martinique_pct: 0,
    evolution_france_metropolitaine_pct: 0,
    differentiel_evolution_points: 0,
    coefficient_ecart: 1.0,
    ecart_ecsp_2022_pct: 40.0,
    ecart_prix_estime_pct: 40.0,
    source_ecsp: "https://www.insee.fr/fr/statistiques/7649202",
    nature_ecart: "mesure_ecsp_2022",
    ...overrides,
  };
}

/** Fabrique un jeu de N mois consécutifs valide (1 mesure + N-1 estimations). */
function jeuValide(n: number): LigneDifferentiel[] {
  return Array.from({ length: n }, (_, i) =>
    ligneSynthetique({
      periode: new Date(Date.UTC(2022, 3 + i, 1)),
      dernier_mois_commun: new Date(Date.UTC(2022, 3 + n - 1, 1)),
      nature_ecart: i === 0 ? "mesure_ecsp_2022" : "estimation_a_partir_ecsp_2022",
      differentiel_evolution_points: i * 0.3,
    }),
  );
}

describe("validerColonnes", () => {
  it("accepte les colonnes exactes", () => {
    expect(() => validerColonnes([...COLONNES_ATTENDUES])).not.toThrow();
  });

  it("refuse une colonne manquante", () => {
    const colonnes = [...COLONNES_ATTENDUES].slice(0, -1);
    expect(() => validerColonnes(colonnes)).toThrow(ErreurValidation);
  });

  it("refuse une colonne en trop", () => {
    const colonnes = [...COLONNES_ATTENDUES, "valeur_indice"];
    expect(() => validerColonnes(colonnes)).toThrow(ErreurValidation);
  });
});

describe("validerLignes", () => {
  it("accepte un jeu valide", () => {
    expect(() => validerLignes(jeuValide(5))).not.toThrow();
  });

  it("refuse zéro ligne", () => {
    expect(() => validerLignes([])).toThrow("aucune ligne");
  });

  it("refuse une période dupliquée", () => {
    const lignes = jeuValide(3);
    lignes[2] = { ...lignes[1], nature_ecart: "estimation_a_partir_ecsp_2022" };
    expect(() => validerLignes(lignes)).toThrow("non strictement croissantes");
  });

  it("refuse des périodes désordonnées", () => {
    const lignes = jeuValide(3);
    [lignes[1], lignes[2]] = [lignes[2], lignes[1]];
    expect(() => validerLignes(lignes)).toThrow("non strictement croissantes");
  });

  it("refuse un mois manquant au milieu", () => {
    const lignes = jeuValide(3);
    // Sauter mai → passer directement à juin
    lignes[1] = ligneSynthetique({
      periode: new Date(Date.UTC(2022, 5, 1)), // juin au lieu de mai
      nature_ecart: "estimation_a_partir_ecsp_2022",
    });
    lignes[2] = ligneSynthetique({
      periode: new Date(Date.UTC(2022, 6, 1)),
      nature_ecart: "estimation_a_partir_ecsp_2022",
    });
    expect(() => validerLignes(lignes)).toThrow("Mois manquant");
  });

  it("refuse une nature_ecart inconnue", () => {
    const lignes = jeuValide(2);
    (lignes[1] as unknown as Record<string, unknown>).nature_ecart = "inventee";
    expect(() => validerLignes(lignes as LigneDifferentiel[])).toThrow("inconnue");
  });

  it("refuse plus d'une ligne mesure_ecsp_2022", () => {
    const lignes = jeuValide(3);
    lignes[1] = { ...lignes[1], nature_ecart: "mesure_ecsp_2022" };
    expect(() => validerLignes(lignes)).toThrow("mesure_ecsp_2022");
  });

  it("refuse aucune ligne mesure_ecsp_2022", () => {
    const lignes = jeuValide(3);
    lignes[0] = { ...lignes[0], nature_ecart: "estimation_a_partir_ecsp_2022" };
    expect(() => validerLignes(lignes)).toThrow("mesure_ecsp_2022");
  });
});

describe("formaterMoisUtc", () => {
  it("avril 2022 quel que soit le fuseau", () => {
    // Le 1er avril 2022 00:00 UTC — ne doit jamais devenir mars 2022
    const date = new Date(Date.UTC(2022, 3, 1));
    expect(formaterMoisUtc(date)).toBe("avril 2022");
  });

  it("décembre 2025", () => {
    expect(formaterMoisUtc(new Date(Date.UTC(2025, 11, 1)))).toBe("décembre 2025");
  });
});
