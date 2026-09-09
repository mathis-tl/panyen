/**
 * Calculs d'affichage purs — aucun DOM, aucun réseau.
 * La base 100 du panier est la seule constante pédagogique autorisée.
 */
import type { CodePoste, LigneDifferentiel } from "./types.ts";
import { formaterMoisUtc, regrouperParPoste } from "./validation.ts";

/** Seuil éditorial : écart actuel « proche » de l'ancre (points). */
const SEUIL_PROCHE_ANCRE_POINTS = 0.5;

/**
 * Complément du nom, article contracté inclus, pour que les phrases restent
 * du français. Injecter le libellé nu produirait « les prix énergie ».
 */
const COMPLEMENT_POSTE: Record<CodePoste, string> = {
  alimentation: "de l'alimentation",
  energie: "de l'énergie",
  produits_manufactures: "des produits manufacturés",
  services: "des services",
};

/** « les prix de l'énergie », sujet d'une phrase. */
export function prixDuPoste(poste: CodePoste): string {
  return `les prix ${COMPLEMENT_POSTE[poste]}`;
}

/** « des prix de l'énergie », complément d'un nom. */
export function desPrixDuPoste(poste: CodePoste): string {
  return `des prix ${COMPLEMENT_POSTE[poste]}`;
}

/**
 * Titre d'onglet du poste affiché.
 * Le mot « écart » n'apparaît que là où un écart de niveau est publié, donc
 * pour l'alimentation seule ; ailleurs le titre ne parle que d'évolution.
 */
export function titreDuPoste(poste: CodePoste, ancreEcspDisponible: boolean): string {
  const sujet = ancreEcspDisponible
    ? `écart de prix ${COMPLEMENT_POSTE[poste]}`
    : `évolution ${desPrixDuPoste(poste)}`;
  return `panyen — ${sujet}, Martinique / France métropolitaine`;
}

/**
 * Base conventionnelle du panier fictif.
 * Ce n'est pas un prix observé : c'est une échelle pédagogique.
 */
export const BASE_PANIER_ILLUSTRATIF = 100;

export interface PanierIllustratif {
  metropole: number;
  martinique: number;
  ecartRelatifPct: number;
}

export interface Jalons {
  ancre: LigneDifferentiel;
  minimumEstime: LigneDifferentiel;
  maximumEstime: LigneDifferentiel;
  actuelle: LigneDifferentiel;
}

export interface PointEvolution {
  periode: Date;
  evolution_martinique_pct: number;
  evolution_france_metropolitaine_pct: number;
}

export interface SeriesEvolution {
  points: PointEvolution[];
  premierMois: string;
  dernierMois: string;
}

export interface ResumeEcran {
  poste: CodePoste;
  libellePoste: string;
  ancreEcspDisponible: boolean;
  ancre: LigneDifferentiel | null;
  minimumEstime: LigneDifferentiel | null;
  maximumEstime: LigneDifferentiel | null;
  actuelle: LigneDifferentiel;
  extremumDifferentielMin: LigneDifferentiel;
  extremumDifferentielMax: LigneDifferentiel;
  variationEcartPoints: number | null;
  conclusion: string;
  phrase: string;
  dernierMoisCommun: string;
  lignes: LigneDifferentiel[];
  panierAncre: PanierIllustratif | null;
  panierMinimum: PanierIllustratif | null;
  panierMaximum: PanierIllustratif | null;
  panierActuelle: PanierIllustratif | null;
  seriesEvolution: SeriesEvolution;
  explicationPourcentageVsPoints: string;
  noteSansAncre: string | null;
}

export function lignesDuPoste(
  lignes: LigneDifferentiel[],
  poste: CodePoste,
): LigneDifferentiel[] {
  const groupes = regrouperParPoste(lignes);
  const duPoste = groupes.get(poste);
  if (!duPoste || duPoste.length === 0) {
    throw new Error(`Poste introuvable : ${poste}.`);
  }
  return duPoste;
}

export function selectionnerJalons(lignes: LigneDifferentiel[]): Jalons {
  const ancre = lignes.find((l) => l.nature_ecart === "mesure_ecsp_2022");
  if (!ancre) {
    throw new Error("Ancre mesure_ecsp_2022 introuvable.");
  }
  const estimations = lignes.filter(
    (l) => l.nature_ecart === "estimation_a_partir_ecsp_2022",
  );
  if (estimations.length === 0) {
    throw new Error("Aucune estimation disponible.");
  }

  let minimumEstime = estimations[0];
  let maximumEstime = estimations[0];
  for (const ligne of estimations) {
    if (
      (ligne.ecart_prix_estime_pct as number) <
      (minimumEstime.ecart_prix_estime_pct as number)
    ) {
      minimumEstime = ligne;
    }
    if (
      (ligne.ecart_prix_estime_pct as number) >
      (maximumEstime.ecart_prix_estime_pct as number)
    ) {
      maximumEstime = ligne;
    }
  }

  const actuelle = lignes[lignes.length - 1];
  return { ancre, minimumEstime, maximumEstime, actuelle };
}

