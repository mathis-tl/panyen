/**
 * Page unique : réponse, panier, écart 2022, évolutions, carburants, récit.
 * Chaque chiffre passe par un Parquet ou par un calcul sur ce Parquet.
 */
import type { ContexteCharge, LigneEvenement, LigneNiveau, LigneRevenu } from "./chargement-contexte.ts";
import {
  barresMemeDate,
  ecartsAnnuels,
  etatEcart,
  eurosPourCentHexagone,
  formaterEcartEntier,
  formaterEurosPanier,
  exigerEstimationPoste,
  formaterPointsPct,
  libelleEstimation,
  phraseConclusion,
  phraseConstat,
  phraseEstimationsAnnuelles,
  phrasePicEstime,
  POSTES_PROLONGES,
  resoudreEmplacements,
  titreReponse,
} from "./calculs-ecran.ts";
import {
  calculerResume,
  formaterPct,
  prixDuPoste,
} from "./calculs.ts";
import {
  calculerResumeCarburants,
  listerCarburantsComparables,
} from "./calculs-carburants.ts";
import { creerPlanificateurRedessin } from "./planifier-redessin.ts";
import { creerRegistreNettoyage } from "./cycle-ecran.ts";
import { calculerDomaineEvolution, graphePetit } from "./graphe.ts";
import {
  calculerDispositionGrapheCarburants,
  grapheCarburants,
  texteInfobulleMois,
} from "./graphe-carburants.ts";
import { blocsRecit, formaterPublie, libelleRegistre } from "./recit.ts";
import type { LigneCarburant } from "./types-carburants.ts";
import { POSTES_ATTENDUS, type CodePoste, type LigneDifferentiel } from "./types.ts";
import { formaterMoisUtc } from "./validation.ts";
import { creerEntete } from "./entete.ts";

const registre = creerRegistreNettoyage();

const GLOSSAIRE = [
  {
    cle: "poste",
    terme: "Poste",
    definition: "une grande catégorie de dépense (alimentation, énergie, produits manufacturés, services…).",
  },
  {
    cle: "indice",
    terme: "Indice des prix",
    definition:
      "un nombre qui suit l'évolution des prix d'un territoire à partir d'un point de départ fixé à 100. Chaque territoire a son propre point de départ : on compare des hausses, jamais deux niveaux d'indice.",
  },
  {
    cle: "ecsp",
    terme: "Enquête de comparaison spatiale des prix (ECSP)",
    definition:
      "enquête de l'Insee qui relève, au même moment, les prix des mêmes produits dans deux territoires. Celle de mars-avril 2022 est la seule qui mesure l'écart de niveau.",
  },
  {
    cle: "mediane",
    terme: "Médiane",
    definition: "le prix qui sépare les stations en deux moitiés, une moitié moins chère, une moitié plus chère.",
  },
  {
    cle: "arrete",
    terme: "Arrêté préfectoral",
    definition: "décision du préfet qui fixe un prix maximal, valable dans tout le département.",
  },
  {
    cle: "mois",
    terme: "Dernier mois commun",
    definition: "le dernier mois pour lequel les deux territoires ont publié.",
  },
] as const;

const MOTS_GLOSE: { cle: string; motif: RegExp }[] = [
  { cle: "ecsp", motif: /enquête de comparaison spatiale des prix/i },
  { cle: "indice", motif: /indices? des prix/i },
  { cle: "arrete", motif: /arrêté préfectoral|arrêté/i },
  { cle: "mois", motif: /dernier mois commun/i },
  { cle: "mediane", motif: /médiane|médian/i },
  { cle: "poste", motif: /postes?/i },
];

const LIBELLES_NIVEAU: Record<string, string> = {
  ensemble: "Ensemble",
  alimentation: "Alimentation",
  communications: "Communications",
  meubles_entretien: "Meubles et entretien",
  alcool_tabac: "Alcool et tabac",
  sante: "Santé",
  logement: "Logement",
  transports: "Transports",
};

const PHRASE_SEULS_PROLONGES =
  "Seuls l'alimentation et l'ensemble sont prolongés après 2022 : ce sont les deux séries de prix que panyen suit chaque mois. Les autres postes restent la photo de 2022.";

const PHRASE_ESTIMATION =
  "Estimation : on prolonge la mesure de 2022 avec les hausses de prix de chaque territoire. Ce n'est pas une nouvelle enquête. Elle est moins sûre à mesure qu'on s'éloigne de 2022 : les habitudes d'achat changent, et l'Insee ne donne pas de marge d'erreur pour l'enquête de 2022.";

const PHRASE_CHAMP_ENSEMBLE =
  "L'indice des prix et l'enquête ne couvrent pas exactement les mêmes dépenses : l'enquête de 2022 laisse de côté le fioul, le gaz de ville et les transports ferroviaires, et des produits peu consommés d'un côté ou de l'autre.";

const LIBELLES_REVENU: Record<string, string> = {
  salaire_net_moyen_prive: "Salaire net moyen, privé",
  salaire_net_moyen_fonction_publique: "Salaire net moyen, fonction publique",
  revenu_salarial: "Revenu salarial",
  revenu_activite_non_salaries: "Revenu d'activité des non-salariés",
};

export interface DonneesPage extends ContexteCharge {
  ipc: LigneDifferentiel[];
  carburants: LigneCarburant[];
}

export function afficherPage(conteneur: HTMLElement, donnees: DonneesPage): void {
  registre.nettoyer();
  conteneur.innerHTML = "";
  const alimentation = exigerResumeAlimentaire(donnees.ipc);
  conteneur.append(
    defsHachure(),
    entete(),
    bandeau(),
    sectionReponse(alimentation),
    sectionNiveaux(donnees.niveaux),
    sectionEvolutions(donnees.ipc, donnees.evenements),
    sectionCarburants(donnees.carburants),
    sectionPourquoi(donnees.niveaux, donnees.revenus, donnees.ipc),
    sectionRecit(donnees),
    sectionMethode(alimentation),
    sectionConclusion(donnees.ipc, donnees.revenus),
    renvoiTechos(),
    pied(donnees.ipc, alimentation),
  );
  document.title = `Panye — ${alimentation.titre}`;
}

