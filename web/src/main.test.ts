import { describe, it, expect } from "vitest";
import { demarrer } from "./main.ts";
import type { OptionsEcran } from "./rendu.ts";
import type { ResumeEcran } from "./calculs.ts";
import type { CodePoste, LigneDifferentiel } from "./types.ts";

/** Deux mois par poste : assez pour une ancre et une estimation. */
function jeuQuatrePostes(): LigneDifferentiel[] {
  const postes: Array<[CodePoste, string, boolean]> = [
    ["alimentation", "Alimentation", true],
    ["energie", "Énergie", false],
    ["produits_manufactures", "Produits manufacturés", false],
    ["services", "Services", false],
  ];
  const lignes: LigneDifferentiel[] = [];
  for (const [poste, libelle_poste, avecAncre] of postes) {
    for (let mois = 0; mois < 2; mois++) {
      const facteurMq = 1 + 0.01 * mois;
      lignes.push({
        periode: new Date(Date.UTC(2022, 3 + mois, 1)),
        dernier_mois_commun: new Date(Date.UTC(2022, 4, 1)),
        poste,
        libelle_poste,
        fichier_source: "data/raw/insee/ipc_postes.xml",
        collecte_utc: new Date(Date.UTC(2026, 8, 6)),
        idbank_martinique: "011813726",
        idbank_france_metropolitaine: "011813720",
        facteur_martinique: facteurMq,
        facteur_france_metropolitaine: 1.0,
        evolution_martinique_pct: (facteurMq - 1) * 100,
        evolution_france_metropolitaine_pct: 0,
        differentiel_evolution_points: (facteurMq - 1) * 100,
        coefficient_ecart: facteurMq,
        ancre_ecsp_disponible: avecAncre,
        ecart_ecsp_2022_pct: avecAncre ? 40.0 : null,
        ecart_prix_estime_pct: avecAncre ? (1.4 * facteurMq - 1) * 100 : null,
        source_ecsp: avecAncre ? "https://www.insee.fr/fr/statistiques/7649202" : null,
        nature_ecart: avecAncre
          ? mois === 0
            ? "mesure_ecsp_2022"
            : "estimation_a_partir_ecsp_2022"
          : null,
      });
    }
  }
  return lignes;
}

interface Espion {
  conteneur: HTMLElement;
  rendus: ResumeEcran[];
  dernieresOptions: OptionsEcran | null;
  focalises: CodePoste[];
  options: Parameters<typeof demarrer>[1];
}

function espionner(): Espion {
  const espion: Espion = {
    conteneur: { innerHTML: "" } as HTMLElement,
    rendus: [],
    dernieresOptions: null,
    focalises: [],
    options: {},
  };
  espion.options = {
    charger: async () => jeuQuatrePostes(),
    afficher: (_conteneur, resume, options) => {
      espion.rendus.push(resume);
      espion.dernieresOptions = options;
    },
    focaliserPoste: (poste) => espion.focalises.push(poste),
  };
  return espion;
}

describe("bascule de poste", () => {
  it("ne vole pas le focus au premier rendu", async () => {
    const espion = espionner();
    await demarrer(espion.conteneur, espion.options);

    expect(espion.rendus).toHaveLength(1);
    expect(espion.rendus[0].poste).toBe("alimentation");
    expect(espion.focalises).toEqual([]);
  });

  it("rend le focus au bouton du poste choisi après redessin", async () => {
    const espion = espionner();
    await demarrer(espion.conteneur, espion.options);

    espion.dernieresOptions!.onChangerPoste("energie");

    expect(espion.rendus).toHaveLength(2);
    expect(espion.rendus[1].poste).toBe("energie");
    expect(espion.focalises).toEqual(["energie"]);
    expect(espion.dernieresOptions!.posteSelectionne).toBe("energie");
  });

  it("bascule sans rappeler la source : un seul chargement pour quatre postes", async () => {
    const espion = espionner();
    let chargements = 0;
    await demarrer(espion.conteneur, {
      ...espion.options,
      charger: async () => {
        chargements += 1;
        return jeuQuatrePostes();
      },
    });

    for (const poste of ["energie", "produits_manufactures", "services"] as const) {
      espion.dernieresOptions!.onChangerPoste(poste);
    }

    expect(chargements).toBe(1);
    expect(espion.rendus).toHaveLength(4);
    expect(espion.focalises).toEqual([
      "energie",
      "produits_manufactures",
      "services",
    ]);
  });

  it("chaque poste garde son propre récit : l'ancre ECSP ne fuit pas d'un poste à l'autre", async () => {
    const espion = espionner();
    await demarrer(espion.conteneur, espion.options);
    espion.dernieresOptions!.onChangerPoste("energie");
    espion.dernieresOptions!.onChangerPoste("alimentation");

    const [alimentation, energie, retour] = espion.rendus;
    expect(alimentation.ancreEcspDisponible).toBe(true);
    expect(energie.ancreEcspDisponible).toBe(false);
    expect(energie.panierActuelle).toBeNull();
    expect(energie.noteSansAncre).not.toBeNull();
    expect(retour.ancreEcspDisponible).toBe(true);
    expect(retour.phrase).toBe(alimentation.phrase);
  });
});

describe("titre de page", () => {
  it("suit le poste sélectionné au lieu de rester sur l'alimentaire", async () => {
    const espion = espionner();
    const titres: string[] = [];
    await demarrer(espion.conteneur, {
      ...espion.options,
      titrer: (t) => titres.push(t),
    });

    expect(titres).toHaveLength(1);
    expect(titres[0]).toContain("alimentation");

    espion.dernieresOptions!.onChangerPoste("energie");
    expect(titres[1]).toContain("énergie");
    expect(titres[1]).not.toContain("alimentation");
  });

  it("ne parle d'écart que là où un écart de niveau est publié", async () => {
    const espion = espionner();
    const titres: string[] = [];
    await demarrer(espion.conteneur, {
      ...espion.options,
      titrer: (t) => titres.push(t),
    });

    expect(titres[0]).toContain("écart");

    for (const poste of ["energie", "produits_manufactures", "services"] as const) {
      espion.dernieresOptions!.onChangerPoste(poste);
      expect(titres[titres.length - 1]).not.toContain("écart");
      expect(titres[titres.length - 1]).toContain("évolution");
    }
  });
});
