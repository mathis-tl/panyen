import { beforeEach, describe, expect, it } from "vitest";
import type { LigneEvenement, LigneFormule, LigneNiveau, LigneRevenu } from "./chargement-contexte.ts";
import {
  exigerEstimationPoste,
  exigerMobilisation,
  paragraphesConclusion,
  POSTES_PROLONGES,
  type ChiffresConclusion,
} from "./calculs-ecran.ts";
import { calculerPanierIllustratif, formaterEuros } from "./calculs.ts";
import { afficherPage, etiquetteRevenu, type DonneesPage } from "./page.ts";
import { POSTES_PUBLIES, type CodePoste, type LigneDifferentiel } from "./types.ts";
import type { LigneCarburant } from "./types-carburants.ts";

class Noeud {
  fragment = false;
  id = "";
  className = "";
  title = "";
  href = "";
  alt = "";
  type = "";
  tabIndex = 0;
  muted = false;
  defaultMuted = false;
  playsInline = false;
  poster = "";
  autoplay = false;
  loop = false;
  clientWidth = 0;
  enfants: Noeud[] = [];
  attrs: Record<string, string> = {};
  style = { width: "", flexGrow: "" };
  private brut: string | null = null;

  classList = {
    add: (...noms: string[]) => {
      const deja = new Set(this.className.split(/\s+/).filter(Boolean));
      for (const nom of noms) deja.add(nom);
      this.className = [...deja].join(" ");
    },
  };

  get textContent(): string {
    if (this.brut !== null && this.enfants.length === 0) return this.brut;
    return this.enfants.map((enfant) => enfant.textContent).join("");
  }

  set textContent(valeur: string) {
    this.brut = valeur;
    this.enfants = [];
  }

  append(...noeuds: Array<Noeud | string>): void {
    if (this.brut !== null) {
      const texte = new Noeud();
      texte.textContent = this.brut;
      this.enfants.push(texte);
      this.brut = null;
    }
    for (const noeud of noeuds) {
      if (typeof noeud === "string") {
        const texte = new Noeud();
        texte.textContent = noeud;
        this.enfants.push(texte);
      } else if (noeud.fragment) {
        this.enfants.push(...noeud.enfants);
      } else {
        this.enfants.push(noeud);
      }
    }
  }

  setAttribute(cle: string, valeur: string): void {
    this.attrs[cle] = valeur;
    if (cle === "class") this.className = valeur;
  }

  set innerHTML(valeur: string) {
    this.enfants = [];
    this.brut = valeur.length > 0 ? valeur : null;
  }

  replaceChildren(...noeuds: Noeud[]): void {
    this.enfants = [];
    this.brut = null;
    this.append(...noeuds);
  }

  querySelector(): Noeud | null {
    return null;
  }
}

let application: Noeud;

function installerDom(): Noeud {
  application = new Noeud();
  application.id = "app";
  const documentSimule = {
    title: "",
    createElement: () => new Noeud(),
    createElementNS: () => new Noeud(),
    createTextNode: (texte: string) => {
      const noeud = new Noeud();
      noeud.textContent = texte;
      return noeud;
    },
    createDocumentFragment: () => {
      const noeud = new Noeud();
      noeud.fragment = true;
      return noeud;
    },
    querySelector: (selecteur: string) => (selecteur === "#app" ? application : null),
  };
  Object.assign(globalThis, {
    document: documentSimule,
    window: { matchMedia: () => ({ matches: true }) },
    ResizeObserver: class {
      observe(): void {}
      disconnect(): void {}
    },
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => {},
  });
  return new Noeud();
}

beforeEach(() => {
  installerDom();
});

function feuilles(noeud: Noeud): string[] {
  const sortie: string[] = [];
  if (noeud.title) sortie.push(noeud.title);
  if (noeud.alt) sortie.push(noeud.alt);
  for (const valeur of Object.values(noeud.attrs)) sortie.push(valeur);
  if (noeud.enfants.length === 0) {
    const texte = noeud.textContent;
    if (texte) sortie.push(texte);
    return sortie;
  }
  for (const enfant of noeud.enfants) sortie.push(...feuilles(enfant));
  return sortie;
}