function exigerResumeAlimentaire(lignes: LigneDifferentiel[]) {
  const resume = calculerResume(lignes, "alimentation");
  if (
    resume.variationEcartPoints === null ||
    !resume.ancre ||
    resume.ancre.ecart_ecsp_2022_pct === null ||
    resume.actuelle.ecart_prix_estime_pct === null ||
    !resume.maximumEstime ||
    resume.maximumEstime.ecart_prix_estime_pct === null ||
    !resume.minimumEstime ||
    resume.minimumEstime.ecart_prix_estime_pct === null
  ) {
    throw new Error("La réponse alimentaire ne peut pas être calculée.");
  }
  const etat = etatEcart(resume.variationEcartPoints);
  const titre = titreReponse(etat, formaterEcartEntier(resume.actuelle.ecart_prix_estime_pct));
  return { resume, etat, titre };
}

function defsHachure(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "defs-hachure");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = `
    <defs>
      <pattern id="hachure-estime" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="6" stroke="var(--martinique)" stroke-width="1.5"></line>
      </pattern>
    </defs>`;
  return svg;
}

function entete(): HTMLElement {
  return creerEntete();
}

function intro(): HTMLElement {
  return paragraphe(
    "Panye compare les prix des courses en Martinique et dans l'Hexagone. En 2022, l'Insee a mesuré l'écart. Depuis, a-t-il changé ?",
    "intro",
  );
}

function bandeau(): HTMLElement {
  const bande = el("div", "bandeau");
  const video = document.createElement("video");
  video.className = "bandeau-video";
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.poster = "/media/martinique-poster.jpg";
  video.setAttribute("aria-hidden", "true");
  video.tabIndex = -1;
  const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduit) {
    video.autoplay = true;
    video.loop = true;
    const source = document.createElement("source");
    source.src = "/media/martinique.mp4";
    source.type = "video/mp4";
    video.append(source);
  }
  const voile = el("div", "bandeau-voile");
  voile.setAttribute("aria-hidden", "true");
  const texte = el("div", "bandeau-texte");
  texte.append(intro());
  bande.append(video, voile, texte);
  return bande;
}

function sectionReponse(
  alimentaire: ReturnType<typeof exigerResumeAlimentaire>,
): HTMLElement {
  const { resume, etat } = alimentaire;
  const ancre = resume.ancre;
  const actuelle = resume.actuelle;
  if (!ancre || ancre.ecart_ecsp_2022_pct === null || actuelle.ecart_prix_estime_pct === null) {
    throw new Error("Ancre alimentaire absente.");
  }
  if (!ancre.source_ecsp) throw new Error("Source ECSP absente pour l'ancre.");
  const section = el("section", "reponse-hero");
  section.id = "reponse";
  const texte = el("div", "reponse-texte");
  texte.append(
    el("h1", "titre-reponse", alimentaire.titre),
    paragraphe(libelleEstimation(resume.dernierMoisCommun), "ligne-estimation"),
  );
  if (etat === "stable") {
    if (!resume.maximumEstime || resume.maximumEstime.ecart_prix_estime_pct === null) {
      throw new Error("Pic estimé absent.");
    }
    texte.append(
      blocNote(
        "À retenir",
        phrasePicEstime(
          resume.maximumEstime.ecart_prix_estime_pct,
          formaterMoisUtc(resume.maximumEstime.periode),
          actuelle.ecart_prix_estime_pct,
          formaterMoisUtc(actuelle.periode),
        ),
      ),
    );
  }
  texte.append(
    blocNote(
      "Limite",
      "Seul l'écart de 2022 est mesuré. Les mois suivants sont estimés à partir des hausses de prix de chaque territoire.",
    ),
  );
  const lire = el("div", "lire-chiffres");
  lire.append(el("p", "etiquette-bloc", "Lire les chiffres"));
  const valeurs = {
    ecart_2022: `${formaterPct(ancre.ecart_ecsp_2022_pct)} %`,
    euros_2022: formaterEurosPanier(eurosPourCentHexagone(ancre.ecart_ecsp_2022_pct)),
  };
  lire.append(
    paragraphe(
      resoudreEmplacements(
        "+{ecart_2022} veut dire : un panier de courses qui coûte 100 € dans l'Hexagone coûte {euros_2022} en Martinique.",
        valeurs,
      ),
    ),
    paragraphe("Mesuré : relevé par l'Insee en mars-avril 2022."),
    paragraphe(
      "Estimé (hachuré) : prolongé par calcul à partir de cette mesure. Ce n'est pas un nouveau relevé.",
    ),
  );
  texte.append(lire);

  const barres = barresMemeDate(ancre, actuelle);
  const max = Math.max(...barres.map((b) => b.euros));
  const delta = barres[2].euros - barres[1].euros;
  const signeDelta = delta > 0 ? "+" : delta < 0 ? "−" : "";
  const deltaTexte = `${signeDelta}${formaterEurosPanier(Math.abs(delta))}`;
  const panier = el("div", "panier");
  panier.append(el("h2", "panier-titre", "Un même panier de courses : 100 € dans l'Hexagone"));
  const libelles: Record<string, string> = {
    hexagone: "Hexagone, à la même date",
    martinique_2022: "Martinique en 2022, mesuré",
    martinique_aujourdhui: resoudreEmplacements(
      "Martinique en {mois_fin}, estimé, {delta} depuis 2022",
      { mois_fin: resume.dernierMoisCommun, delta: deltaTexte },
    ),
  };
  for (const barre of barres) {
    panier.append(
      ligneBarre(
        libelles[barre.cle],
        "",
        barre.euros,
        barre.eurosPleins,
        barre.eurosHachures,
        max,
        barre.cle === "hexagone" ? "hexagone" : "martinique",
        barre.nature === "estimation",
        undefined,
        barre.cle === "martinique_aujourdhui",
      ),
    );
  }
  const sourcePanier = el("p", "source");
  const lienEcsp = document.createElement("a");
  lienEcsp.href = ancre.source_ecsp;
  lienEcsp.append(texteGlose("enquête de comparaison spatiale des prix"));
  sourcePanier.append(
    el("span", "etiquette-bloc", "D'où viennent les chiffres"),
    document.createTextNode(" Mesure : Insee, "),
    lienEcsp,
    texteGlose(", mars-avril 2022. Prolongement : indices des prix à la consommation, Insee."),
  );
  panier.append(sourcePanier);
  section.append(texte, panier);
  return section;
}

