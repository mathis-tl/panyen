/**
 * Graphe carburants : ruban q10–q90, médiane et plafond martiniquais en escalier.
 * Un seul axe vertical en euros par litre.
 */
import * as Plot from "@observablehq/plot";
import type { ResumeCarburants } from "./calculs-carburants.ts";
import { formaterEurosLitre } from "./calculs-carburants.ts";
import { formaterMoisUtc } from "./validation-carburants.ts";

const COULEUR_RUBAN = "#457b9d33";
const COULEUR_RUBAN_BORD = "#457b9d";
const COULEUR_MEDIANE = "#457b9d";
const COULEUR_PLAFOND = "#e63946";
const COULEUR_INCOMPLET = "#6b7280";

export const SEUIL_ETROIT_PX = 520;

export interface DispositionGrapheCarburants {
  largeur: number;
  hauteur: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  etroit: boolean;
}

export function calculerDispositionGrapheCarburants(
  largeurConteneur: number,
): DispositionGrapheCarburants {
  if (!Number.isFinite(largeurConteneur) || largeurConteneur <= 0) {
    throw new Error(`Largeur de conteneur invalide: ${largeurConteneur}`);
  }
  const largeur = Math.max(280, Math.floor(largeurConteneur));
  const etroit = largeur < SEUIL_ETROIT_PX;
  return {
    largeur,
    hauteur: etroit ? 360 : 420,
    marginTop: 12,
    marginRight: etroit ? 36 : 20,
    marginBottom: etroit ? 44 : 52,
    marginLeft: etroit ? 44 : 56,
    etroit,
  };
}

export function calculerDomainePrix(valeurs: number[]): { min: number; max: number } {
  if (valeurs.length === 0) {
    throw new Error("Domaine vertical impossible : aucune valeur.");
  }
  const min = Math.min(...valeurs);
  const max = Math.max(...valeurs);
  const marge = Math.max(0.05, (max - min) * 0.08);
  return { min: Math.max(0, min - marge), max: max + marge };
}

interface PointPlafond {
  date: Date;
  prix: number;
}

/** Points pour une courbe en escalier (step-after). */
export function pointsEscalierPlafond(
  plafonds: ResumeCarburants["plafonds"],
): PointPlafond[] {
  const points: PointPlafond[] = [];
  for (const segment of plafonds) {
    points.push({ date: segment.debut, prix: segment.prixMax });
    if (segment.finExclusive) {
      points.push({
        date: segment.finExclusive,
        prix: segment.prixMax,
      });
    }
  }
  return points;
}

interface MarqueInfobulle {
  date: Date;
  mediane: number;
  q10: number;
  q90: number;
}

/** Infobulle du mois le plus proche du pointeur ; sans pointerX, Plot les affiche toutes. */
export function infobulleCarburants(marques: MarqueInfobulle[]) {
  return Plot.tip(
    marques,
    Plot.pointerX({
      x: "date",
      y: "mediane",
      title: (d: MarqueInfobulle) =>
        `${formaterMoisUtc(d.date)}\nMédiane : ${formaterEurosLitre(d.mediane)}\nq10–q90 : ${formaterEurosLitre(d.q10)} – ${formaterEurosLitre(d.q90)}`,
    }),
  );
}

export function grapheCarburants(
  resume: ResumeCarburants,
  disposition: DispositionGrapheCarburants,
): SVGSVGElement | HTMLElement {
  const { distributions, plafonds } = resume;

  const toutesValeurs = [
    ...distributions.flatMap((d) => [d.q10, d.q25, d.mediane, d.q75, d.q90]),
    ...plafonds.map((p) => p.prixMax),
  ];

  const domaineY = calculerDomainePrix(toutesValeurs);
  const escalier = pointsEscalierPlafond(plafonds);

  const marques = distributions.map((d) => ({
    date: d.date,
    q10: d.q10,
    q90: d.q90,
    q25: d.q25,
    q75: d.q75,
    mediane: d.mediane,
    incomplet: !d.moisComplet,
  }));

  const plot = Plot.plot({
    width: disposition.largeur,
    height: disposition.hauteur,
    marginTop: disposition.marginTop,
    marginRight: disposition.marginRight,
    marginBottom: disposition.marginBottom,
    marginLeft: disposition.marginLeft,
    x: { type: "utc", label: null },
    y: {
      label: "€/L",
      domain: [domaineY.min, domaineY.max],
      grid: true,
    },
    color: { legend: false },
    marks: [
      Plot.areaY(marques, {
        x: "date",
        y1: "q10",
        y2: "q90",
        fill: COULEUR_RUBAN,
        stroke: COULEUR_RUBAN_BORD,
        strokeWidth: 0.5,
      }),
      // interval "month" : rectY exige sinon une échelle band, incompatible avec utc.
      Plot.rectY(marques, {
        x: "date",
        interval: "month",
        y1: "q25",
        y2: "q75",
        fill: COULEUR_RUBAN_BORD,
        fillOpacity: 0.25,
        inset: 2,
      }),
      Plot.line(marques, {
        x: "date",
        y: "mediane",
        stroke: COULEUR_MEDIANE,
        strokeWidth: 2,
      }),
      Plot.line(escalier, {
        x: "date",
        y: "prix",
        stroke: COULEUR_PLAFOND,
        strokeWidth: 2,
        curve: "step-after",
      }),
      Plot.dot(
        marques.filter((m) => m.incomplet),
        {
          x: "date",
          y: "mediane",
          fill: COULEUR_INCOMPLET,
          r: 4,
          title: (d) => `${formaterMoisUtc(d.date)} — mois incomplet`,
        },
      ),
      infobulleCarburants(marques),
    ],
  });

  return plot;
}
