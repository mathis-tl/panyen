import { describe, expect, it } from "vitest";
import {
  SEUIL_AUTANT_POINTS,
  SEUIL_ETAT_ECART_POINTS,
  barresMemeDate,
  ecartsAnnuels,
  etatEcart,
  eurosPourCentHexagone,
  formaterEcartEntier,
  libelleEstimation,
  phraseConstat,
  phraseEstimationsAnnuelles,
  phrasePicEstime,
  resoudreEmplacements,
  titreReponse,
} from "./calculs-ecran.ts";
import type { LigneDifferentiel } from "./types.ts";

function ligne(overrides: Partial<LigneDifferentiel> = {}): LigneDifferentiel {
  return {
    periode: new Date(Date.UTC(2022, 3, 1)),
    dernier_mois_commun: new Date(Date.UTC(2026, 6, 1)),
    poste: "alimentation",
    libelle_poste: "Alimentation",
    fichier_source: "data/raw/insee/ipc.xml",
    collecte_utc: new Date(Date.UTC(2026, 8, 1)),
    idbank_martinique: "011813726",
    idbank_france_metropolitaine: "011813720",
    facteur_martinique: 1.8,
    facteur_france_metropolitaine: 1.5,
    evolution_martinique_pct: 80,
    evolution_france_metropolitaine_pct: 50,
    differentiel_evolution_points: 30,
    coefficient_ecart: 1.2,
    ancre_ecsp_disponible: true,
    ecart_ecsp_2022_pct: 40,
    ecart_prix_estime_pct: 40,
    source_ecsp: "https://www.insee.fr/fr/statistiques/7649202",
    nature_ecart: "mesure_ecsp_2022",
    ...overrides,
  };
}

describe("trois états du titre", () => {
  it("place le seuil dans une constante nommée de 2 points", () => {
    expect(SEUIL_ETAT_ECART_POINTS).toBe(2);
  });

  it("creuse au-dessus de +2, resserre sous −2, et garde l'égalité dans le même", () => {
    expect(etatEcart(2.01)).toBe("creuse");
    expect(etatEcart(-2.01)).toBe("resserre");
    expect(etatEcart(2)).toBe("stable");
    expect(etatEcart(-2)).toBe("stable");
    expect(etatEcart(0)).toBe("stable");
  });

  it("formule le titre selon l'état, avec l'écart entier résolu", () => {
    expect(titreReponse("creuse", "40 %")).toBe(
      "Depuis 2022, l'écart s'est creusé : les courses alimentaires coûtent environ 40 % de plus en Martinique que dans l'Hexagone.",
    );
    expect(titreReponse("resserre", "38 %")).toBe(
      "Depuis 2022, l'écart s'est resserré : les courses alimentaires coûtent environ 38 % de plus en Martinique que dans l'Hexagone.",
    );
    expect(titreReponse("stable", "40 %")).toBe(
      "Depuis 2022, l'écart n'a presque pas bougé : les courses alimentaires coûtent environ 40 % de plus en Martinique que dans l'Hexagone.",
    );
  });
});