function sectionNiveaux(niveaux: LigneNiveau[]): HTMLElement {
  const section = creerSection(
    "ecart-2022",
    "En 2022, combien coûtait le même panier, par type de dépense ?",
  );
  const de2022 = niveaux.filter((n) => n.annee_enquete === 2022);
  if (de2022.length === 0) throw new Error("Aucun niveau ECSP pour 2022.");
  const alim = exigerNiveau(de2022, "alimentation");
  const transports = exigerNiveau(de2022, "transports");
  const horsEnsemble = de2022.filter((n) => n.poste !== "ensemble");
  const plusCher = horsEnsemble.reduce((a, b) =>
    a.ecart_fisher_pct >= b.ecart_fisher_pct ? a : b,
  );
  if (plusCher.poste !== "alimentation") {
    throw new Error("La phrase « poste le plus cher » ne correspond plus à l'alimentation.");
  }
  if (transports.ecart_fisher_pct >= 0) {
    throw new Error("La phrase « transports moins chers » ne correspond plus au chiffre.");
  }
  section.append(
    blocNote(
      "À retenir",
      resoudreEmplacements(
        "L'alimentation était le poste le plus cher par rapport à l'Hexagone ({alim_2022}) ; les transports étaient moins chers ({transports_2022}).",
        {
          alim_2022: formaterPublie(alim),
          transports_2022: formaterPublie(transports),
        },
      ),
    ),
    blocNote(
      "Comment lire",
      "Chaque barre rouge dit combien coûtait en Martinique ce qui coûtait 100 € dans l'Hexagone. La barre fine, en dessous, est ces 100 €. Plus courte : moins cher ; plus longue : plus cher. “Ensemble” regroupe tous les produits. Tout est mesuré.",
    ),
  );
  const ordre = [...de2022].sort((a, b) => {
    if (a.poste === "ensemble") return -1;
    if (b.poste === "ensemble") return 1;
    return b.ecart_fisher_pct - a.ecart_fisher_pct;
  });
  const euros = ordre.map((n) => eurosPourCentHexagone(n.ecart_fisher_pct));
  const max = Math.max(...euros, 100);
  const liste = el("div", "panier panier-postes");
  ordre.forEach((niveau, index) => {
    liste.append(
      ligneBarrePrix(
        libelleNiveau(niveau.poste),
        "2022, mesuré",
        euros[index],
        max,
        niveau.poste === "ensemble",
      ),
    );
  });
  section.append(liste);
  const source = ordre[0];
  section.append(
    sourceAvecLien(
      source.source_url,
      "Insee",
      "Mesuré. ",
      `, consulté le ${source.consulte_le}.`,
    ),
  );
  return section;
}

function sectionEvolutions(
  lignes: LigneDifferentiel[],
  evenements: LigneEvenement[],
): HTMLElement {
  const section = creerSection(
    "evolutions",
    "Depuis avril 2022, les prix ont-ils monté plus vite en Martinique ?",
  );
  section.append(
    blocNote(
      "Comment lire",
      "Chaque courbe montre de combien les prix ont augmenté depuis avril 2022 (0 % = les prix d'avril 2022), séparément pour chaque territoire. On compare des hausses, pas des niveaux de prix. Les points gris signalent des événements : ils coïncident avec les courbes, ils ne les expliquent pas forcément.",
    ),
  );
  const toutes = lignes.flatMap((l) => [
    l.evolution_martinique_pct,
    l.evolution_france_metropolitaine_pct,
  ]);
  const domaine = calculerDomaineEvolution(toutes);
  const amplitudes = POSTES_ATTENDUS.map((poste) => {
    const valeurs = lignes
      .filter((l) => l.poste === poste)
      .flatMap((l) => [l.evolution_martinique_pct, l.evolution_france_metropolitaine_pct]);
    return Math.max(...valeurs) - Math.min(...valeurs);
  });
  const plusGrande = Math.max(...amplitudes);
  const suivante = Math.max(...amplitudes.filter((a) => a !== plusGrande));
  if (suivante > 0 && plusGrande > suivante * 2) {
    section.append(
      paragraphe(
        "L'échelle est commune. Un poste s'écarte plus que les autres ; elle n'a pas été changée pour le faire tenir.",
        "note-echelle",
      ),
    );
  }
  const grille = el("div", "grille-postes");
  for (const poste of POSTES_ATTENDUS) {
    const duPoste = lignes.filter((l) => l.poste === poste);
    if (duPoste.length === 0) throw new Error(`Série absente : ${poste}.`);
    const carte = el("article", "carte-poste");
    const fin = duPoste[duPoste.length - 1];
    carte.append(
      el(
        "h3",
        "constat",
        phraseConstat(
          prixDuPoste(fin.poste),
          fin.differentiel_evolution_points,
          formaterPct(fin.evolution_martinique_pct),
          formaterPct(fin.evolution_france_metropolitaine_pct),
        ),
      ),
    );
    const cadre = el("div", "graphe-montage graphe-petit");
    cadre.append(
      el(
        "p",
        "sr-only",
        `${fin.libelle_poste}, évolution depuis avril 2022 : Martinique ${formaterPct(fin.evolution_martinique_pct)} %, Hexagone ${formaterPct(fin.evolution_france_metropolitaine_pct)} %.`,
      ),
    );
    const marqueurs = evenements
      .filter((ev) => concernePoste(ev, poste))
      .map((ev) => ({ date: ev.date_evenement, titre: ev.titre }));
    monterGraphe(cadre, () => graphePetit(duPoste, domaine, cadre.clientWidth, marqueurs));
    carte.append(cadre);
    if (poste === "energie") {
      carte.append(
        paragraphe(
          "Pour l'énergie, les règles de prix diffèrent entre les territoires (fiscalité, prix administrés). Une hausse plus faible ne veut pas dire que l'énergie y coûte moins cher.",
          "note-energie",
        ),
      );
    }
    grille.append(carte);
  }
  section.append(grille);
  section.append(
    paragraphe(
      "Point gris : un événement. Il situe la courbe, il ne l'explique pas.",
      "legende-points",
    ),
  );
  section.append(barresAnnuelles(lignes.filter((l) => l.poste === "alimentation")));
  if (evenements.length > 0) {
    section.append(
      paragraphe(
        "Quelques événements de la période, avec leur source. Ils situent les courbes, ils ne les expliquent pas.",
        "intro-evenements",
      ),
    );
    const liste = el("ul", "evenements");
    for (const ev of evenements) {
      const item = el("li", "evenement");
      const lien = document.createElement("a");
      lien.href = ev.url_source;
      lien.textContent = `${formaterMoisUtc(ev.date_evenement)} — ${ev.titre}`;
      item.append(lien);
      liste.append(item);
    }
    section.append(liste);
  }
  const collecte = derniereCollecte(lignes);
  section.append(
    paragraphe(
      `D'où viennent les chiffres. Mesuré : indices des prix à la consommation, Insee. Collecte du ${formaterJourUtc(collecte)}.`,
      "source",
    ),
  );
  return section;
}