function compterClasse(noeud: Noeud, classe: string): number {
  const ici = noeud.className.split(/\s+/).includes(classe) ? 1 : 0;
  return ici + noeud.enfants.reduce((total, enfant) => total + compterClasse(enfant, classe), 0);
}

function parId(noeud: Noeud, id: string): Noeud | null {
  if (noeud.id === id) return noeud;
  for (const enfant of noeud.enfants) {
    const trouve = parId(enfant, id);
    if (trouve) return trouve;
  }
  return null;
}

describe("estimation des deux postes", () => {
  it("refuse une barre estimée pour un autre poste", () => {
    expect([...POSTES_PROLONGES]).toEqual(["alimentation", "ensemble"]);
    expect(() => exigerEstimationPoste(lignesIpc(), "energie")).toThrow(/Aucune barre estimée/);
  });

  it("échoue si la ligne estimée manque ou n'est pas une estimation", () => {
    expect(() => exigerEstimationPoste([], "ensemble")).toThrow(/Série absente/);
    const lignes = lignesIpc().map((ligne) => ({ ...ligne }));
    const fin = lignes.filter((ligne) => ligne.poste === "ensemble").at(-1)!;
    fin.nature_ecart = "mesure_ecsp_2022";
    expect(() => exigerEstimationPoste(lignes, "ensemble")).toThrow(/non étiquetée/);
  });
});

describe("conclusion", () => {
  it("reste au-dessus de l'ancre, écarte le salaire nul, et ne juge pas les mesures", () => {
    const auDessus = texteConclusion(paragraphesConclusion(chiffresConclusion()));
    expect(auDessus).toContain("Il n'est pas passé sous la mesure de 2022.");
    expect(auDessus).toContain("Les salaires du privé en Martinique sont de 8,0 % sous la moyenne nationale.");
    expect(auDessus).toContain("davantage monté dans l'Hexagone");
    expect(auDessus).toContain("Ils n'ont pas baissé en Martinique.");
    expect(auDessus).toContain("Notre analyse");
    expect(auDessus).toContain("Illustration arithmétique, pas une mesure.");
    expect(auDessus).toContain("ne prouve ni qu'elles ont fonctionné, ni qu'elles ont échoué");
    expect(auDessus).not.toMatch(/métropol/i);
    expect(auDessus).not.toMatch(/largement/i);
    expect(auDessus).not.toMatch(/moins chère/i);
    expect(auDessus).not.toMatch(/de plus en plus/i);

    const enDessous = texteConclusion(
      paragraphesConclusion(chiffresConclusion({ ecartAlimFin: 39, evoAlimMq: 18, evoAlimFm: 20 })),
    );
    expect(enDessous).toContain("Il est passé sous la mesure de 2022.");
    expect(enDessous).not.toContain("n'est pas passé sous");

    const sansSalaire = texteConclusion(paragraphesConclusion(chiffresConclusion({ salairePrivePct: 0 })));
    expect(sansSalaire).not.toContain("salaires du privé");
  });

  it("dit que l'ensemble se creuse quand la Martinique a davantage monté", () => {
    const texte = texteConclusion(
      paragraphesConclusion(
        chiffresConclusion({ evoEnsMq: 12, evoEnsFm: 9, ecartEnsFin: 15, ecartEns2022: 13.8 }),
      ),
    );
    expect(texte).toContain("davantage monté en Martinique");
    expect(texte).not.toContain("davantage monté dans l'Hexagone");
  });

  it("dit que l'écart ensemble ne bouge pas quand les évolutions sont égales", () => {
    const texte = texteConclusion(
      paragraphesConclusion(
        chiffresConclusion({ evoEnsMq: 10, evoEnsFm: 10, ecartEnsFin: 13.8, ecartEns2022: 13.8 }),
      ),
    );
    expect(texte).toContain("les deux évolutions sont égales");
  });

  it("retire « des deux côtés » si une évolution de l'ensemble n'est pas une hausse", () => {
    const texte = texteConclusion(
      paragraphesConclusion(
        chiffresConclusion({ evoEnsMq: -1, evoEnsFm: 2, ecartEnsFin: 12, ecartEns2022: 13.8 }),
      ),
    );
    expect(texte).not.toContain("des deux côtés");
    expect(texte).not.toContain("monté");
    expect(texte).toContain("-1,0 %");
    expect(texte).toContain("2,0 %");
  });

  it("échoue si le sens de l'écart contredit les évolutions", () => {
    expect(() =>
      paragraphesConclusion(
        chiffresConclusion({ evoEnsMq: 10, evoEnsFm: 12.7, ecartEnsFin: 15, ecartEns2022: 13.8 }),
      ),
    ).toThrow(/contredit/);
  });

  it("échoue si un chiffre manque", () => {
    expect(() => paragraphesConclusion(chiffresConclusion({ ecartAlimFin: Number.NaN }))).toThrow(
      /absent/,
    );
  });

  it("calcule les euros avec le panier illustratif", () => {
    const ancre = lignesIpc().find(
      (ligne) => ligne.poste === "alimentation" && ligne.nature_ecart === "mesure_ecsp_2022",
    )!;
    const fin = lignesIpc()
      .filter((ligne) => ligne.poste === "alimentation")
      .at(-1)!;
    const depart = calculerPanierIllustratif(ancre);
    const actuel = calculerPanierIllustratif(fin);
    const texte = texteConclusion(
      paragraphesConclusion(
        chiffresConclusion({
          eurosMq2022: depart.martinique,
          eurosFm2022: depart.metropole,
          eurosFmFin: actuel.metropole,
          eurosMqFin: actuel.martinique,
        }),
      ),
    );
    expect(texte).toContain(formaterEuros(depart.martinique));
    expect(texte).toContain(formaterEuros(actuel.metropole));
    expect(texte).toContain(formaterEuros(actuel.martinique));
    expect(texte).toContain(
      formaterEuros(actuel.martinique - actuel.metropole),
    );
  });
});

