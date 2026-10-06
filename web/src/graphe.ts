/**
 * Graphe principal : deux évolutions cumulées depuis avril 2022.
 * Aucun niveau d'indice territorial. Aucun second graphe redondant.
 */
import { formaterMoisAxe } from "./axes-fr.ts";
import * as Plot from "@observablehq/plot";
import type { ResumeEcran } from "./calculs.ts";
import { formaterPct } from "./calculs.ts";
import { formaterMoisUtc } from "./validation.ts";

const COULEUR_MQ = "var(--martinique)";
const COULEUR_FM = "var(--hexagone)";
const COULEUR_JALON = "var(--schiste)";
const FAMILLE_CHIFFRES = '"Archivo Variable", sans-serif';

/** Sous ce seuil, marges et labels sont recomposés pour l'écran étroit. */
export const SEUIL_ETROIT_PX = 520;

export interface DispositionGraphe {
  largeur: number;
  hauteur: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  etroit: boolean;
  labelsALinterieur: boolean;
}

export interface JalonRepereGraphe {
  periode: Date;
  label: string | null;
}

/**
 * Politique pure de dimensions : largeur = conteneur, marges adaptées.
 */
export function calculerDispositionGraphe(
  largeurConteneur: number,
): DispositionGraphe {
  if (!Number.isFinite(largeurConteneur) || largeurConteneur <= 0) {
    throw new Error(`Largeur de conteneur invalide: ${largeurConteneur}`);
  }
  const largeur = Math.max(280, Math.floor(largeurConteneur));
  const etroit = largeur < SEUIL_ETROIT_PX;
  return {
    largeur,
    hauteur: etroit ? 360 : 420,
    marginTop: 12,
    // Labels à l'intérieur ; marge droite pour le tick terminal centré.
    marginRight: etroit ? 36 : 20,
    marginBottom: etroit ? 44 : 52,
    marginLeft: etroit ? 36 : 48,
    etroit,
    labelsALinterieur: true,
  };
}

/** Libellés de fin : noms complets, multilignes pour rester lisibles. */
export function libellesFinCourbes(
  evoMq: number,
  evoFm: number,
): { martinique: string; franceMetropolitaine: string } {
  return {
    martinique: `Martinique\n${formaterPct(evoMq)} %`,
    franceMetropolitaine: `Hexagone\n${formaterPct(evoFm)} %`,
  };
}

/**
 * Domaine vertical couvrant réellement les deux séries.
 *
 * Une évolution cumulée peut être négative : les prix d'un poste peuvent être
 * repassés sous leur niveau d'avril 2022. Un domaine cloué à zéro écrêterait
 * ces mois sans le dire, ce qui afficherait une donnée fausse. Le zéro reste
 * toujours dans le domaine, puisque c'est l'ancre du récit.
 */
export function calculerDomaineEvolution(
  valeurs: number[],
): { min: number; max: number } {
  if (valeurs.length === 0) {
    throw new Error("Domaine vertical impossible : aucune valeur.");
  }
  const minObserve = Math.min(...valeurs, 0);
  const maxObserve = Math.max(...valeurs, 0);
  // Marge proportionnelle à l'amplitude, avec un plancher pour les séries plates.
  const marge = Math.max((maxObserve - minObserve) * 0.15, 1);
  return {
    min: minObserve < 0 ? minObserve - marge : 0,
    max: Math.max(maxObserve + marge, 5),
  };
}

/** Repères temporels : règle pour les trois dates, libellé omis pour le terminal. */
export function jalonsRepereGraphe(
  minimum: Date,
  maximum: Date,
  actuelle: Date,
): JalonRepereGraphe[] {
  return [
    { periode: minimum, label: "min." },
    { periode: maximum, label: "max." },
    { periode: actuelle, label: null },
  ];
}