function sectionCarburants(lignes: LigneCarburant[]): HTMLElement {
  const comparables = listerCarburantsComparables(lignes);
  const gazole = comparables.find((c) => c.toLowerCase() === "gazole");
  if (!gazole) throw new Error("Série gazole absente des carburants comparables.");
  const resume = calculerResumeCarburants(lignes, gazole);
  const section = creerSection("carburants", "Le gazole : qui fixe le prix ?");
  section.append(
    paragraphe(
      "Dans l'Hexagone, chaque station fixe son prix. En Martinique, le préfet fixe un prix maximal par arrêté, valable dans tout le département. Le gazole est le carburant que l'on peut comparer proprement.",
      "chapo",
    ),
    blocNote(
      "Comment lire",
      "On lit deux prix observés : la ligne bleue, les stations de l'Hexagone, et la ligne rouge, le prix maximal fixé en Martinique. Rien n'est hachuré. La légende sous le graphe nomme la bande claire et les petites barres.",
    ),
  );
  const dernier = resume.distributions[resume.distributions.length - 1];
  const plafond = resume.plafonds[resume.plafonds.length - 1];
  if (!dernier || !plafond) throw new Error("Prix du gazole absents pour le dernier mois.");
  section.append(
    blocNote(
      "À retenir",
      resoudreEmplacements(
        "En {mois_carburant}, le prix maximal fixé en Martinique est de {plafond} €/L ; la médiane des stations de l'Hexagone est de {mediane} €/L.",
        {
          mois_carburant: formaterMoisUtc(dernier.date),
          plafond: nombreLitre(plafond.prixMax),
          mediane: nombreLitre(dernier.mediane),
        },
      ),
    ),
  );
  const cadre = el("div", "graphe-montage graphe-carburants");
  cadre.append(
    el(
      "p",
      "sr-only",
      `En ${formaterMoisUtc(dernier.date)}, médiane des stations de l'Hexagone ${nombreLitre(dernier.mediane)} euros par litre, prix maximal fixé en Martinique ${nombreLitre(plafond.prixMax)} euros par litre.`,
    ),
  );
  section.append(cadre);
  monterGraphe(cadre, () =>
    grapheCarburants(resume, calculerDispositionGrapheCarburants(cadre.clientWidth)),
  );
  const clavier = el("div", "mois-clavier");
  clavier.setAttribute("role", "group");
  clavier.setAttribute("aria-label", "Mois du graphique, au clavier");
  for (const mois of resume.distributions) {
    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.className = "mois-focus";
    const texte = texteInfobulleMois({
      date: mois.date,
      mediane: mois.mediane,
      q10: mois.q10,
      q90: mois.q90,
    });
    bouton.setAttribute("aria-label", texte.replaceAll("\n", ", "));
    bouton.append(el("span", "infobulle", texte));
    clavier.append(bouton);
  }
  section.append(clavier, legendeGazole());
  if (resume.dernierMoisIncomplet) {
    section.append(
      paragraphe(
        `Le mois de ${formaterMoisUtc(resume.periodeFin)} n'est pas clos : les quantiles ne couvrent pas un mois entier.`,
        "note-incomplet",
      ),
    );
  }
  if (resume.produitsNonComparables.length > 0) {
    section.append(paragraphe("SP95, SP98 et E10 sont des qualités d'essence.", "glose-essence"));
    const liste = el("ul", "non-comparables");
    for (const produit of resume.produitsNonComparables) {
      liste.append(el("li", "", `${produit.libelleMq}. ${produit.raison}`));
    }
    section.append(el("h3", "sous-intertitre", "Non comparé"), liste);
  }
  return section;
}

