import { describe, it, expect } from "vitest";
import { demarrer } from "./main.ts";
import { contenuErreur } from "./rendu.ts";

describe("échec de chargement", () => {
  it("contenuErreur affiche Données indisponibles sans chiffre de résultat", () => {
    const html = contenuErreur(new Error("HTTP 404"));
    expect(html).toContain("Données indisponibles");
    expect(html).toContain("HTTP 404");
    expect(html).not.toContain("jalon");
    expect(html).not.toContain("estimation actuelle");
  });

  it("source simulée absente → erreur seule, aucun rendu partiel", async () => {
    const conteneur = { innerHTML: "" } as HTMLElement;
    await demarrer(conteneur, {
      charger: async () => {
        throw new Error("Impossible de charger : 404");
      },
    });
    expect(conteneur.innerHTML).toContain("Données indisponibles");
    expect(conteneur.innerHTML).not.toContain("graphe");
    expect(conteneur.innerHTML).not.toContain("jalon");
    expect(conteneur.innerHTML).not.toMatch(/écart alimentaire estimé/i);
  });
});