describe("mobilisation", () => {
  it("retient seulement le 1er septembre 2024", () => {
    const trouve = exigerMobilisation([evenementMobilisation()]);
    expect(trouve.mois).toBe("septembre 2024");
    expect(trouve.url).toBe("https://exemple.test/mobilisation");
  });

  it("échoue si la mobilisation manque ou si octobre est la seule ligne", () => {
    expect(() => exigerMobilisation([])).toThrow(/Mobilisation/);
    expect(() =>
      exigerMobilisation([
        {
          ...evenementMobilisation(),
          date_evenement: new Date(Date.UTC(2024, 9, 10)),
          titre: "Nuit d'émeutes",
        },
      ]),
    ).toThrow(/Mobilisation/);
  });
});

describe("libellés des revenus", () => {
  it("nomme les quatre indicateurs en Martinique avec leur année", () => {
    expect(etiquetteRevenu("salaire_net_moyen_prive", 2024)).toBe(
      "Salaire net moyen, privé en Martinique, 2024",
    );
    expect(etiquetteRevenu("salaire_net_moyen_fonction_publique", 2024)).toBe(
      "Salaire net moyen, fonction publique en Martinique, 2024",
    );
    expect(etiquetteRevenu("revenu_salarial", 2023)).toBe(
      "Revenu salarial en Martinique, 2023",
    );
    expect(etiquetteRevenu("revenu_activite_non_salaries", 2022)).toBe(
      "Revenu d'activité des non-salariés en Martinique, 2022",
    );
  });
});