function sectionPourquoi(
  niveaux: LigneNiveau[],
  revenus: LigneRevenu[],
  ipc: LigneDifferentiel[],
): HTMLElement {
  const section = creerSection(
    "pourquoi",
    "Ce qui coïncide avec le sentiment d'une vie plus chère",
  );
  section.append(
    paragraphe("Ces chiffres sont mesurés et ne démontrent pas de cause.", "chapo"),
  );
  const historique = el("div", "bloc-pourquoi");
  historique.append(
    el("h3", "sous-intertitre", "Combien plus cher qu'en Hexagone, enquête après enquête"),
    blocNote(
      "Comment lire",
      "Même lecture que plus haut : +40 % veut dire 140 € contre 100 €. La barre fine, en dessous, est 100 € dans l'Hexagone.",
    ),
  );
  for (const poste of POSTES_PROLONGES) {
    const lignes = niveaux
      .filter((n) => n.poste === poste)
      .sort((a, b) => a.annee_enquete - b.annee_enquete);
    if (lignes.length === 0) throw new Error(`Historique ECSP absent : ${poste}.`);
    const estimation = exigerEstimationPoste(ipc, poste);
    if (estimation.ecart_prix_estime_pct === null) {
      throw new Error(`Estimation absente ou non étiquetée : ${poste}.`);
    }
    const euros = lignes.map((n) => eurosPourCentHexagone(n.ecart_fisher_pct));
    const eurosEstime = eurosPourCentHexagone(estimation.ecart_prix_estime_pct);
    const max = Math.max(...euros, eurosEstime, 100);
    const bloc = el("div", "sous-bloc");
    bloc.append(el("p", "etiquette-bloc", libelleNiveau(poste)));
    lignes.forEach((ligne, index) => {
      bloc.append(
        ligneBarrePrix(
          String(ligne.annee_enquete),
          `mesuré, ${formaterPointsPct(ligne.ecart_fisher_pct)}`,
          euros[index],
          max,
        ),
      );
    });
    bloc.append(
      ligneBarrePrix(
        `${formaterMoisUtc(estimation.periode)}, estimé`,
        formaterPointsPct(estimation.ecart_prix_estime_pct),
        eurosEstime,
        max,
        false,
        true,
      ),
    );
    if (poste === "ensemble") {
      bloc.append(paragraphe(PHRASE_CHAMP_ENSEMBLE, "mention-champ"));
    }
    historique.append(bloc);
  }
  historique.append(
    paragraphe(PHRASE_SEULS_PROLONGES, "mention-prolongement"),
    paragraphe(PHRASE_ESTIMATION, "mention-estimation"),
  );
  const delicate = niveaux.find((n) => n.remarque.toLowerCase().includes("délicate"));
  if (!delicate) throw new Error("Mention de comparabilité 2010-2015 absente du Parquet.");
  historique.append(paragraphe(delicate.remarque, "mention"));
  section.append(historique);

  const prive = exigerRevenu(revenus, "salaire_net_moyen_prive");
  const public_ = exigerRevenu(revenus, "salaire_net_moyen_fonction_publique");
  if (public_.ecart_moyenne_nationale_pct <= 0 || prive.ecart_moyenne_nationale_pct >= 0) {
    throw new Error("Le sens des écarts de salaire ne correspond plus à la phrase affichée.");
  }
  const blocRevenus = el("div", "bloc-pourquoi");
  blocRevenus.append(
    el("h3", "sous-intertitre", "Les revenus en Martinique"),
    blocNote(
      "Comment lire",
      "Salaire net moyen : ce qu'un salarié touche en moyenne après cotisations. Revenu d'activité des non-salariés : indépendants, artisans, agriculteurs. Les barres vont à gauche si le revenu est plus bas que la moyenne nationale, à droite s'il est plus haut.",
    ),
    blocNote(
      "À retenir",
      resoudreEmplacements(
        "Les salaires de la fonction publique sont {rev_public} au-dessus de la moyenne nationale, ceux du privé {rev_prive} en dessous.",
        {
          rev_public: formaterPointsPct(public_.ecart_moyenne_nationale_pct),
          rev_prive: formaterPointsPct(prive.ecart_moyenne_nationale_pct),
        },
      ),
    ),
  );
  if (revenus.length === 0) throw new Error("Revenus absents.");
  const maxRevenu = Math.max(...revenus.map((r) => Math.abs(r.ecart_moyenne_nationale_pct)));
  for (const revenu of revenus) {
    blocRevenus.append(
      ligneBarreSignee(
        etiquetteRevenu(revenu.indicateur, revenu.annee),
        revenu.ecart_moyenne_nationale_pct,
        maxRevenu,
        formaterPointsPct(revenu.ecart_moyenne_nationale_pct),
      ),
    );
  }
  blocRevenus.append(paragraphe(revenus[0].champ, "mention"));
  blocRevenus.append(
    sourceAvecLien(
      revenus[0].source_url,
      "Insee",
      "Mesuré. ",
      `, consulté le ${revenus[0].consulte_le}.`,
    ),
  );
  section.append(blocRevenus);
  return section;
}

function sectionRecit(donnees: DonneesPage): HTMLElement {
  const section = creerSection("recit", "Ce qu'on peut en dire");
  section.classList.add("recit");
  section.append(
    paragraphe(
      "Mesuré : un chiffre publié par une source, ou calculé à partir de sources citées. Contexte : un fait extérieur aux chiffres, avec sa source. Analyse : notre interprétation. Elle peut être discutée et ne prouve rien.",
      "legende-registres",
    ),
  );
  const blocs = blocsRecit(donnees.ipc, donnees.niveaux, donnees.revenus, donnees.formules);
  let registreCourant = "";
  for (const bloc of blocs) {
    if (bloc.registre !== registreCourant) {
      registreCourant = bloc.registre;
      section.append(
        el("h3", `titre-registre titre-${bloc.registre}`, libelleRegistre(bloc.registre)),
      );
    }
    const article = el("article", `bloc-recit registre-${bloc.registre}`);
    const corps = el("p", "texte-recit");
    corps.append(texteGlose(bloc.texte));
    article.append(corps);
    if (bloc.sources.length > 0) {
      const sources = el("p", "sources-recit");
      for (const source of bloc.sources) {
        if (!source.href) throw new Error("Source de récit sans URL.");
        const lien = document.createElement("a");
        lien.href = source.href;
        lien.textContent = source.libelle;
        sources.append(lien);
      }
      article.append(sources);
    }
    section.append(article);
  }
  return section;
}

