/**
 * Page unique : réponse, panier, écart 2022, évolutions, carburants, récit.
 */
import type { ContexteCharge, LigneEvenement, LigneNiveau, LigneRevenu } from "./chargement-contexte.ts";
import {
  barresMemeDate,
  ecartsAnnuels,
  etatEcart,
  eurosPourCentHexagone,
  formaterEurosPanier,
  formaterPointsPct,
  libelleEstimation,
  phrasePicEstime,
  titreReponse,
} from "./calculs-ecran.ts";
import {
  calculerResume,
  formaterPct,
  prixDuPoste,
  selectionnerJalons,
} from "./calculs.ts";
import {
  calculerResumeCarburants,
  formaterEurosLitre,
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
import { blocsRecit } from "./recit.ts";
import type { LigneCarburant } from "./types-carburants.ts";
import { POSTES_ATTENDUS, type CodePoste, type LigneDifferentiel } from "./types.ts";
import { formaterMoisUtc } from "./validation.ts";

const registre = creerRegistreNettoyage();

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
  conteneur.append(
    defsHachure(),
    entete(),
    sectionReponse(donnees.ipc),
    sectionNiveaux(donnees.niveaux),
    sectionEvolutions(donnees.ipc, donnees.evenements),
    sectionCarburants(donnees.carburants),
    sectionPourquoi(donnees.niveaux, donnees.revenus),
    sectionRecit(donnees),
    sectionMethode(donnees.ipc),
  );
  const alimentation = calculerResume(donnees.ipc, "alimentation");
  const variation = alimentation.variationEcartPoints;
  if (variation === null) throw new Error("Variation d'écart alimentaire absente.");
  document.title = `panyen — ${titreReponse(etatEcart(variation))}`;
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
  const header = el("header", "entete");
  const nom = el("a", "nom", "panyen");
  nom.setAttribute("href", "#reponse");
  const nav = el("nav", "nav-ecrans");
  nav.setAttribute("aria-label", "Sections");
  for (const [href, libelle] of [
    ["#reponse", "Réponse"],
    ["#ecart-2022", "Écart 2022"],
    ["#evolutions", "Évolutions"],
    ["#carburants", "Carburants"],
    ["#pourquoi", "Pourquoi"],
    ["#recit", "Récit"],
    ["#methode", "Méthode"],
  ] as const) {
    const lien = el("a", "nav-lien", libelle);
    lien.setAttribute("href", href);
    if (libelle !== "Méthode") lien.classList.add("nav-secondaire");
    nav.append(lien);
  }
  const bouton = document.createElement("button");
  bouton.type = "button";
  bouton.className = "bascule-theme";
  bouton.textContent = "Thème";
  const rafraichir = (): void => {
    const sombre = themeCourant() === "dark";
    bouton.setAttribute("aria-pressed", sombre ? "true" : "false");
    bouton.setAttribute("aria-label", sombre ? "Passer au thème clair" : "Passer au thème sombre");
  };
  bouton.addEventListener("click", () => {
    document.documentElement.dataset.theme = themeCourant() === "dark" ? "light" : "dark";
    rafraichir();
  });
  rafraichir();
  header.append(nom, nav, bouton);
  return header;
}