describe("barres à la même date", () => {
  it("exprime chaque barre pour 100 € dans l'Hexagone, pas un niveau d'indice", () => {
    const ancre = ligne({
      ecart_ecsp_2022_pct: 40,
      ecart_prix_estime_pct: 40,
      facteur_martinique: 1.8,
      facteur_france_metropolitaine: 1.5,
    });
    const actuelle = ligne({
      ecart_ecsp_2022_pct: 40,
      ecart_prix_estime_pct: 42.5,
      facteur_martinique: 2.4,
      facteur_france_metropolitaine: 1.9,
      nature_ecart: "estimation_a_partir_ecsp_2022",
    });
    const barres = barresMemeDate(ancre, actuelle);

    expect(barres.map((b) => b.cle)).toEqual([
      "hexagone",
      "martinique_2022",
      "martinique_aujourdhui",
    ]);
    expect(barres[0].euros).toBe(100);
    expect(barres[1].euros).toBeCloseTo(140, 5);
    expect(barres[2].euros).toBeCloseTo(142.5, 5);
    expect(barres[1].eurosHachures).toBe(0);
    expect(barres[2].eurosHachures).toBeCloseTo(2.5, 5);
    expect(barres[2].nature).toBe("estimation");

    const serialise = JSON.stringify(barres);
    expect(serialise).not.toContain("valeur_indice");
    expect(serialise).not.toContain("1.8");
    expect(serialise).not.toContain("2.4");
    for (const barre of barres) {
      expect(barre.euros).not.toBeCloseTo(ancre.facteur_martinique * 100, 5);
      expect(barre.euros).not.toBeCloseTo(actuelle.facteur_martinique * 100, 5);
    }
  });

  it("hachure toute la barre du jour quand l'estimation est sous la mesure", () => {
    const barres = barresMemeDate(
      ligne({ ecart_ecsp_2022_pct: 40, ecart_prix_estime_pct: 40 }),
      ligne({ ecart_prix_estime_pct: 38, nature_ecart: "estimation_a_partir_ecsp_2022" }),
    );
    expect(barres[2].euros).toBeCloseTo(138, 5);
    expect(barres[2].eurosPleins).toBe(0);
    expect(barres[2].eurosHachures).toBeCloseTo(138, 5);
  });

  it("échoue si l'écart mesuré ou estimé manque", () => {
    expect(() =>
      barresMemeDate(
        ligne({ ecart_ecsp_2022_pct: null }),
        ligne({ ecart_prix_estime_pct: 40 }),
      ),
    ).toThrow(/écart/);
  });
});

describe("libellé du dernier mois commun", () => {
  it("change quand le mois change", () => {
    expect(libelleEstimation("juillet 2026")).toBe(
      "Estimation à fin juillet 2026, dernier mois publié pour les deux territoires.",
    );
    expect(libelleEstimation("juin 2026")).toBe(
      "Estimation à fin juin 2026, dernier mois publié pour les deux territoires.",
    );
    expect(libelleEstimation("juillet 2026")).not.toBe(libelleEstimation("août 2025"));
  });

  it("refuse un mois vide", () => {
    expect(() => libelleEstimation("  ")).toThrow(/mois/);
  });
});

describe("emplacements du récit", () => {
  it("substitue chaque emplacement nommé", () => {
    expect(
      resoudreEmplacements("Écart de {ecart_alimentaire_2022}.", {
        ecart_alimentaire_2022: "40 %",
      }),
    ).toBe("Écart de 40 %.");
  });

  it("échoue si un emplacement n'est pas résolu", () => {
    expect(() => resoudreEmplacements("Pic à {pic_estime}.", {})).toThrow(
      /non résolu/,
    );
    expect(() =>
      resoudreEmplacements("Pic à {pic_estime}.", { pic_estime: "  " }),
    ).toThrow(/non résolu/);
  });
});

describe("écarts annuels", () => {
  it("affiche 2022 comme la mesure ECSP, pas comme l'estimation de décembre", () => {
    const annees = ecartsAnnuels([
      ligne({
        periode: new Date(Date.UTC(2022, 3, 1)),
        ecart_prix_estime_pct: 40,
        nature_ecart: "mesure_ecsp_2022",
      }),
      ligne({
        periode: new Date(Date.UTC(2022, 11, 1)),
        ecart_prix_estime_pct: 39.9,
        nature_ecart: "estimation_a_partir_ecsp_2022",
      }),
      ligne({
        periode: new Date(Date.UTC(2024, 11, 1)),
        ecart_prix_estime_pct: 42.5,
        nature_ecart: "estimation_a_partir_ecsp_2022",
      }),
    ]);
    expect(annees.map((annee) => annee.annee)).toEqual([2022, 2024]);
    expect(annees[0].nature).toBe("mesure");
    expect(annees[0].ecartPct).toBe(40);
    expect(annees[1].nature).toBe("estimation");
    expect(annees[1].ecartPct).toBe(42.5);
  });
});

