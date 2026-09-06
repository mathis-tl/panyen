import { describe, it, expect, vi } from "vitest";
import {
  validerColonnes,
  validerLignes,
  formaterMoisUtc,
  ErreurValidation,
} from "./validation.ts";
import {
  COLONNES_ATTENDUES,
  POSTES_ATTENDUS,
  type CodePoste,
  type LigneDifferentiel,
  type NatureEcart,
} from "./types.ts";
import { demarrer } from "./main.ts";

/** Fabrique une ligne synthétique valide. */
function ligneSynthetique(
  overrides: Partial<LigneDifferentiel> & {
    periode?: Date;
    nature_ecart?: NatureEcart | null;
  } = {},
): LigneDifferentiel {
  const poste = (overrides.poste ?? "alimentation") as CodePoste;
  const avecAncre = poste === "alimentation";
  return {
    periode: new Date(Date.UTC(2022, 3, 1)),
    dernier_mois_commun: new Date(Date.UTC(2022, 3, 1)),
    poste,
    libelle_poste:
      poste === "alimentation"
        ? "Alimentation"
        : poste === "energie"
          ? "Énergie"
          : poste === "produits_manufactures"
            ? "Produits manufacturés"
            : "Services",
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
    ancre_ecsp_disponible: avecAncre,
    ecart_ecsp_2022_pct: avecAncre ? 40.0 : null,
    ecart_prix_estime_pct: avecAncre ? 40.0 : null,
    source_ecsp: avecAncre
      ? "https://www.insee.fr/fr/statistiques/7649202"
      : null,
    nature_ecart: avecAncre ? "mesure_ecsp_2022" : null,
    ...overrides,
  };
}

/** Jeu valide à quatre postes, N mois chacun. */
function jeuQuatrePostes(n: number): LigneDifferentiel[] {
  const dernier = new Date(Date.UTC(2022, 3 + n - 1, 1));
  const lignes: LigneDifferentiel[] = [];
  for (const poste of POSTES_ATTENDUS) {
    for (let i = 0; i < n; i++) {
      const avecAncre = poste === "alimentation";
      lignes.push(
        ligneSynthetique({
          poste,
          periode: new Date(Date.UTC(2022, 3 + i, 1)),
          dernier_mois_commun: dernier,
          nature_ecart: avecAncre
            ? i === 0
              ? "mesure_ecsp_2022"
              : "estimation_a_partir_ecsp_2022"
            : null,
          ancre_ecsp_disponible: avecAncre,
          ecart_ecsp_2022_pct: avecAncre ? 40.0 : null,
          ecart_prix_estime_pct: avecAncre ? 40.0 + i : null,
          source_ecsp: avecAncre
            ? "https://www.insee.fr/fr/statistiques/7649202"
            : null,
          differentiel_evolution_points: i * 0.3,
        }),
      );
    }
  }
  return lignes;
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
  it("accepte un jeu à quatre postes", () => {
    expect(() => validerLignes(jeuQuatrePostes(5))).not.toThrow();
  });

  it("refuse zéro ligne", () => {
    expect(() => validerLignes([])).toThrow("aucune ligne");
  });

  it("refuse un poste manquant", () => {
    const lignes = jeuQuatrePostes(3).filter((l) => l.poste !== "services");
    expect(() => validerLignes(lignes)).toThrow(/Poste manquant.*services/);
  });

  it("refuse des périodes désalignées entre postes", () => {
    const lignes = jeuQuatrePostes(3).filter(
      (l) => !(l.poste === "energie" && l.periode.getUTCMonth() === 5),
    );
    expect(() => validerLignes(lignes)).toThrow(/désalign/);
  });

  it("refuse un champ ECSP non nul sur un poste sans ancre", () => {
    const lignes = jeuQuatrePostes(2);
    const energie = lignes.find((l) => l.poste === "energie")!;
    energie.ecart_prix_estime_pct = 12;
    expect(() => validerLignes(lignes)).toThrow(/sans ancre/);
  });

  it("refuse une période dupliquée sur un poste", () => {
    const lignes = jeuQuatrePostes(3);
    const alim = lignes.filter((l) => l.poste === "alimentation");
    alim[2] = { ...alim[1], nature_ecart: "estimation_a_partir_ecsp_2022" };
    const autres = lignes.filter((l) => l.poste !== "alimentation");
    expect(() => validerLignes([...autres, ...alim])).toThrow(
      /non strictement croissantes/,
    );
  });

  it("refuse plus d'une ligne mesure_ecsp_2022 sur l'alimentation", () => {
    const lignes = jeuQuatrePostes(3);
    const alim = lignes.find(
      (l) => l.poste === "alimentation" && l.periode.getUTCMonth() === 4,
    )!;
    alim.nature_ecart = "mesure_ecsp_2022";
    expect(() => validerLignes(lignes)).toThrow("mesure_ecsp_2022");
  });
});

describe("formaterMoisUtc", () => {
  it("avril 2022 quel que soit le fuseau", () => {
    const date = new Date(Date.UTC(2022, 3, 1));
    expect(formaterMoisUtc(date)).toBe("avril 2022");
  });

  it("décembre 2025", () => {
    expect(formaterMoisUtc(new Date(Date.UTC(2025, 11, 1)))).toBe("décembre 2025");
  });
});

describe("bascule de poste sans réseau", () => {
  it("charge une seule fois et recalcule depuis les lignes en mémoire", async () => {
    const { calculerResume } = await import("./calculs.ts");
    const lignes = jeuQuatrePostes(3);
    const charger = vi.fn(async () => lignes);
    const conteneur = { innerHTML: "" } as HTMLElement;

    // Échec attendu sans DOM complet pour le rendu, mais le chargeur
    // ne doit être appelé qu'une fois avant toute bascule pure.
    await demarrer(conteneur, { charger }).catch(() => undefined);
    expect(charger).toHaveBeenCalledTimes(1);

    const alim = calculerResume(lignes, "alimentation");
    const energie = calculerResume(lignes, "energie");
    expect(alim.ancreEcspDisponible).toBe(true);
    expect(energie.ancreEcspDisponible).toBe(false);
    expect(energie.noteSansAncre).toMatch(/fonctions? de consommation/i);
    expect(charger).toHaveBeenCalledTimes(1);
  });
});