function sectionReponse(lignes: LigneDifferentiel[]): HTMLElement {
  const resume = calculerResume(lignes, "alimentation");
  if (
    resume.variationEcartPoints === null ||
    !resume.ancre ||
    resume.ancre.ecart_ecsp_2022_pct === null ||
    resume.actuelle.ecart_prix_estime_pct === null ||
    !resume.maximumEstime ||
    resume.maximumEstime.ecart_prix_estime_pct === null
  ) {
    throw new Error("La réponse alimentaire ne peut pas être calculée.");
  }
  const etat = etatEcart(resume.variationEcartPoints);
  const section = el("section", "reponse-hero");
  section.id = "reponse";
  const texte = el("div", "reponse-texte");
  const titre = el("h1", "titre-reponse", titreReponse(etat));
  const estimation = el("p", "ligne-estimation", libelleEstimation(resume.dernierMoisCommun));
  texte.append(titre, estimation);
  if (etat === "stable") {
    texte.append(
      el(
        "p",
        "phrase-pic",
        phrasePicEstime(
          resume.maximumEstime.ecart_prix_estime_pct,
          formaterMoisUtc(resume.maximumEstime.periode),
          resume.actuelle.ecart_prix_estime_pct,
          formaterMoisUtc(resume.actuelle.periode),
        ),
      ),
    );
  }
  texte.append(
    el(
      "p",
      "limite-courte",
      "Seul l'écart de 2022 est mesuré. La suite est calculée à partir des évolutions de chaque territoire.",
    ),
    lienBas("#methode", "Comment on le sait"),
  );
  const barres = barresMemeDate(resume.ancre, resume.actuelle);
  const max = Math.max(...barres.map((b) => b.euros));
  const panier = el("div", "panier");
  panier.append(
    el("h2", "panier-titre", "Pour 100 € dans l'Hexagone à la même date"),
  );
  const libelles: Record<string, [string, string]> = {
    hexagone: ["Hexagone", "à la même date"],
    martinique_2022: ["Martinique", "2022 mesuré"],
    martinique_aujourdhui: ["Martinique", `${resume.dernierMoisCommun} estimé`],
  };
  const delta = barres[2].euros - barres[1].euros;
  const signeDelta = delta > 0 ? "+" : delta < 0 ? "−" : "";
  libelles.martinique_aujourdhui[1] =
    `${resume.dernierMoisCommun} estimé, ${signeDelta}${formaterEurosPanier(Math.abs(delta))} depuis la mesure`;
  for (const barre of barres) {
    const [nom, sous] = libelles[barre.cle];
    panier.append(ligneBarre(nom, sous, barre.euros, barre.eurosPleins, barre.eurosHachures, max, barre.cle === "hexagone" ? "hexagone" : "martinique", barre.nature === "estimation"));
  }
  const notes = el("p", "renvois");
  notes.append(
    exposant("1"),
    document.createTextNode(" Insee, enquête de comparaison spatiale, mars-avril 2022. "),
    exposant("2"),
    document.createTextNode(" Prolongé par les indices des prix à la consommation, Insee."),
  );
  panier.append(notes);
  section.append(texte, panier);
  return section;
}

function sectionNiveaux(niveaux: LigneNiveau[]): HTMLElement {
  const section = el("section", "ecran");
  section.id = "ecart-2022";
  section.append(
    el("h2", "intertitre", "En 2022, l'écart mesuré"),
    el(
      "p",
      "chapo",
      "Chaque barre dit combien coûtait en Martinique ce qui coûtait 100 € dans l'Hexagone. Tout est mesuré, donc tout est plein.",
    ),
  );
  const de2022 = niveaux.filter((n) => n.annee_enquete === 2022);
  if (de2022.length === 0) throw new Error("Aucun niveau ECSP pour 2022.");
  const ordre = [...de2022].sort((a, b) => {
    if (a.poste === "ensemble") return -1;
    if (b.poste === "ensemble") return 1;
    return b.ecart_fisher_pct - a.ecart_fisher_pct;
  });
  const euros = ordre.map((n) => eurosPourCentHexagone(n.ecart_fisher_pct));
  const max = Math.max(...euros, 100);
  const liste = el("div", "panier panier-postes");
  ordre.forEach((niveau, index) => {
    const montant = euros[index];
    liste.append(
      ligneBarre(
        libelleNiveau(niveau.poste),
        "2022 mesuré",
        montant,
        montant,
        0,
        max,
        "martinique",
        false,
      ),
    );
  });
  section.append(liste);
  const source = ordre[0];
  section.append(sourceLigne(source.source_url, `Insee, consulté le ${source.consulte_le}`));
  return section;
}

