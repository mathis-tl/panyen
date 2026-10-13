/**
 * Données qualité du site, affichées en bas de page.
 *
 * Ce sont des mesures, pas des calculs de la page : elles sont relevées à la main
 * (Lighthouse, poids réseau, décompte des tests) et recopiées ici avec leur date.
 * Les refaire à chaque changement de la page ; la date dit de quand elles datent.
 */

export interface MesureLighthouse {
  page: string;
  mode: "mobile" | "bureau";
  performance: number;
  accessibilite: number;
  bonnesPratiques: number;
  seo: number;
}

export interface DonneesQualite {
  mesureLe: string;
  methode: string;
  lighthouse: MesureLighthouse[];
  reseau: {
    accueilHorsVideoKo: number;
    videoMo: number;
    requetesAccueil: number;
    hotesTiers: number;
    erreursConsole: number;
    techosKo: number;
  };
  controles: { dbt: number; python: number; vitest: number };
}

export const QUALITE: DonneesQualite = {
  mesureLe: "13 octobre 2026",
  methode:
    "Version de production construite puis servie en local avec compression brotli. Lighthouse 13, Chrome sans fenêtre, réseau mobile simulé et processeur ralenti pour « mobile », réglage bureau sinon.",
  lighthouse: [
    { page: "Accueil", mode: "mobile", performance: 97, accessibilite: 100, bonnesPratiques: 100, seo: 100 },
    { page: "Accueil", mode: "bureau", performance: 100, accessibilite: 100, bonnesPratiques: 100, seo: 100 },
    { page: "Pour les techos", mode: "mobile", performance: 99, accessibilite: 100, bonnesPratiques: 100, seo: 100 },
    { page: "Pour les techos", mode: "bureau", performance: 100, accessibilite: 100, bonnesPratiques: 100, seo: 100 },
  ],
  reseau: {
    accueilHorsVideoKo: 537,
    videoMo: 1.4,
    requetesAccueil: 30,
    hotesTiers: 0,
    erreursConsole: 0,
    techosKo: 209,
  },
  controles: { dbt: 201, python: 101, vitest: 117 },
};

function noeud<K extends keyof HTMLElementTagNameMap>(
  balise: K,
  classe: string,
  texte?: string,
): HTMLElementTagNameMap[K] {
  const n = document.createElement(balise);
  if (classe) n.className = classe;
  if (texte !== undefined) n.textContent = texte;
  return n;
}

function nombre(valeur: number, decimales = 0): string {
  return valeur.toFixed(decimales).replace(".", ",");
}

/** Lignes de texte du bloc qualité, séparées du DOM pour être testées. */
export function lignesQualite(q: DonneesQualite): string[] {
  const lignes = q.lighthouse.map(
    (m) =>
      `${m.page}, ${m.mode} : performance ${m.performance}, accessibilité ${m.accessibilite}, bonnes pratiques ${m.bonnesPratiques}, SEO ${m.seo}.`,
  );
  lignes.push(
    `Poids de l'accueil : ${nombre(q.reseau.accueilHorsVideoKo)} Ko hors vidéo, plus ${nombre(q.reseau.videoMo, 1)} Mo pour la vidéo du bandeau, en ${q.reseau.requetesAccueil} requêtes. Page « Pour les techos » : ${nombre(q.reseau.techosKo)} Ko.`,
    `Hôtes tiers : ${q.reseau.hotesTiers}. Erreurs ou avertissements dans la console : ${q.reseau.erreursConsole}.`,
    `Contrôles automatiques : ${q.controles.dbt} tests de données, ${q.controles.python} tests Python, ${q.controles.vitest} tests de la page.`,
  );
  return lignes;
}

/** Bloc « Qualité du site », pour le bas de page. */
export function creerBlocQualite(q: DonneesQualite = QUALITE): HTMLElement {
  const bloc = noeud("section", "qualite");
  bloc.setAttribute("aria-labelledby", "titre-qualite");
  const titre = noeud("h2", "qualite-titre", "Qualité du site");
  titre.id = "titre-qualite";
  const liste = noeud("ul", "qualite-liste");
  for (const ligne of lignesQualite(q)) liste.append(noeud("li", "", ligne));
  bloc.append(
    titre,
    noeud("p", "qualite-date", `Mesuré le ${q.mesureLe}. ${q.methode}`),
    liste,
  );
  return bloc;
}
