import { describe, it, expect } from "vitest";
import {
  BASE_PANIER_ILLUSTRATIF,
  calculerPanierIllustratif,
  calculerResume,
  desPrixDuPoste,
  prixDuPoste,
  expliquerPourcentageVsPoints,
  preparerSeriesEvolution,
  selectionnerJalons,
} from "./calculs.ts";
import { COLONNES_ATTENDUES, type LigneDifferentiel, type NatureEcart } from "./types.ts";

function formaterPctAttendue(n: number): string {
  return n.toFixed(1).replace(".", ",");
}

function ligneSynthetique(
  overrides: Partial<LigneDifferentiel> = {},
): LigneDifferentiel {
  return {
    periode: new Date(Date.UTC(2022, 3, 1)),
    dernier_mois_commun: new Date(Date.UTC(2022, 3, 1)),
    poste: "alimentation",
    libelle_poste: "Alimentation",
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
    ancre_ecsp_disponible: true,
    ecart_ecsp_2022_pct: 40.0,
    ecart_prix_estime_pct: 40.0,
    source_ecsp: "https://www.insee.fr/fr/statistiques/7649202",
    nature_ecart: "mesure_ecsp_2022",
    ...overrides,
  };
}

function ligneSansAncre(
  overrides: Partial<LigneDifferentiel> = {},
): LigneDifferentiel {
  return ligneSynthetique({
    poste: "energie",
    libelle_poste: "Énergie",
    idbank_martinique: "011813873",
    idbank_france_metropolitaine: "011813867",
    ancre_ecsp_disponible: false,
    ecart_ecsp_2022_pct: null,
    ecart_prix_estime_pct: null,
    source_ecsp: null,
    nature_ecart: null,
    ...overrides,
  });
}

/** Écart relatif cohérent avec les facteurs et l'ECSP. */
function ecartDepuisFacteurs(
  facteurMq: number,
  facteurFm: number,
  ecsp = 40,
): number {
  return ((1 + ecsp / 100) * (facteurMq / facteurFm) - 1) * 100;
}

/** Trajectoire : ancre 40 → min ~35 → max ~45 → actuelle ~40,2. */
function jeuTrajectoireResserréPuisCreusé(): LigneDifferentiel[] {
  const dernier = new Date(Date.UTC(2022, 6, 1));
  const fMinMq = 1.124;
  const fMinFm = 1.158;
  const fMaxMq = 1.185;
  const fMaxFm = 1.164;
  const fActMq = 1.196;
  const fActFm = 1.194;
  return [
    ligneSynthetique({
      periode: new Date(Date.UTC(2022, 3, 1)),
      dernier_mois_commun: dernier,
      nature_ecart: "mesure_ecsp_2022",
      ecart_prix_estime_pct: 40.0,
      facteur_martinique: 1.0,
      facteur_france_metropolitaine: 1.0,
    }),
    ligneSynthetique({
      periode: new Date(Date.UTC(2022, 4, 1)),
      dernier_mois_commun: dernier,
      nature_ecart: "estimation_a_partir_ecsp_2022",
      facteur_martinique: fMinMq,
      facteur_france_metropolitaine: fMinFm,
      evolution_martinique_pct: (fMinMq - 1) * 100,
      evolution_france_metropolitaine_pct: (fMinFm - 1) * 100,
      differentiel_evolution_points: (fMinMq - fMinFm) * 100,
      ecart_prix_estime_pct: ecartDepuisFacteurs(fMinMq, fMinFm),
    }),
    ligneSynthetique({
      periode: new Date(Date.UTC(2022, 5, 1)),
      dernier_mois_commun: dernier,
      nature_ecart: "estimation_a_partir_ecsp_2022",
      facteur_martinique: fMaxMq,
      facteur_france_metropolitaine: fMaxFm,
      evolution_martinique_pct: (fMaxMq - 1) * 100,
      evolution_france_metropolitaine_pct: (fMaxFm - 1) * 100,
      differentiel_evolution_points: (fMaxMq - fMaxFm) * 100,
      ecart_prix_estime_pct: ecartDepuisFacteurs(fMaxMq, fMaxFm),
    }),
    ligneSynthetique({
      periode: new Date(Date.UTC(2022, 6, 1)),
      dernier_mois_commun: dernier,
      nature_ecart: "estimation_a_partir_ecsp_2022",
      facteur_martinique: fActMq,
      facteur_france_metropolitaine: fActFm,
      evolution_martinique_pct: (fActMq - 1) * 100,
      evolution_france_metropolitaine_pct: (fActFm - 1) * 100,
      differentiel_evolution_points: (fActMq - fActFm) * 100,
      ecart_prix_estime_pct: ecartDepuisFacteurs(fActMq, fActFm),
    }),
  ];
}

