import { describe, it, expect, vi } from "vitest";
import * as Plot from "@observablehq/plot";
import {
  calculerDispositionGrapheCarburants,
  calculerDomainePrix,
  grapheCarburants,
  infobulleCarburants,
  pointsEscalierPlafond,
} from "./graphe-carburants.ts";
import type { ResumeCarburants } from "./calculs-carburants.ts";

describe("graphe carburants", () => {
  it("calcule une disposition responsive", () => {
    const etroit = calculerDispositionGrapheCarburants(360);
    expect(etroit.etroit).toBe(true);
    expect(etroit.largeur).toBe(360);

    const large = calculerDispositionGrapheCarburants(960);
    expect(large.etroit).toBe(false);
  });

  it("calcule un domaine vertical positif", () => {
    const domaine = calculerDomainePrix([1.5, 1.9, 2.1]);
    expect(domaine.min).toBeGreaterThanOrEqual(0);
    expect(domaine.max).toBeGreaterThan(domaine.min);
  });

  it("construit les points d'escalier du plafond", () => {
    const points = pointsEscalierPlafond([
      {
        debut: new Date(Date.UTC(2022, 3, 1)),
        finExclusive: new Date(Date.UTC(2022, 10, 16)),
        prixMax: 1.81,
        referenceActe: "A",
        urlSource: "https://x",
      },
      {
        debut: new Date(Date.UTC(2022, 10, 16)),
        finExclusive: null,
        prixMax: 1.68,
        referenceActe: "B",
        urlSource: "https://y",
      },
    ]);
    expect(points.length).toBe(3);
    expect(points[0].prix).toBe(1.81);
    expect(points[2].prix).toBe(1.68);
  });

  it("affiche l'infobulle au pointeur, pas une par mois en permanence", () => {
    const marques = [
      { date: new Date(Date.UTC(2022, 3, 1)), mediane: 1.7, q10: 1.5, q90: 1.9 },
      { date: new Date(Date.UTC(2022, 4, 1)), mediane: 1.6, q10: 1.4, q90: 1.8 },
    ];
    // Sans transformation pointer, Plot.tip n'a que le render du prototype
    // et dessine toutes les infobulles à la fois.
    const statique = Plot.tip(marques, { x: "date", y: "mediane" });
    expect(Object.hasOwn(statique, "render")).toBe(false);
    expect(Object.hasOwn(infobulleCarburants(marques), "render")).toBe(true);
  });

  it("n'exige pas d'échelle band pour le repère q25–q75 en utc", () => {
    // Le stub DOM ne suffit pas à rendre le SVG complet : ce test ne garantit
    // que l'absence de l'erreur d'échelle utc/band ; le rendu se vérifie en navigateur.
    // happy-dom n'est pas une dépendance du projet : stub minimal pour Plot.
    const svg = {
      ownerSVGElement: null,
      setAttribute: vi.fn(),
      style: {},
      appendChild: vi.fn(),
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(() => []),
    } as unknown as SVGSVGElement;
    const doc = {
      documentElement: { namespaceURI: "http://www.w3.org/1999/xhtml" },
      createElementNS: vi.fn((_ns: string, tag: string) => {
        if (tag === "svg") return svg;
        return {
          setAttribute: vi.fn(),
          style: {},
          appendChild: vi.fn(),
          textContent: "",
        };
      }),
      createElement: vi.fn(() => ({
        setAttribute: vi.fn(),
        style: {},
        appendChild: vi.fn(),
      })),
    };
    vi.stubGlobal("document", doc);
    vi.stubGlobal("window", {
      devicePixelRatio: 1,
      getComputedStyle: () => ({ getPropertyValue: () => "" }),
    });

    const resume: ResumeCarburants = {
      carburant: "Gazole",
      libelleCarburant: "Gazole",
      distributions: [
        {
          date: new Date(Date.UTC(2022, 3, 1)),
          moisComplet: true,
          q10: 1.5,
          q25: 1.6,
          mediane: 1.7,
          q75: 1.8,
          q90: 1.9,
          nombreStations: 100,
          collecteUtc: new Date(Date.UTC(2026, 8, 10)),
        },
        {
          date: new Date(Date.UTC(2022, 10, 1)),
          moisComplet: true,
          q10: 1.4,
          q25: 1.5,
          mediane: 1.6,
          q75: 1.7,
          q90: 1.8,
          nombreStations: 110,
          collecteUtc: new Date(Date.UTC(2026, 8, 10)),
        },
      ],
      plafonds: [
        {
          debut: new Date(Date.UTC(2022, 3, 1)),
          finExclusive: new Date(Date.UTC(2022, 10, 16)),
          prixMax: 1.81,
          referenceActe: "A",
          urlSource: "https://example.test/a",
        },
        {
          debut: new Date(Date.UTC(2022, 10, 16)),
          finExclusive: null,
          prixMax: 1.68,
          referenceActe: "B",
          urlSource: "https://example.test/b",
        },
      ],
      periodeDebut: new Date(Date.UTC(2022, 3, 1)),
      periodeFin: new Date(Date.UTC(2022, 10, 1)),
      dernierMoisIncomplet: false,
      collecteUtc: new Date(Date.UTC(2026, 8, 10)),
      phrase: "test",
      produitsNonComparables: [],
    };

    try {
      expect(() =>
        grapheCarburants(resume, calculerDispositionGrapheCarburants(720)),
      ).not.toThrow(/utc !== band|scale incompatible/i);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
