import { describe, expect, it } from "vitest";
import { QUALITE, lignesQualite } from "./qualite.ts";
import { SECTIONS_TECHOS, texteVisibleTechos } from "./contenu-techos.ts";

describe("données qualité", () => {
  it("donne quatre mesures Lighthouse, toutes entre 0 et 100", () => {
    expect(QUALITE.lighthouse).toHaveLength(4);
    for (const m of QUALITE.lighthouse) {
      for (const v of [m.performance, m.accessibilite, m.bonnesPratiques, m.seo]) {
        expect(v).toBeGreaterThan(0);
        expect(v).toBeLessThanOrEqual(100);
      }
    }
  });

  it("n'affiche aucune valeur restée à zéro, sauf hôtes tiers et erreurs", () => {
    const r = QUALITE.reseau;
    expect(r.accueilHorsVideoKo).toBeGreaterThan(0);
    expect(r.requetesAccueil).toBeGreaterThan(0);
    expect(r.techosKo).toBeGreaterThan(0);
    expect(QUALITE.controles.vitest).toBeGreaterThan(0);
    expect(r.hotesTiers).toBe(0);
    expect(r.erreursConsole).toBe(0);
  });

  it("écrit des lignes sans tiret cadratin ni emoji", () => {
    const texte = lignesQualite(QUALITE).join("\n");
    expect(texte).not.toContain("—");
    expect(texte).toMatch(/Hôtes tiers : 0/);
  });
});

describe("page techos", () => {
  it("couvre la collecte, le calcul, les limites et les contrôles", () => {
    const ids = SECTIONS_TECHOS.map((s) => s.id);
    for (const attendu of ["trajet", "calcul", "limites-calcul", "controles", "gazole"]) {
      expect(ids).toContain(attendu);
    }
    const texte = texteVisibleTechos();
    expect(texte).toContain("1 + a");
    expect(texte).toContain("estimation");
    expect(texte).not.toContain("—");
  });
});