function jeuEnergieSansAncre(): LigneDifferentiel[] {
  const dernier = new Date(Date.UTC(2022, 5, 1));
  return [
    ligneSansAncre({
      periode: new Date(Date.UTC(2022, 3, 1)),
      dernier_mois_commun: dernier,
      differentiel_evolution_points: 0,
    }),
    ligneSansAncre({
      periode: new Date(Date.UTC(2022, 4, 1)),
      dernier_mois_commun: dernier,
      evolution_martinique_pct: 8,
      evolution_france_metropolitaine_pct: 3,
      differentiel_evolution_points: 5,
      facteur_martinique: 1.08,
      facteur_france_metropolitaine: 1.03,
      coefficient_ecart: 1.08 / 1.03,
    }),
    ligneSansAncre({
      periode: new Date(Date.UTC(2022, 5, 1)),
      dernier_mois_commun: dernier,
      evolution_martinique_pct: 12,
      evolution_france_metropolitaine_pct: 4,
      differentiel_evolution_points: 8,
      facteur_martinique: 1.12,
      facteur_france_metropolitaine: 1.04,
      coefficient_ecart: 1.12 / 1.04,
    }),
  ];
}

describe("selectionnerJalons", () => {
  it("sélectionne ancre, minimum, maximum et actuelle", () => {
    const jeu = jeuTrajectoireResserréPuisCreusé();
    const jalons = selectionnerJalons(jeu);
    expect(jalons.ancre.nature_ecart).toBe("mesure_ecsp_2022");
    expect(jalons.minimumEstime.periode.getUTCMonth()).toBe(4);
    expect(jalons.maximumEstime.periode.getUTCMonth()).toBe(5);
    expect(jalons.actuelle).toBe(jeu[jeu.length - 1]);
    expect(jalons.minimumEstime.ecart_prix_estime_pct).toBeLessThan(
      jalons.ancre.ecart_ecsp_2022_pct as number,
    );
    expect(jalons.maximumEstime.ecart_prix_estime_pct).toBeGreaterThan(
      jalons.ancre.ecart_ecsp_2022_pct as number,
    );
  });

  it("égalité d'extrema : retient la première période", () => {
    const dernier = new Date(Date.UTC(2022, 5, 1));
    const lignes = [
      ligneSynthetique({
        periode: new Date(Date.UTC(2022, 3, 1)),
        dernier_mois_commun: dernier,
        nature_ecart: "mesure_ecsp_2022",
      }),
      ligneSynthetique({
        periode: new Date(Date.UTC(2022, 4, 1)),
        dernier_mois_commun: dernier,
        nature_ecart: "estimation_a_partir_ecsp_2022",
        ecart_prix_estime_pct: 38.0,
      }),
      ligneSynthetique({
        periode: new Date(Date.UTC(2022, 5, 1)),
        dernier_mois_commun: dernier,
        nature_ecart: "estimation_a_partir_ecsp_2022",
        ecart_prix_estime_pct: 38.0,
      }),
    ];
    const jalons = selectionnerJalons(lignes);
    expect(jalons.minimumEstime.periode.getUTCMonth()).toBe(4);
    expect(jalons.maximumEstime.periode.getUTCMonth()).toBe(4);
  });
});

