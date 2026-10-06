/**
 * Calculs de l'écran : titre, barres à la même date, emplacements du récit.
 * Aucun niveau d'indice. Aucun chiffre écrit en dur.
 */
import { formaterPct } from "./calculs.ts";
import type { LigneDifferentiel } from "./types.ts";
import { formaterMoisUtc } from "./validation.ts";

/** Seuil provisoire, en points, entre « creusé » et « n'a presque pas bougé ». */
export const SEUIL_ETAT_ECART_POINTS = 2;

/** Sous ce seuil, en points, les deux territoires ont augmenté à peu près autant. */
export const SEUIL_AUTANT_POINTS = 1;

export type EtatEcart = "creuse" | "resserre" | "stable";

export type CleBarre = "hexagone" | "martinique_2022" | "martinique_aujourdhui";

export interface BarreMemeDate {
  cle: CleBarre;
  euros: number;
  nature: "reference" | "mesure" | "estimation";
  eurosPleins: number;
  eurosHachures: number;
}

export interface EcartAnnuel {
  annee: number;
  ecartPct: number;
  nature: "mesure" | "estimation";
  mois: string;
}

export function etatEcart(variationPoints: number): EtatEcart {
  if (!Number.isFinite(variationPoints)) {
    throw new Error("Variation d'écart absente.");
  }
  if (variationPoints > SEUIL_ETAT_ECART_POINTS) return "creuse";
  if (variationPoints < -SEUIL_ETAT_ECART_POINTS) return "resserre";
  return "stable";
}

const MODELES_TITRE: Record<EtatEcart, string> = {
  creuse:
    "Depuis 2022, l'écart s'est creusé : les courses alimentaires coûtent environ {ecart_fin_entier} de plus en Martinique que dans l'Hexagone.",
  resserre:
    "Depuis 2022, l'écart s'est resserré : les courses alimentaires coûtent environ {ecart_fin_entier} de plus en Martinique que dans l'Hexagone.",
  stable:
    "Depuis 2022, l'écart n'a presque pas bougé : les courses alimentaires coûtent environ {ecart_fin_entier} de plus en Martinique que dans l'Hexagone.",
};

export function titreReponse(etat: EtatEcart, ecartFinEntier: string): string {
  return resoudreEmplacements(MODELES_TITRE[etat], {
    ecart_fin_entier: ecartFinEntier,
  });
}

/** Écart estimé arrondi à l'unité, avec le signe typographique et le symbole %. */
export function formaterEcartEntier(ecartPct: number): string {
  if (!Number.isFinite(ecartPct)) {
    throw new Error("Écart absent pour l'arrondi.");
  }
  const entier = Math.round(ecartPct);
  const signe = entier < 0 ? "−" : "";
  return `${signe}${Math.abs(entier)} %`;
}

export function libelleEstimation(dernierMoisCommun: string): string {
  const mois = dernierMoisCommun.trim();
  if (!mois) throw new Error("Dernier mois commun absent.");
  return `Estimation à fin ${mois}, dernier mois publié pour les deux territoires.`;
}

export function phrasePicEstime(
  ecartPicPct: number,
  moisPic: string,
  ecartActuelPct: number,
  moisActuel: string,
): string {
  return (
    `Selon l'estimation, l'écart a atteint environ ${formaterPct(ecartPicPct)} % en ${moisPic} ` +
    `avant de revenir vers ${formaterPct(ecartActuelPct)} % en ${moisActuel}.`
  );
}

/**
 * Constat d'un poste. « À peu près autant » si la valeur absolue du
 * différentiel est strictement inférieure à 1 point.
 */
export function phraseConstat(
  sujet: string,
  differentielPoints: number,
  evolutionMartinique: string,
  evolutionHexagone: string,
): string {
  if (!Number.isFinite(differentielPoints)) {
    throw new Error("Différentiel d'évolution absent.");
  }
  if (sujet.trim() === "") throw new Error("Sujet du constat absent.");
  if (Math.abs(differentielPoints) < SEUIL_AUTANT_POINTS) {
    return (
      `Depuis avril 2022, ${sujet} ont augmenté à peu près autant ` +
      `en Martinique (${evolutionMartinique} %) et dans l'Hexagone (${evolutionHexagone} %).`
    );
  }
  if (differentielPoints > 0) {
    return (
      `Depuis avril 2022, ${sujet} ont plus augmenté en Martinique ` +
      `(${evolutionMartinique} %) que dans l'Hexagone (${evolutionHexagone} %).`
    );
  }
  return (
    `Depuis avril 2022, ${sujet} ont moins augmenté en Martinique ` +
    `(${evolutionMartinique} %) que dans l'Hexagone (${evolutionHexagone} %).`
  );
}

