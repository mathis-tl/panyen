/**
 * Calculs d'affichage purs — aucun DOM, aucun réseau.
 * La base 100 du panier est la seule constante pédagogique autorisée.
 */
import type { LigneDifferentiel } from "./types.ts";
import { formaterMoisUtc } from "./validation.ts";

/** Seuil éditorial : écart actuel « proche » de l'ancre (points). */
const SEUIL_PROCHE_ANCRE_POINTS = 0.5;

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
  ancre: LigneDifferentiel;
  minimumEstime: LigneDifferentiel;
  maximumEstime: LigneDifferentiel;
  actuelle: LigneDifferentiel;
  variationEcartPoints: number;
  conclusion: string;
  phrase: string;
  dernierMoisCommun: string;
  lignes: LigneDifferentiel[];
  panierAncre: PanierIllustratif;
  panierMinimum: PanierIllustratif;
  panierMaximum: PanierIllustratif;
  panierActuelle: PanierIllustratif;
  seriesEvolution: SeriesEvolution;
  explicationPourcentageVsPoints: string;
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
    if (ligne.ecart_prix_estime_pct < minimumEstime.ecart_prix_estime_pct) {
      minimumEstime = ligne;
    }
    if (ligne.ecart_prix_estime_pct > maximumEstime.ecart_prix_estime_pct) {
      maximumEstime = ligne;
    }
  }

  const actuelle = lignes[lignes.length - 1];
  return { ancre, minimumEstime, maximumEstime, actuelle };
}

export function calculerPanierIllustratif(
  ligne: LigneDifferentiel,
): PanierIllustratif {
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
    `Un pourcentage d'évolution mesure la variation des prix alimentaires ` +
    `à l'intérieur d'un territoire depuis avril 2022. ` +
    `Ainsi ${evoMq} % en Martinique et ${evoFm} % en France métropolitaine ` +
    `sont deux évolutions comparables, pas deux niveaux d'indice. ` +
    `Leur différence s'exprime en points de pourcentage : ${diff} point, ` +
    `ce qui n'est pas ${diff} % d'écart de prix.`
  );
}

function formulerConclusion(
  ancre: LigneDifferentiel,
  minimumEstime: LigneDifferentiel,
  maximumEstime: LigneDifferentiel,
  variationEcartPoints: number,
): string {
  const proche =
    Math.abs(variationEcartPoints) < SEUIL_PROCHE_ANCRE_POINTS;
  const minSousAncre =
    minimumEstime.ecart_prix_estime_pct < ancre.ecart_ecsp_2022_pct;
  const maxSurAncre =
    maximumEstime.ecart_prix_estime_pct > ancre.ecart_ecsp_2022_pct;
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

export function calculerResume(lignes: LigneDifferentiel[]): ResumeEcran {
  const { ancre, minimumEstime, maximumEstime, actuelle } =
    selectionnerJalons(lignes);

  const variationEcartPoints =
    actuelle.ecart_prix_estime_pct - ancre.ecart_ecsp_2022_pct;
  const conclusion = formulerConclusion(
    ancre,
    minimumEstime,
    maximumEstime,
    variationEcartPoints,
  );
  const dernierMoisCommun = formaterMoisUtc(actuelle.dernier_mois_commun);

  const phrase =
    `${conclusion} ` +
    `En ${dernierMoisCommun}, l'écart alimentaire est estimé à ` +
    `${formaterPct(actuelle.ecart_prix_estime_pct)} % ` +
    `(estimation), contre ${formaterPct(ancre.ecart_ecsp_2022_pct)} % ` +
    `mesurés en mars-avril 2022 (mesure ECSP). ` +
    `Variation depuis l'ancre : ${formaterPointsSignes(variationEcartPoints)} point.`;

  return {
    ancre,
    minimumEstime,
    maximumEstime,
    actuelle,
    variationEcartPoints,
    conclusion,
    phrase,
    dernierMoisCommun,
    lignes,
    panierAncre: calculerPanierIllustratif(ancre),
    panierMinimum: calculerPanierIllustratif(minimumEstime),
    panierMaximum: calculerPanierIllustratif(maximumEstime),
    panierActuelle: calculerPanierIllustratif(actuelle),
    seriesEvolution: preparerSeriesEvolution(lignes),
    explicationPourcentageVsPoints: expliquerPourcentageVsPoints(actuelle),
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
