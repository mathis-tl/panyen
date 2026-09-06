/**
 * Graphe principal : deux évolutions cumulées depuis avril 2022.
 * Aucun niveau d'indice territorial. Aucun second graphe redondant.
 */
import * as Plot from "@observablehq/plot";
import type { ResumeEcran } from "./calculs.ts";
import { formaterPct } from "./calculs.ts";
import { formaterMoisUtc } from "./validation.ts";

const COULEUR_MQ = "#e63946";
const COULEUR_FM = "#457b9d";
const COULEUR_JALON = "#6b7280";

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
    franceMetropolitaine: `France métropolitaine\n${formaterPct(evoFm)} %`,
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
  const { lignes, minimumEstime, maximumEstime, actuelle } = resume;
  const disposition = calculerDispositionGraphe(largeurConteneur);

  const derniere = lignes[lignes.length - 1];
  const evoMq = derniere.evolution_martinique_pct;
  const evoFm = derniere.evolution_france_metropolitaine_pct;
  const maxEvo = Math.max(
    ...lignes.map((l) =>
      Math.max(l.evolution_martinique_pct, l.evolution_france_metropolitaine_pct),
    ),
    0,
  );
  const ymax = Math.max(maxEvo * 1.2, 5);

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

  const jalonsDates = jalonsRepereGraphe(
    minimumEstime.periode,
    maximumEstime.periode,
    actuelle.periode,
  );
  const jalonsLibelles = jalonsDates.filter((j) => j.label !== null);

  const ancrageFin = disposition.labelsALinterieur
    ? { textAnchor: "end" as const, dx: -6 }
    : { textAnchor: "start" as const, dx: 8 };

  return Plot.plot({
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
      domain: [0, ymax],
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
        strokeWidth: 2.5,
      }),
      Plot.ruleX(jalonsDates, {
        x: "periode",
        stroke: COULEUR_JALON,
        strokeDasharray: "3 3",
        strokeOpacity: 0.7,
      }),
      Plot.text(jalonsLibelles, {
        x: "periode",
        y: 0,
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