function sectionMethode(
  alimentaire: ReturnType<typeof exigerResumeAlimentaire>,
): HTMLElement {
  const section = creerSection("methode", "Méthode et sources");
  section.classList.add("methode");
  const ancre = alimentaire.resume.ancre;
  if (!ancre?.source_ecsp) throw new Error("Source ECSP absente pour la méthode.");

  section.append(el("h3", "sous-intertitre", "Ce que mesure ce site"));
  section.append(
    paragraphe(
      "Ce site compare le prix d'un même panier en Martinique et dans l'Hexagone. L'écart de niveau vient de l'enquête de comparaison spatiale des prix de mars-avril 2022. Les mois suivants prolongent cette mesure avec les hausses de prix de chaque territoire.",
    ),
  );
  section.append(el("h3", "sous-intertitre", "Ce qu'il ne dit pas"));
  section.append(
    paragraphe(
      "Il ne dit pas pourquoi les prix sont plus élevés ; il ne dit pas qui paie quoi ; il ne compare jamais deux indices entre eux.",
    ),
  );
  section.append(el("h3", "sous-intertitre", "Mesuré et estimé"));
  section.append(
    paragraphe(
      `Seul l'écart de 2022 est mesuré. Les mois suivants sont estimés. Le dernier mois affiché est le dernier mois commun : ${alimentaire.resume.dernierMoisCommun}. Les enquêtes de 2010, 2015 et 2022 ne sont pas strictement comparables. L'enquête de 2022 ne publie pas d'intervalle de confiance : le seuil de ±2 points qui sépare « creusé », « resserré » et « n'a presque pas bougé » est un choix éditorial, que rien ne mesure.`,
    ),
  );
  section.append(el("h3", "sous-intertitre", "Pourquoi une estimation n'est pas une mesure"));
  const limites = el("ul", "limites-estimation");
  for (const texte of [
    "Pas de marge d'erreur pour l'enquête de 2022.",
    "Les paniers de 2022 vieillissent.",
    "Pour l'ensemble, l'indice et l'enquête ne couvrent pas exactement les mêmes dépenses.",
    "L'ancre est arrondie à 0,1 point.",
    "Seuls l'alimentation et l'ensemble sont prolongés après 2022.",
    "Le seuil de ±2 points du titre ne vaut que pour l'alimentation.",
  ]) {
    limites.append(el("li", "", texte));
  }
  section.append(limites);
  section.append(el("h3", "sous-intertitre", "Les sources"));
  section.append(
    sourceAvecLien(
      ancre.source_ecsp,
      "Insee Première n° 1958",
      "",
      ", écart alimentaire de 2022.",
    ),
    sourceAvecLien(
      "https://www.insee.fr/fr/statistiques/7648939",
      "Insee Première n° 1958",
      "",
      ", écarts de 2010, 2015 et 2022.",
    ),
  );
  section.append(el("h3", "sous-intertitre", "Mots utilisés"));
  const liste = el("dl", "glossaire");
  for (const entree of GLOSSAIRE) {
    liste.append(el("dt", "", entree.terme), el("dd", "", entree.definition));
  }
  section.append(liste);
  return section;
}

function sectionConclusion(ipc: LigneDifferentiel[], revenus: LigneRevenu[]): HTMLElement {
  const alimentaire = exigerEstimationPoste(ipc, "alimentation");
  if (
    alimentaire.ecart_prix_estime_pct === null ||
    alimentaire.ecart_ecsp_2022_pct === null
  ) {
    throw new Error("Conclusion impossible : écart alimentaire absent.");
  }
  const prive = exigerRevenu(revenus, "salaire_net_moyen_prive");
  const section = el("section", "conclusion");
  section.append(
    el(
      "p",
      "conclusion-texte",
      phraseConclusion(
        alimentaire.ecart_prix_estime_pct,
        alimentaire.ecart_ecsp_2022_pct,
        prive.ecart_moyenne_nationale_pct,
      ),
    ),
  );
  return section;
}

function renvoiTechos(): HTMLElement {
  const section = el("section", "techos-renvoi");
  const lien = document.createElement("a");
  lien.className = "lien-techos";
  lien.href = "/techos.html";
  lien.textContent = "Pour les techos";
  section.append(
    lien,
    paragraphe("Comment le site est fait : les données, la page, le dessin."),
  );
  return section;
}

function pied(
  lignes: LigneDifferentiel[],
  alimentaire: ReturnType<typeof exigerResumeAlimentaire>,
): HTMLElement {
  const piedPage = el("footer", "pied");
  piedPage.append(
    paragraphe(
      "Sources : Insee (indices des prix à la consommation, enquête de comparaison spatiale des prix) et prix des carburants. Licence ouverte des sources.",
    ),
    paragraphe(
      resoudreEmplacements(
        "Dernier mois commun : {mois}. Dernière collecte : {collecte}.",
        {
          mois: alimentaire.resume.dernierMoisCommun,
          collecte: formaterJourUtc(derniereCollecte(lignes)),
        },
      ),
    ),
  );
  return piedPage;
}

function barresAnnuelles(lignes: LigneDifferentiel[]): HTMLElement {
  const annees = ecartsAnnuels(lignes);
  const bloc = el("div", "ecarts-annuels");
  bloc.append(
    el("h3", "sous-intertitre", "L'écart alimentaire, année après année"),
    blocNote(
      "Comment lire",
      "Chaque barre dit de combien le même panier alimentaire coûte plus cher en Martinique que dans l'Hexagone : 40 % veut dire 140 € contre 100 €. Plein : mesuré par l'Insee (2022). Hachuré : estimé par calcul.",
    ),
    legendeHachure(),
    blocNote("À retenir", phraseEstimationsAnnuelles(lignes)),
  );
  const max = Math.max(...annees.map((a) => Math.abs(a.ecartPct)));
  for (const annee of annees) {
    bloc.append(
      ligneBarre(
        String(annee.annee),
        annee.nature === "mesure" ? "mesuré" : "estimé",
        annee.ecartPct,
        annee.nature === "mesure" ? Math.abs(annee.ecartPct) : 0,
        annee.nature === "estimation" ? Math.abs(annee.ecartPct) : 0,
        max,
        "martinique",
        annee.nature === "estimation",
        formaterPointsPct(annee.ecartPct),
      ),
    );
  }
  bloc.append(
    blocNote(
      "Limite",
      "L'estimation suppose que l'écart de 2022 évolue comme l'écart entre les hausses de prix des deux territoires. Seule une nouvelle enquête pourrait la confirmer.",
    ),
  );
  return bloc;
}

function legendeHachure(): HTMLElement {
  const liste = el("ul", "legende-texture");
  const plein = el("li", "");
  plein.append(el("span", "clef-plein"), document.createTextNode(" Plein : mesuré"));
  const hachure = el("li", "");
  const clef = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  clef.setAttribute("class", "clef-hachure");
  clef.setAttribute("aria-hidden", "true");
  clef.innerHTML =
    `<rect width="100%" height="100%" fill="url(#hachure-estime)" stroke="var(--martinique)" stroke-width="1.5"></rect>`;
  hachure.append(clef, document.createTextNode(" Hachuré : estimé"));
  liste.append(plein, hachure);
  return liste;
}