/** Pour 100 € dans l'Hexagone à la même date. Ce n'est pas un indice. */
export function eurosPourCentHexagone(ecartPct: number): number {
  if (!Number.isFinite(ecartPct)) {
    throw new Error("Écart absent pour la barre.");
  }
  return 100 * (1 + ecartPct / 100);
}

/**
 * Trois barres ramenées à 100 € dans l'Hexagone à la date de chacune.
 * Les facteurs d'indice des lignes sont ignorés : les utiliser afficherait
 * l'inflation comme un creusement.
 */
export function barresMemeDate(
  ancre: LigneDifferentiel,
  actuelle: LigneDifferentiel,
): BarreMemeDate[] {
  if (ancre.ecart_ecsp_2022_pct === null || actuelle.ecart_prix_estime_pct === null) {
    throw new Error("Barres impossibles : écart ECSP ou estimation absente.");
  }
  const mesure = eurosPourCentHexagone(ancre.ecart_ecsp_2022_pct);
  const estime = eurosPourCentHexagone(actuelle.ecart_prix_estime_pct);
  const hachures = estime > mesure ? estime - mesure : estime;
  const pleins = estime > mesure ? mesure : 0;
  return [
    {
      cle: "hexagone",
      euros: 100,
      nature: "reference",
      eurosPleins: 100,
      eurosHachures: 0,
    },
    {
      cle: "martinique_2022",
      euros: mesure,
      nature: "mesure",
      eurosPleins: mesure,
      eurosHachures: 0,
    },
    {
      cle: "martinique_aujourdhui",
      euros: estime,
      nature: "estimation",
      eurosPleins: pleins,
      eurosHachures: hachures,
    },
  ];
}

/**
 * Une barre par année. 2022 est la mesure ECSP (mars-avril), en plein.
 * Les années suivantes prennent le dernier mois de l'année, en estimation.
 * Le dernier mois de 2022 n'est pas la mesure : il ne remplace pas l'ancre.
 */
export function ecartsAnnuels(lignes: LigneDifferentiel[]): EcartAnnuel[] {
  const mesure = lignes.find((ligne) => ligne.nature_ecart === "mesure_ecsp_2022");
  if (!mesure || mesure.ecart_prix_estime_pct === null) {
    throw new Error("Mesure ECSP 2022 absente des écarts annuels.");
  }
  const dernier = new Map<number, LigneDifferentiel>();
  for (const ligne of lignes) {
    if (ligne.nature_ecart === "mesure_ecsp_2022") continue;
    const annee = ligne.periode.getUTCFullYear();
    if (annee === mesure.periode.getUTCFullYear()) continue;
    const deja = dernier.get(annee);
    if (!deja || ligne.periode.getTime() > deja.periode.getTime()) {
      dernier.set(annee, ligne);
    }
  }
  const annees: EcartAnnuel[] = [
    {
      annee: mesure.periode.getUTCFullYear(),
      ecartPct: mesure.ecart_prix_estime_pct,
      nature: "mesure",
      mois: formaterMoisUtc(mesure.periode),
    },
  ];
  for (const [annee, ligne] of [...dernier.entries()].sort((a, b) => a[0] - b[0])) {
    if (ligne.ecart_prix_estime_pct === null || ligne.nature_ecart === null) {
      throw new Error(`Écart annuel absent pour ${annee}.`);
    }
    annees.push({
      annee,
      ecartPct: ligne.ecart_prix_estime_pct,
      nature: "estimation",
      mois: formaterMoisUtc(ligne.periode),
    });
  }
  return annees;
}

/** Min et max des barres annuelles estimées, pas des mois sans barre. */
export function phraseEstimationsAnnuelles(lignes: LigneDifferentiel[]): string {
  const estimations = ecartsAnnuels(lignes).filter((annee) => annee.nature === "estimation");
  if (estimations.length === 0) {
    throw new Error("Aucune estimation annuelle à résumer.");
  }
  const min = Math.min(...estimations.map((annee) => annee.ecartPct));
  const max = Math.max(...estimations.map((annee) => annee.ecartPct));
  return `Les estimations annuelles vont de ${formaterPct(min)} % à ${formaterPct(max)} %.`;
}