describe("calculerResume — trajectoire", () => {
  it("resserré puis creusé puis revenu presque au niveau de 2022", () => {
    const r = calculerResume(jeuTrajectoireResserréPuisCreusé());
    expect(r.conclusion).toMatch(/resserré.*creusé/s);
    expect(r.conclusion).toMatch(/presque.*2022|niveau de 2022/);
    expect(r.phrase).toContain(
      formaterPctAttendue(r.actuelle.ecart_prix_estime_pct as number),
    );
    expect(r.phrase).toContain("40,0");
    expect(r.phrase).toMatch(/\+|−/);
    expect(r.phrase).toContain("estimation");
    expect(r.phrase).toContain("mesure");
  });

  it("valeur et signe visibles même sous le seuil de 0,5 point", () => {
    const r = calculerResume(jeuTrajectoireResserréPuisCreusé());
    expect(Math.abs(r.variationEcartPoints as number)).toBeLessThan(0.5);
    expect(r.phrase).toMatch(/\+|−/);
    expect(r.phrase).toContain(
      formaterPctAttendue(r.actuelle.ecart_prix_estime_pct as number),
    );
  });

  it("formulation de repli si trajectoire absente", () => {
    const dernier = new Date(Date.UTC(2022, 5, 1));
    const lignes = [
      ligneSynthetique({
        periode: new Date(Date.UTC(2022, 3, 1)),
        dernier_mois_commun: dernier,
        nature_ecart: "mesure_ecsp_2022" as NatureEcart,
        ecart_prix_estime_pct: 40.0,
      }),
      ligneSynthetique({
        periode: new Date(Date.UTC(2022, 4, 1)),
        dernier_mois_commun: dernier,
        nature_ecart: "estimation_a_partir_ecsp_2022",
        ecart_prix_estime_pct: 41.0,
      }),
      ligneSynthetique({
        periode: new Date(Date.UTC(2022, 5, 1)),
        dernier_mois_commun: dernier,
        nature_ecart: "estimation_a_partir_ecsp_2022",
        ecart_prix_estime_pct: 42.5,
      }),
    ];
    const r = calculerResume(lignes);
    expect(r.conclusion).not.toMatch(/resserré puis creusé/);
    expect(r.conclusion).toMatch(/supérieur|au-dessus|plus élevé/i);
    expect(r.phrase).toContain("42,5");
  });

  it("contient le dernier mois commun", () => {
    const r = calculerResume(jeuTrajectoireResserréPuisCreusé());
    expect(r.dernierMoisCommun).toBe("juillet 2022");
  });
});

describe("calculerResume — sans ancre", () => {
  it("récit réduit en points, sans panier ni écart de prix", () => {
    const r = calculerResume(jeuEnergieSansAncre(), "energie");
    expect(r.ancreEcspDisponible).toBe(false);
    expect(r.panierActuelle).toBeNull();
    expect(r.noteSansAncre).toMatch(/fonctions? de consommation/i);
    expect(r.phrase.toLowerCase()).toMatch(/point/);
    expect(r.phrase.toLowerCase()).not.toMatch(/écart de prix/);
    expect(r.phrase).not.toMatch(/panier/i);
    expect(r.conclusion.toLowerCase()).toMatch(/point/);
  });
});