function ligneBarrePrix(
  nom: string,
  sous: string,
  montant: number,
  max: number,
  forte = false,
  estime = false,
): HTMLElement {
  if (!Number.isFinite(montant) || montant < 0 || !Number.isFinite(max) || max <= 0) {
    throw new Error("Barre de prix impossible : montant ou échelle absente.");
  }
  const ligne = el(
    "div",
    `ligne-barre ligne-barre-prix couleur-martinique${forte ? " ligne-forte" : ""}`,
  );
  const textes = el("div", "ligne-etiquette");
  const nomNode = el("span", "ligne-barre-nom");
  nomNode.append(texteGlose(nom));
  textes.append(nomNode);
  if (sous) textes.append(el("span", "ligne-barre-sous", sous));
  const echelle = el("div", "echelle-prix");
  echelle.append(
    rangeePrix(montant / max, formaterEurosPanier(montant), "martinique", estime),
    rangeePrix(100 / max, "100 €", "hexagone"),
  );
  ligne.append(textes, echelle);
  return ligne;
}

function rangeePrix(
  part: number,
  etiquette: string,
  couleur: "martinique" | "hexagone",
  estime = false,
): HTMLElement {
  const partBornee = Math.min(1, Math.max(0, part));
  const rangee = el("div", `rangee-prix couleur-${couleur}`);
  const jauge = el("div", "jauge");
  jauge.style.width = `${partBornee * 100}%`;
  const piste = el("div", couleur === "hexagone" ? "piste piste-repere" : "piste");
  if (estime) piste.classList.add("piste-estimee");
  if (estime && couleur === "martinique") {
    const hachure = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    hachure.setAttribute("class", "segment segment-hachure");
    hachure.setAttribute("aria-hidden", "true");
    hachure.style.flexGrow = "1";
    hachure.innerHTML =
      `<rect width="100%" height="100%" fill="url(#hachure-estime)" stroke="var(--martinique)" stroke-width="1.5"></rect>`;
    piste.append(hachure);
  } else {
    const plein = el("span", "segment segment-plein");
    plein.style.flexGrow = "1";
    piste.append(plein);
  }
  const chiffre = el(
    "span",
    couleur === "hexagone" ? "chiffre chiffre-repere" : "chiffre",
    etiquette,
  );
  jauge.append(piste, chiffre);
  rangee.append(jauge);
  if (couleur === "hexagone") {
    rangee.setAttribute("role", "img");
    rangee.setAttribute("aria-label", "Hexagone, 100 €");
  }
  return rangee;
}

function legendeGazole(): HTMLElement {
  const liste = el("ul", "legende-gazole");
  const lignes: Array<[string, string]> = [
    ["echantillon-bande", "Bande claire : huit stations de l'Hexagone sur dix"],
    ["echantillon-barre", "Petites barres plus foncées : la moitié centrale des stations"],
    ["echantillon-mediane", "Ligne bleue : prix médian"],
    ["echantillon-plafond", "Ligne rouge, en escalier : prix maximal fixé en Martinique"],
  ];
  for (const [classe, texte] of lignes) {
    const item = el("li", "");
    item.append(el("span", `echantillon ${classe}`), document.createTextNode(texte));
    liste.append(item);
  }
  return liste;
}

function ligneBarre(
  nom: string,
  sous: string,
  montant: number,
  pleins: number,
  hachures: number,
  max: number,
  couleur: "hexagone" | "martinique" | "neutre",
  estime: boolean,
  etiquette?: string,
  forte = false,
): HTMLElement {
  const ligne = el("div", `ligne-barre couleur-${couleur}${forte ? " ligne-forte" : ""}`);
  const ticket = el("div", "ligne-ticket");
  const textes = el("div", "ligne-etiquette");
  const nomNode = el("span", "ligne-barre-nom");
  nomNode.append(texteGlose(nom));
  textes.append(nomNode);
  if (sous) {
    const detail = el("span", "ligne-barre-sous", sous);
    textes.append(detail);
  }
  ticket.append(textes, el("span", "ligne-points"), el("span", "chiffre", etiquette ?? formaterEurosPanier(montant)));
  const rail = el("div", "rail");
  const piste = el("div", `piste${estime ? " piste-estimee" : ""}`);
  const total = pleins + hachures;
  piste.style.width = max === 0 ? "0%" : `${(total / max) * 100}%`;
  if (pleins > 0 && total > 0) {
    const plein = el("span", "segment segment-plein");
    plein.style.flexGrow = String(pleins);
    piste.append(plein);
  }
  if (hachures > 0 && total > 0) {
    const hachure = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    hachure.setAttribute("class", "segment segment-hachure");
    hachure.setAttribute("aria-hidden", "true");
    hachure.style.flexGrow = String(hachures);
    hachure.innerHTML =
      `<rect width="100%" height="100%" fill="url(#hachure-estime)" stroke="var(--martinique)" stroke-width="1.5"></rect>`;
    piste.append(hachure);
  }
  rail.append(piste);
  ligne.append(ticket, rail);
  return ligne;
}

function ligneBarreSignee(nom: string, valeur: number, maxAbs: number, etiquette: string): HTMLElement {
  const ligne = el("div", "ligne-barre ligne-barre-signee couleur-neutre");
  const ticket = el("div", "ligne-ticket");
  const textes = el("div", "ligne-etiquette");
  textes.append(el("span", "ligne-barre-nom", nom), el("span", "ligne-barre-sous", "mesuré, par rapport à la moyenne de la France"));
  ticket.append(textes, el("span", "ligne-points"), el("span", "chiffre", etiquette));
  const piste = el("div", "piste-signee");
  piste.setAttribute("role", "img");
  piste.setAttribute("aria-label", `${nom} : ${etiquette} par rapport à la moyenne nationale`);
  const moitieNeg = el("span", "moitie moitie-neg");
  const moitiePos = el("span", "moitie moitie-pos");
  const part = maxAbs === 0 ? 0 : (Math.abs(valeur) / maxAbs) * 100;
  const barre = el("span", valeur < 0 ? "barre-signee barre-neg" : "barre-signee barre-pos");
  barre.style.width = `${part}%`;
  (valeur < 0 ? moitieNeg : moitiePos).append(barre);
  piste.append(moitieNeg, moitiePos);
  ligne.append(ticket, piste);
  return ligne;
}

