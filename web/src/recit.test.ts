import { describe, expect, it } from "vitest";
import type { LigneFormule } from "./chargement-contexte.ts";
import { exigerFormule, libelleRegistre, pctPublie } from "./recit.ts";

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
