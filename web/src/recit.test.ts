import { describe, expect, it } from "vitest";
import type { LigneFormule, LigneNiveau, LigneRevenu } from "./chargement-contexte.ts";
import {
  blocsRecit,
  exigerFormule,
  libelleRegistre,
  pctPublie,
  phraseAnalyseNiveau,
} from "./recit.ts";
import type { CodePoste, LigneDifferentiel } from "./types.ts";

const formules: LigneFormule[] = [
  {
    annee_enquete: 2022,
    formule: "paasche_panier_martiniquais",
    ecart_pct: 31,
    source_url: "https://www.insee.fr/fr/statistiques/7649202",
    consulte_le: "2026-10-05",
    remarque: "test",
  },
];

describe("registres du récit", () => {
  it("nomme le troisième registre Analyse", () => {
    expect(libelleRegistre("mesure")).toBe("Mesuré");
    expect(libelleRegistre("contexte")).toBe("Contexte");
    expect(libelleRegistre("analyse")).toBe("Analyse");
  });
});

describe("formules ECSP du récit", () => {
  it("lit la valeur seedée et l'affiche à l'unité", () => {
    expect(pctPublie(exigerFormule(formules, "paasche_panier_martiniquais"))).toBe("31 %");
  });

  it("échoue bruyamment quand une formule manque, sans valeur de repli", () => {
    expect(() => exigerFormule(formules, "laspeyres_panier_hexagonal")).toThrow(
      /Formule ECSP absente/,
    );
  });
});

describe("textes de blocsRecit", () => {
  it("ne contient aucun tiret cadratin", () => {
    const textes = blocsRecit(lignesIpc(), niveauxRecit(), revenusRecit(), formulesRecit()).map(
      (bloc) => bloc.texte,
    );
    expect(textes.join("\n")).not.toContain("—");
    expect(textes.join("\n")).toContain("la fiscalité et les prix administrés");
  });
});

function moisCouverts(): Date[] {
  const dates: Date[] = [];
  let annee = 2022;
  let mois = 3;
  while (Date.UTC(annee, mois, 1) <= Date.UTC(2026, 7, 1)) {
    dates.push(new Date(Date.UTC(annee, mois, 1)));
    mois += 1;
    if (mois > 11) {
      mois = 0;
      annee += 1;
    }
  }
  return dates;
}

function lignesIpc(): LigneDifferentiel[] {
  const dates = moisCouverts();
  const fin = dates[dates.length - 1];
  const postes: CodePoste[] = [
    "alimentation",
    "energie",
    "produits_manufactures",
    "services",
  ];
  return postes.flatMap((poste) =>
    dates.map((periode, index) => {
      const ancre = poste === "alimentation";
      return {
        periode,
        dernier_mois_commun: fin,
        poste,
        libelle_poste: poste,
        fichier_source: "data/raw/insee/ipc.xml",
        collecte_utc: new Date(Date.UTC(2026, 9, 6)),
        idbank_martinique: "011813726",
        idbank_france_metropolitaine: "011813720",
        facteur_martinique: 1,
        facteur_france_metropolitaine: 1,
        evolution_martinique_pct: 0,
        evolution_france_metropolitaine_pct: 0,
        differentiel_evolution_points: 0,
        coefficient_ecart: 1,
        ancre_ecsp_disponible: ancre,
        ecart_ecsp_2022_pct: ancre ? 40.2 : null,
        ecart_prix_estime_pct: ancre ? (index === 0 ? 40.2 : 40.35) : null,
        source_ecsp: ancre ? "https://www.insee.fr/fr/statistiques/7649202" : null,
        nature_ecart: ancre
          ? index === 0
            ? "mesure_ecsp_2022"
            : "estimation_a_partir_ecsp_2022"
          : null,
      } satisfies LigneDifferentiel;
    }),
  );
}

function niveauxRecit(): LigneNiveau[] {
  const remarque = "Comparaison 2010-2015 délicate.";
  const lignes: Array<[number, string, number]> = [
    [2010, "alimentation", 38],
    [2015, "alimentation", 39],
    [2022, "alimentation", 40.2],
    [2010, "ensemble", 12],
    [2015, "ensemble", 12.5],
    [2022, "ensemble", 13.8],
  ];
  return lignes.map(([annee, poste, ecart]) => ({
    annee_enquete: annee,
    poste,
    ecart_fisher_pct: ecart,
    precision_pct: 0.1,
    source_url: "https://www.insee.fr/fr/statistiques/7648939",
    consulte_le: "2026-10-06",
    remarque,
  }));
}

function revenusRecit(): LigneRevenu[] {
  return [
    ["salaire_net_moyen_prive", -8, 2024],
    ["salaire_net_moyen_fonction_publique", 12, 2024],
    ["revenu_salarial", -3, 2023],
    ["revenu_activite_non_salaries", 1, 2022],
  ].map(([indicateur, ecart, annee]) => ({
    annee: annee as number,
    indicateur: indicateur as string,
    ecart_moyenne_nationale_pct: ecart as number,
    source_url: "https://www.insee.fr/fr/statistiques/8641234",
    consulte_le: "2026-10-06",
    champ: "Moyenne de la France, Île-de-France incluse.",
  }));
}

function formulesRecit(): LigneFormule[] {
  return [
    ["paasche_panier_martiniquais", 31],
    ["laspeyres_panier_hexagonal", 48],
  ].map(([formule, ecart]) => ({
    annee_enquete: 2022,
    formule: formule as string,
    ecart_pct: ecart as number,
    source_url: "https://www.insee.fr/fr/statistiques/7649202",
    consulte_le: "2026-10-06",
    remarque: "test",
  }));
}

describe("phraseAnalyseNiveau", () => {
  it("dit « revenu vers son niveau de départ » quand l'écart estimé est au moins égal à l'ancre", () => {
    const t = phraseAnalyseNiveau(40.4, 40.2, -10.7);
    expect(t).toContain("revenu vers son niveau de départ, pas en dessous");
    expect(t).toContain("qui ne s'est pas refermé");
    expect(t).toContain("revenus du privé inférieurs");
  });

  it("ne dit plus « pas en dessous » quand l'écart estimé passe sous l'ancre", () => {
    const t = phraseAnalyseNiveau(39.0, 40.2, -10.7);
    expect(t).toContain("passé sous son niveau de départ");
    expect(t).not.toContain("pas en dessous");
    expect(t).not.toContain("ne s'est pas refermé");
  });

  it("retire les revenus du privé quand le salaire n'est pas négatif", () => {
    expect(phraseAnalyseNiveau(40.4, 40.2, 2.0)).not.toContain("revenus du privé");
  });

  it("échoue si une valeur manque", () => {
    expect(() => phraseAnalyseNiveau(Number.NaN, 40.2, -1)).toThrow(/Analyse impossible/);
  });
});