describe("page affichée", () => {
  it("ne contient pas « métropol » et montre les barres estimées, les mentions et la conclusion", () => {
    const racine = new Noeud();
    afficherPage(racine as unknown as HTMLElement, donneesPage());
    const visible = [document.title, ...feuilles(racine)].join("\n");
    expect(visible).not.toMatch(/métropol/i);
    expect(visible).not.toContain("Hexagone : la France");
    expect(visible).toContain("Seuls l'alimentation et l'ensemble sont prolongés après 2022");
    expect(visible).toContain("Estimation : on prolonge la mesure de 2022");
    expect(visible).toContain("le fioul, le gaz de ville et les transports ferroviaires");
    expect(visible).toContain("Pourquoi une estimation n'est pas une mesure");
    expect(visible).toContain("par rapport à la moyenne de la France");
    expect(visible).toContain("Salaire net moyen, privé en Martinique, 2024");
    expect(visible).toContain("Île-de-France");
    expect(visible).toContain("août 2026, estimé");
    expect(visible).toContain("Il n'est pas passé sous la mesure de 2022.");
    expect(visible).toContain("Notre analyse");
    expect(visible).toContain("Illustration arithmétique, pas une mesure.");
    expect(visible).toContain("septembre 2024");
    expect(visible).toContain("Les salaires du privé en Martinique sont de 8,0 % sous la moyenne nationale.");
    expect(hrefs(racine)).toContain("https://exemple.test/mobilisation");

    const pourquoi = parId(racine, "pourquoi");
    expect(pourquoi).not.toBeNull();
    expect(compterClasse(pourquoi!, "segment-hachure")).toBe(2);

    const classes = racine.enfants.map((enfant) => enfant.id || enfant.className);
    expect(classes.indexOf("methode")).toBeLessThan(classes.indexOf("conclusion"));
    expect(classes.indexOf("conclusion")).toBeLessThan(classes.indexOf("techos-renvoi"));
  });

  it("échoue bruyamment si l'estimation ensemble n'est pas étiquetée", () => {
    const ipc = lignesIpc().map((ligne) => ({ ...ligne }));
    const fin = ipc.filter((ligne) => ligne.poste === "ensemble").at(-1)!;
    fin.nature_ecart = null;
    fin.ecart_prix_estime_pct = null;
    expect(() => afficherPage(new Noeud() as unknown as HTMLElement, donneesPage(ipc))).toThrow(
      /Estimation absente ou non étiquetée/,
    );
  });
});