describe("phrase du pic estimé", () => {
  it("nomme l'écart, pas un « il »", () => {
    expect(phrasePicEstime(42.733, "décembre 2024", 40.477, "juillet 2026")).toBe(
      "Selon l'estimation, l'écart a atteint environ 42,7 % en décembre 2024 avant de revenir vers 40,5 % en juillet 2026.",
    );
  });
});

describe("estimations annuelles affichées", () => {
  it("prend le min et le max des barres estimées, pas le creux d'un mois sans barre", () => {
    const phrase = phraseEstimationsAnnuelles([
      ligne({
        periode: new Date(Date.UTC(2022, 3, 1)),
        ecart_prix_estime_pct: 40.2,
        nature_ecart: "mesure_ecsp_2022",
      }),
      ligne({
        periode: new Date(Date.UTC(2023, 5, 1)),
        ecart_prix_estime_pct: 36.1,
        nature_ecart: "estimation_a_partir_ecsp_2022",
      }),
      ligne({
        periode: new Date(Date.UTC(2023, 11, 1)),
        ecart_prix_estime_pct: 41,
        nature_ecart: "estimation_a_partir_ecsp_2022",
      }),
      ligne({
        periode: new Date(Date.UTC(2024, 11, 1)),
        ecart_prix_estime_pct: 42.7,
        nature_ecart: "estimation_a_partir_ecsp_2022",
      }),
    ]);
    expect(phrase).toBe("Les estimations annuelles vont de 41,0 % à 42,7 %.");
    expect(phrase).not.toContain("36,1");
    expect(phrase).not.toContain("40,2");
  });
});

describe("écart entier du titre", () => {
  it("arrondit à l'unité, y compris sur la frontière 0,5", () => {
    expect(formaterEcartEntier(40.5)).toBe("41 %");
    expect(formaterEcartEntier(40.49)).toBe("40 %");
    expect(formaterEcartEntier(39.5)).toBe("40 %");
    expect(formaterEcartEntier(0.5)).toBe("1 %");
    expect(formaterEcartEntier(-1.5)).toBe("−1 %");
    expect(formaterEcartEntier(0)).toBe("0 %");
  });

  it("refuse un écart absent", () => {
    expect(() => formaterEcartEntier(Number.NaN)).toThrow(/arrondi/);
  });
});

describe("à peu près autant", () => {
  it("place le seuil dans une constante de 1 point", () => {
    expect(SEUIL_AUTANT_POINTS).toBe(1);
  });

  it("dit à peu près autant strictement sous 1 point, et plus ou moins sur la frontière", () => {
    const autant = phraseConstat("les prix de l'alimentation", 0.999, "12,0", "11,1");
    expect(autant).toContain("à peu près autant");
    expect(phraseConstat("les prix de l'alimentation", -0.999, "1,0", "1,9")).toContain(
      "à peu près autant",
    );
    expect(phraseConstat("les prix de l'alimentation", 0, "3,0", "3,0")).toContain(
      "à peu près autant",
    );
    expect(phraseConstat("les prix de l'alimentation", 1, "12,0", "11,0")).toContain(
      "plus augmenté",
    );
    expect(phraseConstat("les prix de l'alimentation", 1, "12,0", "11,0")).not.toContain(
      "à peu près autant",
    );
    expect(phraseConstat("les prix de l'alimentation", -1, "10,0", "11,0")).toContain(
      "moins augmenté",
    );
    expect(phraseConstat("les prix de l'alimentation", -1, "10,0", "11,0")).not.toContain(
      "à peu près autant",
    );
  });
});

describe("euros pour 100 €", () => {
  it("convertit un écart de Fisher, pas un indice", () => {
    expect(eurosPourCentHexagone(40.2)).toBeCloseTo(140.2, 5);
    expect(eurosPourCentHexagone(-5)).toBeCloseTo(95, 5);
    expect(eurosPourCentHexagone(0)).toBe(100);
  });
});