function sectionEvolutions(
  lignes: LigneDifferentiel[],
  evenements: LigneEvenement[],
): HTMLElement {
  const section = el("section", "ecran");
  section.id = "evolutions";
  section.append(
    el("h2", "intertitre", "Depuis 2022, les prix de chaque poste"),
    el(
      "p",
      "chapo",
      "Chaque courbe part de 100 en avril 2022 sur son propre territoire. Ce sont des évolutions, pas des niveaux d'indice comparés.",
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
      el(
        "p",
        "note-echelle",
        "L'échelle est commune. Un poste s'écarte plus que les autres ; elle n'a pas été changée pour le faire tenir.",
      ),
    );
  }
  const grille = el("div", "grille-postes");
  for (const poste of POSTES_ATTENDUS) {
    const duPoste = lignes.filter((l) => l.poste === poste);
    if (duPoste.length === 0) throw new Error(`Série absente : ${poste}.`);
    const carte = el("article", "carte-poste");
    const fin = duPoste[duPoste.length - 1];
    carte.append(el("h3", "constat", constat(fin)));
    const cadre = el("div", "graphe-montage graphe-petit");
    const resumeTexte = el(
      "p",
      "sr-only",
      `${fin.libelle_poste}, évolution depuis avril 2022 : Martinique ${formaterPct(fin.evolution_martinique_pct)} %, Hexagone ${formaterPct(fin.evolution_france_metropolitaine_pct)} %.`,
    );
    carte.append(resumeTexte, cadre);
    const marqueurs = evenements
      .filter((ev) => concernePoste(ev, poste))
      .map((ev) => ({ date: ev.date_evenement, titre: ev.titre }));
    monterGraphe(cadre, () => graphePetit(duPoste, domaine, cadre.clientWidth, marqueurs));
    grille.append(carte);
  }
  section.append(grille);
  section.append(barresAnnuelles(lignes.filter((l) => l.poste === "alimentation")));
  const liste = el("ul", "evenements");
  for (const ev of evenements) {
    const item = el("li", "evenement");
    const lien = document.createElement("a");
    lien.href = ev.url_source;
    lien.textContent = `${formaterMoisUtc(ev.date_evenement)} — ${ev.titre}`;
    item.append(lien, el("span", "badge-registre", "Contexte"));
    liste.append(item);
  }
  if (liste.childElementCount > 0) section.append(liste);
  return section;
}