describe("page techos", () => {
  it("n'affiche pas « métropol »", async () => {
    installerDom();
    const { PARAGRAPHES_TECHOS } = await import("./techos.ts");
    const visible = PARAGRAPHES_TECHOS.flatMap((bloc) => [bloc.titre, ...bloc.textes]).join("\n");
    expect(visible).not.toMatch(/métropol/i);
    expect(visible).toContain("France hexagonale");
    expect(application.textContent).not.toMatch(/métropol/i);
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

function chiffresConclusion(partiel: Partial<ChiffresConclusion> = {}): ChiffresConclusion {
  return {
    evoAlimMq: 19.6,
    evoAlimFm: 19.4,
    ecartAlimFin: 40.35,
    ancreAlim: 40.2,
    eurosMq2022: 140.2,
    eurosFm2022: 100,
    eurosFmFin: 119.4,
    eurosMqFin: 167.44,
    evoEnsMq: 10,
    evoEnsFm: 12.7,
    ecartEns2022: 13.8,
    ecartEnsFin: 11.1,
    salairePrivePct: -8,
    moisMobilisation: "septembre 2024",
    ...partiel,
  };
}

function texteConclusion(conclusion: ReturnType<typeof paragraphesConclusion>): string {
  return [
    conclusion.alimentation,
    conclusion.illustration,
    conclusion.ensemble,
    conclusion.analyseAvantLien,
    conclusion.libelleLien,
    conclusion.analyseApresLien,
  ].join(" ");
}

function evenementMobilisation(): LigneEvenement {
  return {
    date_evenement: new Date(Date.UTC(2024, 8, 1)),
    precision_date: "mois",
    titre: "Début de la mobilisation publique contre la vie chère",
    type_evenement: "mobilisation",
    postes_concernes: "alimentation",
    url_source: "https://exemple.test/mobilisation",
    type_source: "etude",
    consulte_le: "2026-09-29",
  };
}

function hrefs(noeud: Noeud): string[] {
  const sortie = noeud.href ? [noeud.href] : [];
  for (const enfant of noeud.enfants) sortie.push(...hrefs(enfant));
  return sortie;
}

function lignesIpc(): LigneDifferentiel[] {
  const dates = moisCouverts();
  const fin = dates[dates.length - 1];
  return POSTES_PUBLIES.flatMap((poste) =>
    dates.map((periode, index) => {
      const ancre = poste === "alimentation" || poste === "ensemble";
      const depart = poste === "ensemble" ? 13.8 : 40.2;
      const actuel = poste === "ensemble" ? 11.13 : 40.35;
      return {
        periode,
        dernier_mois_commun: fin,
        poste,
        libelle_poste: libelle(poste),
        fichier_source: "data/raw/insee/ipc_postes.xml",
        collecte_utc: new Date(Date.UTC(2026, 9, 6)),
        idbank_martinique: poste === "ensemble" ? "011814618" : "011813726",
        idbank_france_metropolitaine: poste === "ensemble" ? "011814612" : "011813720",
        facteur_martinique: index === dates.length - 1 && poste === "alimentation" ? 1.196 : 1,
        facteur_france_metropolitaine: index === dates.length - 1 && poste === "alimentation" ? 1.194 : 1,
        evolution_martinique_pct:
          index === dates.length - 1 && poste === "ensemble"
            ? 10
            : index === dates.length - 1 && poste === "alimentation"
              ? 19.6
              : 1,
        evolution_france_metropolitaine_pct:
          index === dates.length - 1 && poste === "ensemble"
            ? 12.7
            : index === dates.length - 1 && poste === "alimentation"
              ? 19.4
              : 1,
        differentiel_evolution_points: 0,
        coefficient_ecart: 1,
        ancre_ecsp_disponible: ancre,
        ecart_ecsp_2022_pct: ancre ? depart : null,
        ecart_prix_estime_pct: ancre ? (index === 0 ? depart : actuel) : null,
        source_ecsp: ancre ? "https://www.insee.fr/fr/statistiques/7648939" : null,
        nature_ecart: ancre
          ? index === 0
            ? "mesure_ecsp_2022"
            : "estimation_a_partir_ecsp_2022"
          : null,
      } satisfies LigneDifferentiel;
    }),
  );
}

function libelle(poste: CodePoste): string {
  if (poste === "alimentation") return "Alimentation";
  if (poste === "energie") return "Énergie";
  if (poste === "produits_manufactures") return "Produits manufacturés";
  if (poste === "ensemble") return "Ensemble";
  return "Services";
}

function donneesPage(ipc = lignesIpc()): DonneesPage {
  return {
    ipc,
    carburants: carburants(),
    niveaux: niveaux(),
    formules: formules(),
    revenus: revenus(),
    evenements: [evenementMobilisation()],
  };
}

function niveaux(): LigneNiveau[] {
  const remarque = "Comparaison 2010-2015 délicate.";
  const lignes: Array<[number, string, number]> = [
    [2010, "alimentation", 38],
    [2015, "alimentation", 39],
    [2022, "alimentation", 40.2],
    [2010, "ensemble", 12],
    [2015, "ensemble", 12.5],
    [2022, "ensemble", 13.8],
    [2022, "transports", -8],
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

function formules(): LigneFormule[] {
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

function revenus(): LigneRevenu[] {
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

function carburants(): LigneCarburant[] {
  const distribution = (annee: number, mois: number): LigneCarburant => ({
    type_ligne: "distribution_metropole",
    carburant: "Gazole",
    libelle_carburant: "Gazole",
    date_reference: new Date(Date.UTC(annee, mois - 1, 1)),
    mois_complet: true,
    q10_eur_litre: 1.5,
    q25_eur_litre: 1.6,
    mediane_eur_litre: 1.7,
    q75_eur_litre: 1.8,
    q90_eur_litre: 1.9,
    nombre_stations: 1000,
    prix_max_mq_eur_litre: null,
    fin_effet_exclusive: null,
    reference_acte: null,
    url_source_primaire: null,
    collecte_utc_nationale: new Date(Date.UTC(2026, 8, 1)),
  });
  return [
    distribution(2026, 7),
    distribution(2026, 8),
    {
      type_ligne: "plafond_martinique",
      carburant: "Gazole",
      libelle_carburant: "Gazole",
      date_reference: new Date(Date.UTC(2026, 7, 1)),
      mois_complet: null,
      q10_eur_litre: null,
      q25_eur_litre: null,
      mediane_eur_litre: null,
      q75_eur_litre: null,
      q90_eur_litre: null,
      nombre_stations: null,
      prix_max_mq_eur_litre: 1.65,
      fin_effet_exclusive: null,
      reference_acte: "arrêté préfectoral",
      url_source_primaire: "https://www.martinique.gouv.fr/",
      collecte_utc_nationale: null,
    },
  ];
}