function selectionnerExtremumsDifferentiel(lignes: LigneDifferentiel[]): {
  minimum: LigneDifferentiel;
  maximum: LigneDifferentiel;
} {
  let minimum = lignes[0];
  let maximum = lignes[0];
  for (const ligne of lignes) {
    if (ligne.differentiel_evolution_points < minimum.differentiel_evolution_points) {
      minimum = ligne;
    }
    if (ligne.differentiel_evolution_points > maximum.differentiel_evolution_points) {
      maximum = ligne;
    }
  }
  return { minimum, maximum };
}

export function calculerPanierIllustratif(
  ligne: LigneDifferentiel,
): PanierIllustratif {
  if (ligne.ecart_ecsp_2022_pct === null) {
    throw new Error("Panier illustratif impossible sans ancre ECSP.");
  }
  const metropole = BASE_PANIER_ILLUSTRATIF * ligne.facteur_france_metropolitaine;
  const martiniqueInitiale =
    BASE_PANIER_ILLUSTRATIF * (1 + ligne.ecart_ecsp_2022_pct / 100);
  const martinique = martiniqueInitiale * ligne.facteur_martinique;
  const ecartRelatifPct = (martinique / metropole - 1) * 100;
  return { metropole, martinique, ecartRelatifPct };
}

export function preparerSeriesEvolution(
  lignes: LigneDifferentiel[],
): SeriesEvolution {
  return {
    points: lignes.map((l) => ({
      periode: l.periode,
      evolution_martinique_pct: l.evolution_martinique_pct,
      evolution_france_metropolitaine_pct: l.evolution_france_metropolitaine_pct,
    })),
    premierMois: formaterMoisUtc(lignes[0].periode),
    dernierMois: formaterMoisUtc(lignes[lignes.length - 1].periode),
  };
}

export function expliquerPourcentageVsPoints(
  actuelle: LigneDifferentiel,
): string {
  const evoMq = formaterPct(actuelle.evolution_martinique_pct);
  const evoFm = formaterPct(actuelle.evolution_france_metropolitaine_pct);
  const diff = formaterPointsSignes(actuelle.differentiel_evolution_points);
  return (
    `Un pourcentage d'évolution mesure la variation ${desPrixDuPoste(actuelle.poste)} ` +
    `à l'intérieur d'un territoire depuis avril 2022. ` +
    `Ainsi ${evoMq} % en Martinique et ${evoFm} % en France métropolitaine ` +
    `sont deux évolutions comparables, pas deux niveaux d'indice. ` +
    `Leur différence s'exprime en points de pourcentage : ${diff} point, ` +
    `ce qui n'est pas ${diff} % d'écart de prix.`
  );
}

function formulerConclusionAvecAncre(
  ancre: LigneDifferentiel,
  minimumEstime: LigneDifferentiel,
  maximumEstime: LigneDifferentiel,
  variationEcartPoints: number,
): string {
  const proche = Math.abs(variationEcartPoints) < SEUIL_PROCHE_ANCRE_POINTS;
  const minSousAncre =
    (minimumEstime.ecart_prix_estime_pct as number) <
    (ancre.ecart_ecsp_2022_pct as number);
  const maxSurAncre =
    (maximumEstime.ecart_prix_estime_pct as number) >
    (ancre.ecart_ecsp_2022_pct as number);
  const minAvantMax =
    minimumEstime.periode.getTime() < maximumEstime.periode.getTime();
  const maxAvantMin =
    maximumEstime.periode.getTime() < minimumEstime.periode.getTime();

  if (minSousAncre && maxSurAncre && minAvantMax && proche) {
    return (
      "Après s'être resserré puis creusé, l'écart alimentaire estimé " +
      "est revenu presque à son niveau de 2022."
    );
  }
  if (minSousAncre && maxSurAncre && maxAvantMin && proche) {
    return (
      "Après s'être creusé puis resserré, l'écart alimentaire estimé " +
      "est revenu presque à son niveau de 2022."
    );
  }

  if (proche) {
    return (
      "L'écart alimentaire estimé est aujourd'hui proche de son niveau mesuré en 2022."
    );
  }
  if (variationEcartPoints > 0) {
    return (
      "L'écart alimentaire estimé est aujourd'hui supérieur à son niveau mesuré en 2022."
    );
  }
  return (
    "L'écart alimentaire estimé est aujourd'hui inférieur à son niveau mesuré en 2022."
  );
}

function formulerConclusionSansAncre(actuelle: LigneDifferentiel): string {
  const diff = actuelle.differentiel_evolution_points;
  const prix = prixDuPoste(actuelle.poste);
  if (Math.abs(diff) < SEUIL_PROCHE_ANCRE_POINTS) {
    return (
      `Depuis avril 2022, ${prix} ont évolué à un rythme ` +
      `presque parallèle en Martinique et en France métropolitaine.`
    );
  }
  if (diff > 0) {
    return (
      `Depuis avril 2022, ${prix} ont augmenté davantage ` +
      `en Martinique qu'en France métropolitaine ` +
      `(différentiel : ${formaterPointsSignes(diff)} point).`
    );
  }
  return (
    `Depuis avril 2022, ${prix} ont augmenté moins vite ` +
    `en Martinique qu'en France métropolitaine ` +
    `(différentiel : ${formaterPointsSignes(diff)} point).`
  );
}