describe("panier fictif", () => {
  it("base pédagogique nommée = 100", () => {
    expect(BASE_PANIER_ILLUSTRATIF).toBe(100);
  });

  it("calcule le panier à l'ancre sans coder 140 en dur", () => {
    const ancre = ligneSynthetique({
      ecart_ecsp_2022_pct: 40.0,
      facteur_martinique: 1.0,
      facteur_france_metropolitaine: 1.0,
      ecart_prix_estime_pct: 40.0,
    });
    const panier = calculerPanierIllustratif(ancre);
    expect(panier.metropole).toBe(100);
    expect(panier.martinique).toBe(140);
    expect(panier.ecartRelatifPct).toBeCloseTo(40.0, 5);
  });

  it("identité avec ecart_prix_estime_pct aux jalons", () => {
    for (const ligne of jeuTrajectoireResserréPuisCreusé()) {
      const panier = calculerPanierIllustratif(ligne);
      expect(panier.ecartRelatifPct).toBeCloseTo(
        ligne.ecart_prix_estime_pct as number,
        5,
      );
    }
  });
});

describe("preparerSeriesEvolution", () => {
  it("prépare deux séries distinctes avec premier et dernier mois", () => {
    const series = preparerSeriesEvolution(jeuTrajectoireResserréPuisCreusé());
    expect(series.points.length).toBe(4);
    expect(series.points[0]).toHaveProperty("evolution_martinique_pct");
    expect(series.points[0]).toHaveProperty("evolution_france_metropolitaine_pct");
    expect(series.premierMois).toBe("avril 2022");
    expect(series.dernierMois).toBe("juillet 2022");
  });
});

describe("expliquerPourcentageVsPoints", () => {
  it("distingue pourcentage et point de pourcentage", () => {
    const texte = expliquerPourcentageVsPoints(
      jeuTrajectoireResserréPuisCreusé().at(-1)!,
    );
    expect(texte.toLowerCase()).toMatch(/pourcentage/);
    expect(texte.toLowerCase()).toMatch(/point/);
    expect(texte).not.toMatch(/valeur_indice/);
  });
});

describe("garde méthodologique", () => {
  it("aucune colonne de niveau d'indice dans COLONNES_ATTENDUES", () => {
    expect(COLONNES_ATTENDUES).not.toContain("valeur_indice");
    for (const col of COLONNES_ATTENDUES) {
      expect(col).not.toMatch(/indice.*valeur|valeur.*indice|niveau/i);
    }
  });

  it("aucune fonction d'affichage n'expose valeur_indice", () => {
    const r = calculerResume(jeuTrajectoireResserréPuisCreusé());
    const serialise = JSON.stringify(r);
    expect(serialise).not.toContain("valeur_indice");
  });
});

describe("formulations françaises par poste", () => {
  it("insère l'article : jamais « les prix énergie »", () => {
    expect(prixDuPoste("energie")).toBe("les prix de l'énergie");
    expect(prixDuPoste("produits_manufactures")).toBe(
      "les prix des produits manufacturés",
    );
    expect(prixDuPoste("services")).toBe("les prix des services");
    expect(prixDuPoste("alimentation")).toBe("les prix de l'alimentation");
  });

  it("décline aussi la forme complément du nom", () => {
    expect(desPrixDuPoste("energie")).toBe("des prix de l'énergie");
    expect(desPrixDuPoste("produits_manufactures")).toBe(
      "des prix des produits manufacturés",
    );
  });

  it("aucune phrase de conclusion ne colle le libellé au mot prix", () => {
    for (const poste of [
      "energie",
      "produits_manufactures",
      "services",
    ] as const) {
      const resume = calculerResume(
        [
          ligneSansAncre({ poste, periode: new Date(Date.UTC(2022, 3, 1)) }),
          ligneSansAncre({
            poste,
            periode: new Date(Date.UTC(2022, 4, 1)),
            dernier_mois_commun: new Date(Date.UTC(2022, 4, 1)),
            facteur_martinique: 1.05,
            evolution_martinique_pct: 5,
            differentiel_evolution_points: 5,
            coefficient_ecart: 1.05,
          }),
        ],
        poste,
      );
      expect(resume.phrase).not.toMatch(/les prix (énergie|produits|services)/);
      expect(resume.phrase).toContain(prixDuPoste(poste));
    }
  });
});