function sectionCarburants(lignes: LigneCarburant[]): HTMLElement {
  const comparables = listerCarburantsComparables(lignes);
  const gazole = comparables.find((c) => c.toLowerCase() === "gazole");
  if (!gazole) throw new Error("Série gazole absente des carburants comparables.");
  const resume = calculerResumeCarburants(lignes, gazole);
  const section = el("section", "ecran");
  section.id = "carburants";
  section.append(
    el("h2", "intertitre", "Le gazole, deux manières de fixer le prix"),
    el(
      "p",
      "chapo",
      "En ambre, la moitié centrale et la médiane des stations de l'Hexagone. En bleu, le prix maximal fixé par arrêté préfectoral en Martinique. Les deux sont observés : rien n'est hachuré. Le pointillé marque avril 2022.",
    ),
  );
  const cadre = el("div", "graphe-montage graphe-carburants");
  const dernier = resume.distributions[resume.distributions.length - 1];
  const plafond = resume.plafonds[resume.plafonds.length - 1];
  cadre.append(
    el(
      "p",
      "sr-only",
      `Dernier mois, médiane hexagone ${formaterEurosLitre(dernier.mediane)}, prix maximal martiniquais ${formaterEurosLitre(plafond.prixMax)}.`,
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
    const bulle = el("span", "infobulle", texte);
    bouton.append(bulle);
    clavier.append(bouton);
  }
  section.append(clavier);
  if (resume.dernierMoisIncomplet) {
    section.append(
      el(
        "p",
        "note-incomplet",
        `Le mois de ${formaterMoisUtc(resume.periodeFin)} n'est pas clos : les quantiles ne couvrent pas un mois entier.`,
      ),
    );
  }
  if (resume.produitsNonComparables.length > 0) {
    const liste = el("ul", "non-comparables");
    for (const produit of resume.produitsNonComparables) {
      liste.append(el("li", "", `${produit.libelleMq}. ${produit.raison}`));
    }
    section.append(el("h3", "sous-intertitre", "Non comparé"), liste);
  }
  return section;
}

function sectionPourquoi(niveaux: LigneNiveau[], revenus: LigneRevenu[]): HTMLElement {
  const section = el("section", "ecran");
  section.id = "pourquoi";
  section.append(
    el("h2", "intertitre", "Ce qui coïncide avec le sentiment d'une vie plus chère"),
    el(
      "p",
      "chapo",
      "Ces chiffres sont mesurés. Ils coïncident avec le ressenti. Ils n'en sont pas la cause démontrée.",
    ),
  );
  const historique = el("div", "bloc-pourquoi");
  historique.append(el("h3", "sous-intertitre", "L'écart de niveau mesuré, 2010, 2015, 2022"));
  const series = ["alimentation", "ensemble"] as const;
  for (const poste of series) {
    const lignes = niveaux
      .filter((n) => n.poste === poste)
      .sort((a, b) => a.annee_enquete - b.annee_enquete);
    if (lignes.length === 0) throw new Error(`Historique ECSP absent : ${poste}.`);
    const max = Math.max(...lignes.map((n) => Math.abs(n.ecart_fisher_pct)));
    const bloc = el("div", "sous-bloc");
    bloc.append(el("p", "etiquette", libelleNiveau(poste)));
    for (const ligne of lignes) {
      bloc.append(
        ligneBarre(
          String(ligne.annee_enquete),
          "mesuré",
          ligne.ecart_fisher_pct,
          Math.abs(ligne.ecart_fisher_pct),
          0,
          max,
          "martinique",
          false,
          formaterPointsPct(ligne.ecart_fisher_pct),
        ),
      );
    }
    historique.append(bloc);
  }
  const delicate = niveaux.find((n) => n.remarque.toLowerCase().includes("délicate"));
  if (!delicate) throw new Error("Mention de comparabilité 2010-2015 absente du Parquet.");
  historique.append(el("p", "mention", delicate.remarque));
  section.append(historique);

  const blocRevenus = el("div", "bloc-pourquoi");
  blocRevenus.append(el("h3", "sous-intertitre", "Les revenus, par rapport à la moyenne nationale"));
  if (revenus.length === 0) throw new Error("Revenus absents.");
  const maxRevenu = Math.max(...revenus.map((r) => Math.abs(r.ecart_moyenne_nationale_pct)));
  for (const revenu of revenus) {
    blocRevenus.append(
      ligneBarreSignee(
        `${libelleRevenu(revenu.indicateur)}, ${revenu.annee}`,
        revenu.ecart_moyenne_nationale_pct,
        maxRevenu,
        formaterPointsPct(revenu.ecart_moyenne_nationale_pct),
      ),
    );
  }
  blocRevenus.append(el("p", "mention", revenus[0].champ));
  blocRevenus.append(sourceLigne(revenus[0].source_url, `Insee, consulté le ${revenus[0].consulte_le}`));
  section.append(blocRevenus);
  return section;
}

function sectionRecit(donnees: DonneesPage): HTMLElement {
  const section = el("section", "ecran recit");
  section.id = "recit";
  section.append(el("h2", "intertitre", "Le récit, trois registres"));
  const blocs = blocsRecit(donnees.ipc, donnees.niveaux, donnees.revenus, donnees.formules);
  for (const bloc of blocs) {
    const article = el("article", `bloc-recit registre-${bloc.registre}`);
    article.append(el("p", "badge-registre", libelleRegistre(bloc.registre)), el("p", "texte-recit", bloc.texte));
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

function sectionMethode(lignes: LigneDifferentiel[]): HTMLElement {
  const resume = calculerResume(lignes, "alimentation");
  const section = el("section", "ecran methode");
  section.id = "methode";
  section.append(
    el("h2", "intertitre", "Méthode"),
    paragraphe(
      "Un indice des prix est en base 100 sur son propre territoire. L'indice martiniquais et l'indice de l'Hexagone ne se comparent pas en niveau : chacun dit comment les prix ont bougé chez lui.",
    ),
    paragraphe(
      "L'écart de niveau vient des enquêtes de comparaison spatiale de l'Insee. Pour l'alimentation mois par mois, seule la mesure de mars-avril 2022 est une mesure. Tout mois suivant est une estimation : on prolonge cette mesure avec les évolutions des deux indices.",
    ),
    paragraphe(
      `Le dernier mois affiché est le dernier mois commun aux deux territoires : ${resume.dernierMoisCommun}. Si l'un publie avant l'autre, le mois en trop n'est pas montré.`,
    ),
    paragraphe(
      "Les enquêtes de 2010, 2015 et 2022 ne sont pas strictement comparables. L'enquête de 2022 ne publie pas d'intervalle de confiance : le seuil de deux points qui sépare « creusé », « resserré » et « à peu près le même » est un choix éditorial, que rien ne mesure.",
    ),
  );
  const ancre = selectionnerJalons(
    lignes.filter((l) => l.poste === "alimentation"),
  ).ancre;
  if (ancre.source_ecsp) {
    section.append(sourceLigne(ancre.source_ecsp, "Source de l'écart alimentaire 2022"));
  }
  section.append(
    sourceLigne(
      "https://www.insee.fr/fr/statistiques/7648939",
      "Insee Première n° 1958, écarts 2010, 2015 et 2022",
    ),
  );
  return section;
}

function barresAnnuelles(lignes: LigneDifferentiel[]): HTMLElement {
  const annees = ecartsAnnuels(lignes);
  const bloc = el("div", "ecarts-annuels");
  bloc.append(el("h4", "sous-intertitre", "Écart alimentaire estimé, année par année"));
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
  return bloc;
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
): HTMLElement {
  const ligne = el("div", `ligne-barre couleur-${couleur}`);
  const textes = el("div", "ligne-barre-textes");
  textes.append(el("span", "ligne-barre-nom", nom));
  const detail = el("span", "ligne-barre-sous", sous);
  if (estime) detail.append(document.createTextNode(" "), exposant("2"));
  else if (sous.includes("2022")) detail.append(document.createTextNode(" "), exposant("1"));
  textes.append(detail);
  const piste = el("div", "piste");
  const total = pleins + hachures;
  const largeur = max === 0 ? 0 : (total / max) * 100;
  piste.style.width = `${largeur}%`;
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
  const valeur = el("span", "chiffre", etiquette ?? formaterEurosPanier(montant));
  ligne.append(textes, piste, valeur);
  return ligne;
}

/** Barre divergente : axe zéro au centre, négatif à gauche, positif à droite. */
function ligneBarreSignee(nom: string, valeur: number, maxAbs: number, etiquette: string): HTMLElement {
  const ligne = el("div", "ligne-barre ligne-barre-signee couleur-neutre");
  const textes = el("div", "ligne-barre-textes");
  textes.append(el("span", "ligne-barre-nom", nom), el("span", "ligne-barre-sous", "mesuré"));
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
  ligne.append(textes, piste, el("span", "chiffre", etiquette));
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

function constat(fin: LigneDifferentiel): string {
  const mq = formaterPct(fin.evolution_martinique_pct);
  const fm = formaterPct(fin.evolution_france_metropolitaine_pct);
  const prix = prixDuPoste(fin.poste);
  if (fin.differentiel_evolution_points > 0) {
    return `Depuis avril 2022, ${prix} ont plus augmenté en Martinique (${mq} %) que dans l'Hexagone (${fm} %).`;
  }
  if (fin.differentiel_evolution_points < 0) {
    return `Depuis avril 2022, ${prix} ont moins augmenté en Martinique (${mq} %) que dans l'Hexagone (${fm} %).`;
  }
  return `Depuis avril 2022, ${prix} ont suivi le même pas en Martinique (${mq} %) et dans l'Hexagone (${fm} %).`;
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

function libelleRegistre(registreRecit: "mesure" | "contexte" | "lecture"): string {
  if (registreRecit === "mesure") return "Mesuré";
  if (registreRecit === "contexte") return "Contexte";
  return "Lecture";
}

function themeCourant(): "light" | "dark" {
  const impose = document.documentElement.dataset.theme;
  if (impose === "light" || impose === "dark") return impose;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function exposant(n: string): HTMLElement {
  return el("sup", "renvoi", n);
}

function lienBas(href: string, texte: string): HTMLAnchorElement {
  const lien = document.createElement("a");
  lien.className = "lien-bas";
  lien.href = href;
  lien.textContent = texte;
  return lien;
}

function sourceLigne(href: string, libelle: string): HTMLElement {
  const p = el("p", "source");
  const a = document.createElement("a");
  a.href = href;
  a.textContent = libelle;
  p.append(a);
  return p;
}

function paragraphe(texte: string): HTMLElement {
  return el("p", "", texte);
}

function el(tag: string, classe: string, texte?: string): HTMLElement {
  const node = document.createElement(tag);
  if (classe) node.className = classe;
  if (texte !== undefined) node.textContent = texte;
  return node;
}
