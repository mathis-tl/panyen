import { describe, it, expect } from "vitest";
import { creerRegistreNettoyage, identifiantBoutonPoste } from "./cycle-ecran.ts";

describe("registre de nettoyage", () => {
  it("exécute chaque nettoyage enregistré, dans l'ordre", () => {
    const registre = creerRegistreNettoyage();
    const trace: string[] = [];
    registre.enregistrer(() => trace.push("observateur"));
    registre.enregistrer(() => trace.push("frame"));

    registre.nettoyer();

    expect(trace).toEqual(["observateur", "frame"]);
  });

  it("vide la liste : un second nettoyage ne rejoue rien", () => {
    const registre = creerRegistreNettoyage();
    let appels = 0;
    registre.enregistrer(() => {
      appels += 1;
    });

    registre.nettoyer();
    registre.nettoyer();

    expect(appels).toBe(1);
    expect(registre.enAttente()).toBe(0);
  });

  it("n'accumule rien : n rendus successifs laissent au plus n nettoyages en attente", () => {
    const registre = creerRegistreNettoyage();

    for (let i = 0; i < 4; i++) {
      registre.nettoyer();
      registre.enregistrer(() => {});
      expect(registre.enAttente()).toBe(1);
    }

    registre.nettoyer();
    expect(registre.enAttente()).toBe(0);
  });

  it("un nettoyage qui échoue n'empêche pas les suivants", () => {
    const registre = creerRegistreNettoyage();
    let suivantExecute = false;
    registre.enregistrer(() => {
      throw new Error("disconnect impossible");
    });
    registre.enregistrer(() => {
      suivantExecute = true;
    });

    expect(() => registre.nettoyer()).not.toThrow();
    expect(suivantExecute).toBe(true);
  });
});

describe("identifiantBoutonPoste", () => {
  it("est stable et distinct par poste", () => {
    expect(identifiantBoutonPoste("alimentation")).toBe("bouton-poste-alimentation");
    expect(identifiantBoutonPoste("energie")).toBe("bouton-poste-energie");
    expect(identifiantBoutonPoste("services")).not.toBe(
      identifiantBoutonPoste("produits_manufactures"),
    );
  });
});