/** Évolution entre deux mois, à l'intérieur de chaque territoire. */
export function evolutionEntreMois(
  lignes: LigneDifferentiel[],
  debutAnnee: number,
  debutMois: number,
  finAnnee: number,
  finMois: number,
): { martinique: number; france: number } {
  const debut = exigerMois(lignes, debutAnnee, debutMois);
  const fin = exigerMois(lignes, finAnnee, finMois);
  return {
    martinique: (fin.facteur_martinique / debut.facteur_martinique - 1) * 100,
    france:
      (fin.facteur_france_metropolitaine / debut.facteur_france_metropolitaine - 1) *
      100,
  };
}

export function exigerMois(
  lignes: LigneDifferentiel[],
  annee: number,
  mois: number,
): LigneDifferentiel {
  const trouvee = lignes.find(
    (ligne) =>
      ligne.periode.getUTCFullYear() === annee &&
      ligne.periode.getUTCMonth() + 1 === mois,
  );
  if (!trouvee) {
    throw new Error(
      `Mois absent : ${annee}-${String(mois).padStart(2, "0")}. L'écran ne comble pas le trou.`,
    );
  }
  return trouvee;
}

const EMPLACEMENT = /\{([a-z0-9_]+)\}/g;

/** Remplace {nom}. Un nom absent ou vide fait échouer, jamais un blanc. */
export function resoudreEmplacements(
  texte: string,
  valeurs: Record<string, string>,
): string {
  const manquants: string[] = [];
  const resolu = texte.replace(EMPLACEMENT, (_tout, nom: string) => {
    const valeur = valeurs[nom];
    if (valeur === undefined || valeur.trim() === "") {
      manquants.push(nom);
      return "";
    }
    return valeur;
  });
  if (manquants.length > 0) {
    throw new Error(`Emplacement non résolu : ${manquants.join(", ")}.`);
  }
  if (resolu.includes("{") && resolu.includes("}")) {
    throw new Error("Emplacement non résolu après substitution.");
  }
  return resolu;
}

export function formaterEurosPanier(euros: number): string {
  return `${euros.toFixed(1).replace(".", ",")} €`;
}

export function formaterPointsPct(n: number): string {
  const signe = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${signe}${formaterPct(Math.abs(n))} %`;
}

/** Seuls ces deux postes sont prolongés après la mesure de 2022. */
export const POSTES_PROLONGES = ["alimentation", "ensemble"] as const;

export type PosteProlonge = (typeof POSTES_PROLONGES)[number];

/**
 * Dernière ligne d'un poste prolongé. Échoue si elle manque, si elle n'est pas
 * une estimation, ou si elle n'est pas au dernier mois commun.
 */
export function exigerEstimationPoste(
  lignes: LigneDifferentiel[],
  poste: string,
): LigneDifferentiel {
  if (!(POSTES_PROLONGES as readonly string[]).includes(poste)) {
    throw new Error(`Aucune barre estimée pour le poste ${poste}.`);
  }
  const duPoste = lignes
    .filter((ligne) => ligne.poste === poste)
    .sort((a, b) => a.periode.getTime() - b.periode.getTime());
  if (duPoste.length === 0) throw new Error(`Série absente : ${poste}.`);
  const fin = duPoste[duPoste.length - 1];
  if (
    fin.nature_ecart !== "estimation_a_partir_ecsp_2022" ||
    fin.ecart_prix_estime_pct === null
  ) {
    throw new Error(`Estimation absente ou non étiquetée : ${poste}.`);
  }
  if (fin.periode.getTime() !== fin.dernier_mois_commun.getTime()) {
    throw new Error(`L'estimation ${poste} n'est pas au dernier mois commun.`);
  }
  return fin;
}

/** Phrase de conclusion. Le salaire privé n'entre que s'il est négatif. */
export function phraseConclusion(
  ecartFin: number,
  ancre: number,
  salairePrivePct: number,
): string {
  if (
    !Number.isFinite(ecartFin) ||
    !Number.isFinite(ancre) ||
    !Number.isFinite(salairePrivePct)
  ) {
    throw new Error("Conclusion impossible : écart ou salaire absent.");
  }
  const premiere =
    ecartFin >= ancre
      ? "Depuis 2022, l'écart alimentaire estimé est revenu vers son niveau de départ, pas en dessous."
      : "Depuis 2022, l'écart alimentaire estimé est passé sous son niveau de départ.";
  const milieu =
    salairePrivePct < 0
      ? "Des prix plus élevés qu'en Hexagone, et des salaires du privé plus bas que la moyenne française, coïncident avec le sentiment d'une vie plus chère."
      : "Des prix plus élevés qu'en Hexagone coïncident avec le sentiment d'une vie plus chère.";
  return `${premiere} ${milieu} Ce n'est pas une preuve. Seule une nouvelle enquête de l'Insee pourra dire où en est vraiment le niveau.`;
}