/** Mois abrégé pour ticks en largeur étroite (évite la collision / troncature). */
function formaterMoisCourtUtc(date: Date): string {
  const mois = [
    "janv.",
    "févr.",
    "mars",
    "avr.",
    "mai",
    "juin",
    "juil.",
    "août",
    "sept.",
    "oct.",
    "nov.",
    "déc.",
  ];
  return `${mois[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function grapheEvolutions(
  resume: ResumeEcran,
  largeurConteneur: number,
): SVGSVGElement | HTMLElement {
  const { lignes, actuelle } = resume;
  const disposition = calculerDispositionGraphe(largeurConteneur);

  const derniere = lignes[lignes.length - 1];
  const evoMq = derniere.evolution_martinique_pct;
  const evoFm = derniere.evolution_france_metropolitaine_pct;
  const domaineY = calculerDomaineEvolution(
    lignes.flatMap((l) => [
      l.evolution_martinique_pct,
      l.evolution_france_metropolitaine_pct,
    ]),
  );

  const ecartFinal = Math.abs(evoMq - evoFm);
  const dyMq = evoMq >= evoFm ? -14 : 18;
  const dyFm = evoMq >= evoFm ? 18 : -14;
  const labelsProches = ecartFinal < 1.5;
  const libelles = libellesFinCourbes(evoMq, evoFm);

  const labels = [
    {
      periode: derniere.periode,
      y: evoMq,
      texte: libelles.martinique,
      dy: labelsProches ? dyMq : -4,
    },
    {
      periode: derniere.periode,
      y: evoFm,
      texte: libelles.franceMetropolitaine,
      dy: labelsProches ? dyFm : 14,
    },
  ];

  const jalonMin =
    resume.minimumEstime?.periode ?? resume.extremumDifferentielMin.periode;
  const jalonMax =
    resume.maximumEstime?.periode ?? resume.extremumDifferentielMax.periode;
  const jalonsDates = jalonsRepereGraphe(jalonMin, jalonMax, actuelle.periode);
  const jalonsLibelles = jalonsDates.filter((j) => j.label !== null);

  const ancrageFin = disposition.labelsALinterieur
    ? { textAnchor: "end" as const, dx: -6 }
    : { textAnchor: "start" as const, dx: 8 };

  return Plot.plot({
    style: { fontFamily: FAMILLE_CHIFFRES },
    // Titre/sous-titre déplacés dans le HTML (rendu.ts) pour éviter la troncature.
    width: disposition.largeur,
    height: disposition.hauteur,
    marginTop: disposition.marginTop,
    marginRight: disposition.marginRight,
    marginBottom: disposition.marginBottom,
    marginLeft: disposition.marginLeft,
    x: {
      label: null,
      domain: [lignes[0].periode, actuelle.periode],
      ticks: [lignes[0].periode, actuelle.periode],
      tickFormat: (d: Date) =>
        disposition.etroit ? formaterMoisCourtUtc(d) : formaterMoisUtc(d),
    },
    y: {
      label: disposition.etroit ? null : "Évolution cumulée (%)",
      grid: true,
      domain: [domaineY.min, domaineY.max],
      nice: false,
      tickFormat: (d: number) => String(d),
    },
    marks: [
      Plot.ruleY([0], { stroke: "#999", strokeWidth: 1 }),
      Plot.lineY(lignes, {
        x: "periode",
        y: "evolution_martinique_pct",
        stroke: COULEUR_MQ,
        strokeWidth: 2.5,
      }),
      Plot.lineY(lignes, {
        x: "periode",
        y: "evolution_france_metropolitaine_pct",
        stroke: COULEUR_FM,
        strokeWidth: 1.5,
      }),
      Plot.ruleX(jalonsDates, {
        x: "periode",
        stroke: COULEUR_JALON,
        strokeDasharray: "3 3",
        strokeOpacity: 0.7,
      }),
      Plot.text(jalonsLibelles, {
        x: "periode",
        // Ancré au plancher du domaine, qui n'est plus zéro dès qu'une
        // évolution passe sous son niveau d'avril 2022.
        y: domaineY.min,
        text: "label",
        dy: 14,
        fontSize: 11,
        fill: COULEUR_JALON,
        textAnchor: "middle",
      }),
      Plot.text([labels[0]], {
        x: "periode",
        y: "y",
        text: "texte",
        dx: ancrageFin.dx,
        dy: labels[0].dy,
        textAnchor: ancrageFin.textAnchor,
        lineAnchor: "middle",
        fontSize: disposition.etroit ? 11 : 12,
        fontWeight: "bold",
        fill: COULEUR_MQ,
      }),
      Plot.text([labels[1]], {
        x: "periode",
        y: "y",
        text: "texte",
        dx: ancrageFin.dx,
        dy: labels[1].dy,
        textAnchor: ancrageFin.textAnchor,
        lineAnchor: "middle",
        fontSize: disposition.etroit ? 11 : 12,
        fontWeight: "bold",
        fill: COULEUR_FM,
      }),
    ],
  });
}

export interface MarqueurContexte {
  date: Date;
  titre: string;
}

/**
 * Décalages verticaux (px) de deux étiquettes de fin de courbe : si elles
 * tombent à moins de `ecartMinPx` l'une de l'autre, on les écarte de part et
 * d'autre de leur milieu, la plus haute vers le haut. Aucune valeur n'est modifiée.
 */
export function decalagesEtiquettes(
  yMqPx: number,
  yFmPx: number,
  ecartMinPx: number,
): { mq: number; fm: number } {
  const ecart = Math.abs(yMqPx - yFmPx);
  if (ecart >= ecartMinPx) return { mq: 0, fm: 0 };
  const pousse = (ecartMinPx - ecart) / 2;
  const mqEstHaut = yMqPx <= yFmPx;
  return mqEstHaut ? { mq: -pousse, fm: pousse } : { mq: pousse, fm: -pousse };
}

/** Un poste, deux évolutions, échelle fournie par l'appelant (commune aux quatre). */
export function graphePetit(
  lignes: {
    periode: Date;
    evolution_martinique_pct: number;
    evolution_france_metropolitaine_pct: number;
  }[],
  domaine: { min: number; max: number },
  largeurConteneur: number,
  marqueurs: MarqueurContexte[],
): SVGSVGElement | HTMLElement {
  const disposition = calculerDispositionGraphe(largeurConteneur);
  const derniere = lignes[lignes.length - 1];
  const libelleMq = `Martinique\n${formaterPct(derniere.evolution_martinique_pct)} %`;
  const libelleFm = `Hexagone\n${formaterPct(derniere.evolution_france_metropolitaine_pct)} %`;
  const ancre = lignes[0].periode;
  const hauteur = disposition.etroit ? 240 : 280;
  const margeHaut = 16;
  const margeBas = 36;
  const pxParPoint = (hauteur - margeHaut - margeBas) / (domaine.max - domaine.min);
  const decalages = decalagesEtiquettes(
    -derniere.evolution_martinique_pct * pxParPoint,
    -derniere.evolution_france_metropolitaine_pct * pxParPoint,
    30,
  );

  return Plot.plot({
    style: { fontFamily: FAMILLE_CHIFFRES },
    width: disposition.largeur,
    height: hauteur,
    marginTop: margeHaut,
    marginRight: 88,
    marginBottom: margeBas,
    marginLeft: disposition.etroit ? 36 : 44,
    x: {
      label: null,
      ticks: [ancre, derniere.periode],
      tickFormat: (d: Date) => formaterMoisAxe(d, true),
    },
    y: {
      label: null,
      grid: true,
      domain: [domaine.min, domaine.max],
      nice: false,
      tickFormat: (d: number) => String(d),
    },
    marks: [
      Plot.ruleY([0], { stroke: "var(--brume)", strokeWidth: 1 }),
      Plot.ruleX([ancre], {
        stroke: COULEUR_JALON,
        strokeDasharray: "1.5 4",
        strokeWidth: 1,
      }),
      Plot.lineY(lignes, {
        x: "periode",
        y: "evolution_martinique_pct",
        stroke: COULEUR_MQ,
        strokeWidth: 2.5,
      }),
      Plot.lineY(lignes, {
        x: "periode",
        y: "evolution_france_metropolitaine_pct",
        stroke: COULEUR_FM,
        strokeWidth: 1.5,
      }),
      Plot.dot(marqueurs, {
        x: "date",
        y: domaine.min,
        fill: COULEUR_JALON,
        r: 3.5,
        title: (d: MarqueurContexte) =>
          `${formaterMoisUtc(d.date)} — ${d.titre} Contexte, pas une cause.`,
      }),
      Plot.text(
        [{ periode: derniere.periode, y: derniere.evolution_martinique_pct, texte: libelleMq }],
        {
          x: "periode",
          y: "y",
          text: "texte",
          textAnchor: "start",
          dx: 8,
          dy: decalages.mq,
          fill: COULEUR_MQ,
          fontSize: 11,
          fontWeight: "600",
        },
      ),
      Plot.text(
        [{
          periode: derniere.periode,
          y: derniere.evolution_france_metropolitaine_pct,
          texte: libelleFm,
        }],
        {
          x: "periode",
          y: "y",
          text: "texte",
          textAnchor: "start",
          dx: 8,
          dy: decalages.fm,
          fill: COULEUR_FM,
          fontSize: 11,
          fontWeight: "600",
        },
      ),
    ],
  });
}
