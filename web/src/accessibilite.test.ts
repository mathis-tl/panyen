import { describe, expect, it } from "vitest";
import { retirerEtiquettesDecoratives, type NoeudEtiquete } from "./accessibilite-svg.ts";
import { indexDepuisPosition } from "./curseur-mois.ts";

function noeud(role: string | null): NoeudEtiquete & { etiquette: boolean } {
  const n = {
    etiquette: true,
    hasAttribute: (nom: string) => nom === "role" && role !== null,
    removeAttribute: (nom: string) => {
      if (nom === "aria-label") n.etiquette = false;
    },
  };
  return n;
}

describe("retirerEtiquettesDecoratives", () => {
  it("retire aria-label des groupes sans rôle et garde ceux qui ont un rôle", () => {
    const sansRole = noeud(null);
    const avecRole = noeud("img");
    retirerEtiquettesDecoratives({ querySelectorAll: () => [sansRole, avecRole] });
    expect(sansRole.etiquette).toBe(false);
    expect(avecRole.etiquette).toBe(true);
  });
});

describe("indexDepuisPosition", () => {
  it("découpe la largeur en parts égales", () => {
    expect(indexDepuisPosition(0, 100, 4)).toBe(0);
    expect(indexDepuisPosition(24.9, 100, 4)).toBe(0);
    expect(indexDepuisPosition(25, 100, 4)).toBe(1);
    expect(indexDepuisPosition(99.9, 100, 4)).toBe(3);
  });

  it("borne hors de la zone et sans largeur", () => {
    expect(indexDepuisPosition(-10, 100, 4)).toBe(0);
    expect(indexDepuisPosition(500, 100, 4)).toBe(3);
    expect(indexDepuisPosition(10, 0, 4)).toBe(3);
  });

  it("refuse une liste vide", () => {
    expect(() => indexDepuisPosition(1, 100, 0)).toThrow("Aucun mois");
  });
});
