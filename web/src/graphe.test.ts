import { describe, it, expect } from "vitest";
import {
  SEUIL_ETROIT_PX,
  calculerDispositionGraphe,
  jalonsRepereGraphe,
  libellesFinCourbes,
} from "./graphe.ts";
import { formaterPct } from "./calculs.ts";

describe("calculerDispositionGraphe", () => {
  it("fonde la largeur sur le conteneur sans plafond à 720 px", () => {
    const large = calculerDispositionGraphe(1040);
    expect(large.largeur).toBe(1040);
    expect(large.largeur).toBeGreaterThan(720);

    const moyen = calculerDispositionGraphe(800);
    expect(moyen.largeur).toBe(800);
  });

  it("recompose les marges en largeur étroite au lieu d'imposer 130 px à droite", () => {
    const etroit = calculerDispositionGraphe(360);
    expect(etroit.etroit).toBe(true);
    expect(etroit.largeur).toBe(360);
    expect(etroit.marginRight).toBeLessThan(60);
    expect(etroit.marginRight).toBeGreaterThanOrEqual(30);
    expect(etroit.labelsALinterieur).toBe(true);

    const large = calculerDispositionGraphe(960);
    expect(large.etroit).toBe(false);
    expect(large.largeur).toBe(960);
  });

  it("refuse une largeur de conteneur invalide", () => {
    expect(() => calculerDispositionGraphe(0)).toThrow(/largeur/i);
    expect(() => calculerDispositionGraphe(-10)).toThrow(/largeur/i);
  });

  it(`classe comme étroit sous ${SEUIL_ETROIT_PX} px`, () => {
    expect(calculerDispositionGraphe(SEUIL_ETROIT_PX - 1).etroit).toBe(true);
    expect(calculerDispositionGraphe(SEUIL_ETROIT_PX).etroit).toBe(false);
  });
});

describe("libellesFinCourbes", () => {
  it("écrit les noms complets Martinique et France métropolitaine", () => {
    const libelles = libellesFinCourbes(12.3, 8.1);
    expect(libelles.martinique).toContain("Martinique");
    expect(libelles.martinique).toContain(formaterPct(12.3));
    expect(libelles.franceMetropolitaine).toContain("France métropolitaine");
    expect(libelles.franceMetropolitaine).not.toContain("métrop.");
    expect(libelles.franceMetropolitaine).toContain(formaterPct(8.1));
  });
});

describe("jalonsRepereGraphe", () => {
  it("garde min./max. et omet le libellé redondant « actuel »", () => {
    const min = new Date(Date.UTC(2023, 0, 1));
    const max = new Date(Date.UTC(2024, 5, 1));
    const actuel = new Date(Date.UTC(2026, 6, 1));
    const jalons = jalonsRepereGraphe(min, max, actuel);

    expect(jalons).toHaveLength(3);
    expect(jalons.find((j) => j.periode === min)?.label).toBe("min.");
    expect(jalons.find((j) => j.periode === max)?.label).toBe("max.");
    expect(jalons.find((j) => j.periode === actuel)?.label).toBeNull();
    expect(jalons.some((j) => j.label === "actuel")).toBe(false);
  });
});