function monterGraphe(
  cadre: HTMLElement,
  dessiner: () => SVGSVGElement | HTMLElement,
): void {
  let largeurPrecedente = 0;
  const redessiner = (): void => {
    const largeur = Math.floor(cadre.clientWidth);
    if (largeur <= 0 || largeur === largeurPrecedente) return;
    largeurPrecedente = largeur;
    const resume = cadre.querySelector(".sr-only");
    cadre.replaceChildren(dessiner());
    if (resume) cadre.prepend(resume);
  };
  const plan = creerPlanificateurRedessin(
    redessiner,
    (cb) => requestAnimationFrame(cb),
    (id) => cancelAnimationFrame(id),
  );
  const observateur = new ResizeObserver(() => plan.signaler());
  observateur.observe(cadre);
  plan.signaler();
  registre.enregistrer(() => {
    observateur.disconnect();
    plan.annuler();
  });
}

function concernePoste(ev: LigneEvenement, poste: CodePoste): boolean {
  return ev.postes_concernes.split("|").includes(poste);
}

function libelleNiveau(poste: string): string {
  const libelle = LIBELLES_NIVEAU[poste];
  if (!libelle) throw new Error(`Poste ECSP sans libellé : ${poste}.`);
  return libelle;
}

function libelleRevenu(indicateur: string): string {
  const libelle = LIBELLES_REVENU[indicateur];
  if (!libelle) throw new Error(`Indicateur de revenu sans libellé : ${indicateur}.`);
  return libelle;
}

export function etiquetteRevenu(indicateur: string, annee: number): string {
  return `${libelleRevenu(indicateur)} en Martinique, ${annee}`;
}

function exigerNiveau(niveaux: LigneNiveau[], poste: string): LigneNiveau {
  const ligne = niveaux.find((n) => n.poste === poste);
  if (!ligne) throw new Error(`Niveau ECSP 2022 absent : ${poste}.`);
  return ligne;
}

function exigerRevenu(revenus: LigneRevenu[], indicateur: string): LigneRevenu {
  const ligne = revenus.find((r) => r.indicateur === indicateur);
  if (!ligne) throw new Error(`Revenu absent : ${indicateur}.`);
  return ligne;
}

function derniereCollecte(lignes: LigneDifferentiel[]): Date {
  if (lignes.length === 0) throw new Error("Collecte absente : aucune ligne IPC.");
  return lignes.reduce(
    (max, ligne) => (ligne.collecte_utc > max ? ligne.collecte_utc : max),
    lignes[0].collecte_utc,
  );
}

function formaterJourUtc(date: Date): string {
  return `${date.getUTCDate()} ${formaterMoisUtc(date)}`;
}

function nombreLitre(valeur: number): string {
  if (!Number.isFinite(valeur)) throw new Error("Prix au litre absent.");
  return valeur.toFixed(2).replace(".", ",");
}

function creerSection(id: string, question: string): HTMLElement {
  const section = el("section", "ecran");
  section.id = id;
  const titre = el("h2", "intertitre");
  titre.append(texteGlose(question));
  section.append(titre);
  return section;
}

function blocNote(etiquette: string, texte: string): HTMLElement {
  const bloc = el("div", "bloc-note");
  bloc.append(el("p", "etiquette-bloc", etiquette));
  bloc.append(paragraphe(texte));
  return bloc;
}

function sourceAvecLien(href: string, ancre: string, avant: string, apres: string): HTMLElement {
  const p = el("p", "source");
  p.append(el("span", "etiquette-bloc", "D'où viennent les chiffres"), document.createTextNode(" "));
  if (avant) p.append(document.createTextNode(avant));
  const lien = document.createElement("a");
  lien.href = href;
  lien.textContent = ancre;
  p.append(lien);
  if (apres) p.append(texteGlose(apres));
  return p;
}

function paragraphe(texte: string, classe = ""): HTMLElement {
  const p = el("p", classe);
  p.append(texteGlose(texte));
  return p;
}

/** Espace insécable avant % et € : l'unité reste sur la même ligne que le nombre. */
function collerUnites(texte: string): string {
  return texte.replace(/ (?=[%€])/g, "\u00A0");
}

function texteGlose(texte: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  let reste = collerUnites(texte);
  while (reste.length > 0) {
    let meilleur: { index: number; longueur: number; cle: string; mot: string } | null = null;
    for (const candidat of MOTS_GLOSE) {
      const trouve = candidat.motif.exec(reste);
      if (!trouve || trouve.index === undefined) continue;
      const courant = {
        index: trouve.index,
        longueur: trouve[0].length,
        cle: candidat.cle,
        mot: trouve[0],
      };
      if (
        !meilleur ||
        courant.index < meilleur.index ||
        (courant.index === meilleur.index && courant.longueur > meilleur.longueur)
      ) {
        meilleur = courant;
      }
    }
    if (!meilleur) {
      fragment.append(document.createTextNode(reste));
      break;
    }
    if (meilleur.index > 0) {
      fragment.append(document.createTextNode(reste.slice(0, meilleur.index)));
    }
    const entree = GLOSSAIRE.find((item) => item.cle === meilleur.cle);
    if (!entree) throw new Error(`Glossaire incomplet : ${meilleur.cle}.`);
    const abbr = document.createElement("abbr");
    abbr.textContent = meilleur.mot;
    abbr.title = `${entree.terme} : ${entree.definition}`;
    fragment.append(abbr);
    reste = reste.slice(meilleur.index + meilleur.longueur);
  }
  return fragment;
}

function el(tag: string, classe: string, texte?: string): HTMLElement {
  const node = document.createElement(tag);
  if (classe) node.className = classe;
  if (texte !== undefined) node.textContent = collerUnites(texte);
  return node;
}