function noteSansAncre(libellePoste: string): string {
  return (
    `L'enquête ECSP 2022 mesure ses écarts de niveau par grandes fonctions ` +
    `de consommation (alimentaire, communications, santé…). Ce découpage ne ` +
    `correspond pas au poste « ${libellePoste} » de l'IPC, qui traverse plusieurs ` +
    `fonctions. Aucun écart de niveau n'est donc publiable ici : seule ` +
    `l'évolution des prix depuis avril 2022 est comparable entre territoires.`
  );
}

export function calculerResume(
  lignesToutes: LigneDifferentiel[],
  poste: CodePoste = "alimentation",
): ResumeEcran {
  const lignes = lignesDuPoste(lignesToutes, poste);
  const actuelle = lignes[lignes.length - 1];
  const libellePoste = actuelle.libelle_poste;
  const extremums = selectionnerExtremumsDifferentiel(lignes);
  const seriesEvolution = preparerSeriesEvolution(lignes);
  const dernierMoisCommun = formaterMoisUtc(actuelle.dernier_mois_commun);
  const explication = expliquerPourcentageVsPoints(actuelle);

  if (actuelle.ancre_ecsp_disponible) {
    const { ancre, minimumEstime, maximumEstime } = selectionnerJalons(lignes);
    const variationEcartPoints =
      (actuelle.ecart_prix_estime_pct as number) -
      (ancre.ecart_ecsp_2022_pct as number);
    const conclusion = formulerConclusionAvecAncre(
      ancre,
      minimumEstime,
      maximumEstime,
      variationEcartPoints,
    );
    const phrase =
      `${conclusion} ` +
      `En ${dernierMoisCommun}, l'écart alimentaire est estimé à ` +
      `${formaterPct(actuelle.ecart_prix_estime_pct as number)} % ` +
      `(estimation), contre ${formaterPct(ancre.ecart_ecsp_2022_pct as number)} % ` +
      `mesurés en mars-avril 2022 (mesure ECSP). ` +
      `Variation depuis l'ancre : ${formaterPointsSignes(variationEcartPoints)} point.`;

    return {
      poste,
      libellePoste,
      ancreEcspDisponible: true,
      ancre,
      minimumEstime,
      maximumEstime,
      actuelle,
      extremumDifferentielMin: extremums.minimum,
      extremumDifferentielMax: extremums.maximum,
      variationEcartPoints,
      conclusion,
      phrase,
      dernierMoisCommun,
      lignes,
      panierAncre: calculerPanierIllustratif(ancre),
      panierMinimum: calculerPanierIllustratif(minimumEstime),
      panierMaximum: calculerPanierIllustratif(maximumEstime),
      panierActuelle: calculerPanierIllustratif(actuelle),
      seriesEvolution,
      explicationPourcentageVsPoints: explication,
      noteSansAncre: null,
    };
  }

  const conclusion = formulerConclusionSansAncre(actuelle);
  const phrase =
    `${conclusion} ` +
    `En ${dernierMoisCommun}, l'évolution cumulée depuis avril 2022 est de ` +
    `${formaterPct(actuelle.evolution_martinique_pct)} % en Martinique et ` +
    `${formaterPct(actuelle.evolution_france_metropolitaine_pct)} % ` +
    `en France métropolitaine ` +
    `(différentiel : ${formaterPointsSignes(actuelle.differentiel_evolution_points)} point). ` +
    `Minimum du différentiel : ${formaterPointsSignes(extremums.minimum.differentiel_evolution_points)} point ` +
    `en ${formaterMoisUtc(extremums.minimum.periode)} ; ` +
    `maximum : ${formaterPointsSignes(extremums.maximum.differentiel_evolution_points)} point ` +
    `en ${formaterMoisUtc(extremums.maximum.periode)}.`;

  return {
    poste,
    libellePoste,
    ancreEcspDisponible: false,
    ancre: null,
    minimumEstime: null,
    maximumEstime: null,
    actuelle,
    extremumDifferentielMin: extremums.minimum,
    extremumDifferentielMax: extremums.maximum,
    variationEcartPoints: null,
    conclusion,
    phrase,
    dernierMoisCommun,
    lignes,
    panierAncre: null,
    panierMinimum: null,
    panierMaximum: null,
    panierActuelle: null,
    seriesEvolution,
    explicationPourcentageVsPoints: explication,
    noteSansAncre: noteSansAncre(libellePoste),
  };
}

export function formaterPct(n: number): string {
  return n.toFixed(1).replace(".", ",");
}

export function formaterPointsSignes(n: number): string {
  const corps = Math.abs(n).toFixed(2).replace(".", ",");
  if (n > 0) return `+${corps}`;
  if (n < 0) return `−${corps}`;
  return corps;
}

export function formaterEuros(n: number): string {
  return `${n.toFixed(0)} €`;
}
