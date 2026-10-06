/**
 * Calculs de l'écran : titre, barres à la même date, emplacements du récit.
 * Aucun niveau d'indice. Aucun chiffre écrit en dur.
 */
import { formaterEuros, formaterPct } from "./calculs.ts";
import type { LigneEvenement } from "./chargement-contexte.ts";
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

export interface ChiffresConclusion {
  evoAlimMq: number;
  evoAlimFm: number;
  ecartAlimFin: number;
  ancreAlim: number;
  eurosFm2022: number;
  eurosMq2022: number;
  eurosFmFin: number;
  eurosMqFin: number;
  evoEnsMq: number;
  evoEnsFm: number;
  ecartEns2022: number;
  ecartEnsFin: number;
  salairePrivePct: number;
  moisMobilisation: string;
}

export interface TexteConclusion {
  alimentation: string;
  illustration: string;
  ensemble: string;
  analyseAvantLien: string;
  libelleLien: string;
  analyseApresLien: string;
}

const TITRE_MOBILISATION = "Début de la mobilisation publique contre la vie chère";

/** La ligne du 1er septembre 2024, grain mois. Toute autre mobilisation est ignorée. */
export function exigerMobilisation(evenements: LigneEvenement[]): { mois: string; url: string } {
  const trouves = evenements.filter((evenement) => {
    const date = evenement.date_evenement;
    return (
      date.getUTCFullYear() === 2024 &&
      date.getUTCMonth() === 8 &&
      date.getUTCDate() === 1 &&
      evenement.titre === TITRE_MOBILISATION &&
      evenement.precision_date === "mois"
    );
  });
  if (trouves.length !== 1) {
    throw new Error("Mobilisation de septembre 2024 absente.");
  }
  const trouve = trouves[0];
  if (trouve.url_source.trim() === "") {
    throw new Error("Mobilisation de septembre 2024 sans lien.");
  }
  return { mois: formaterMoisUtc(trouve.date_evenement), url: trouve.url_source };
}

function exigerNombre(valeur: number, nom: string): void {
  if (!Number.isFinite(valeur)) {
    throw new Error(`Conclusion impossible : ${nom} absent.`);
  }
}

function pct(valeur: number): string {
  return `${formaterPct(valeur)} %`;
}

function euros(valeur: number): string {
  return formaterEuros(valeur);
}

/**
 * Quatre paragraphes. Les euros sont déjà ceux du panier illustratif.
 * Le sens de l'écart « ensemble » doit suivre les deux évolutions.
 */
export function paragraphesConclusion(chiffres: ChiffresConclusion): TexteConclusion {
  const champs: Array<[number, string]> = [
    [chiffres.evoAlimMq, "évolution alimentaire Martinique"],
    [chiffres.evoAlimFm, "évolution alimentaire Hexagone"],
    [chiffres.ecartAlimFin, "écart alimentaire"],
    [chiffres.ancreAlim, "ancre alimentaire"],
    [chiffres.eurosFm2022, "euros Hexagone 2022"],
    [chiffres.eurosMq2022, "euros Martinique 2022"],
    [chiffres.eurosFmFin, "euros Hexagone fin"],
    [chiffres.eurosMqFin, "euros Martinique fin"],
    [chiffres.evoEnsMq, "évolution ensemble Martinique"],
    [chiffres.evoEnsFm, "évolution ensemble Hexagone"],
    [chiffres.ecartEns2022, "écart ensemble 2022"],
    [chiffres.ecartEnsFin, "écart ensemble fin"],
    [chiffres.salairePrivePct, "salaire privé"],
  ];
  for (const [valeur, nom] of champs) exigerNombre(valeur, nom);
  if (chiffres.moisMobilisation.trim() === "") {
    throw new Error("Conclusion impossible : mois de mobilisation absent.");
  }

  const sensEvolution = Math.sign(chiffres.evoEnsMq - chiffres.evoEnsFm);
  const sensEcart = Math.sign(chiffres.ecartEnsFin - chiffres.ecartEns2022);
  if (sensEvolution !== sensEcart) {
    throw new Error("Conclusion impossible : l'écart ensemble contredit les évolutions.");
  }

  const alimentation =
    `Depuis avril 2022, les prix alimentaires ont augmenté de ${pct(chiffres.evoAlimMq)} en Martinique et de ${pct(chiffres.evoAlimFm)} dans l'Hexagone. ` +
    `L'écart estimé est de ${pct(chiffres.ecartAlimFin)}, contre ${pct(chiffres.ancreAlim)} mesurés en 2022. ` +
    (chiffres.ecartAlimFin >= chiffres.ancreAlim
      ? "Il n'est pas passé sous la mesure de 2022."
      : "Il est passé sous la mesure de 2022.");

  const illustration =
    `Ces pourcentages s'appliquent à des prix plus hauts. Pour ${euros(chiffres.eurosFm2022)} dans l'Hexagone en 2022, l'illustration donne ${euros(chiffres.eurosMq2022)} en Martinique ; au dernier mois, ${euros(chiffres.eurosFmFin)} dans l'Hexagone et ${euros(chiffres.eurosMqFin)} en Martinique, soit ${euros(chiffres.eurosMqFin - chiffres.eurosFmFin)} d'écart au lieu de ${euros(chiffres.eurosMq2022 - chiffres.eurosFm2022)}. Illustration arithmétique, pas une mesure.`;

  const mouvements =
    chiffres.evoEnsMq > 0 && chiffres.evoEnsFm > 0
      ? `Les prix ont augmenté des deux côtés, de ${pct(chiffres.evoEnsMq)} en Martinique et de ${pct(chiffres.evoEnsFm)} dans l'Hexagone. `
      : `Les évolutions de l'ensemble sont de ${pct(chiffres.evoEnsMq)} en Martinique et de ${pct(chiffres.evoEnsFm)} dans l'Hexagone. `;
  const suite =
    sensEvolution < 0
      ? chiffres.evoEnsMq > 0
        ? "L'écart se resserre parce que les prix ont davantage monté dans l'Hexagone. Ils n'ont pas baissé en Martinique."
        : "L'écart se resserre parce que les prix ont davantage monté dans l'Hexagone."
      : sensEvolution > 0
        ? "L'écart se creuse parce que les prix ont davantage monté en Martinique."
        : "L'écart estimé ne bouge pas : les deux évolutions sont égales.";
  const ensemble =
    `${mouvements}Pour l'ensemble des produits, l'écart estimé passe de ${pct(chiffres.ecartEns2022)} à ${pct(chiffres.ecartEnsFin)}. ${suite}`;

  const salaire =
    chiffres.salairePrivePct < 0
      ? `Les salaires du privé en Martinique sont de ${pct(Math.abs(chiffres.salairePrivePct))} sous la moyenne nationale. `
      : "";
  const analyseAvantLien =
    `Notre analyse : un écart alimentaire estimé de ${pct(chiffres.ecartAlimFin)} reste un écart de prix important. ${salaire}` +
    `Ces chiffres ne mesurent pas le pouvoir d'achat au fil du temps. Ils sont cohérents avec la mobilisation de `;
  const analyseApresLien =
    ` contre la vie chère. Ce site ne mesure pas l'effet des mesures publiques. L'évolution de l'écart ne prouve ni qu'elles ont fonctionné, ni qu'elles ont échoué. Seule une nouvelle enquête de l'Insee dira où en est le niveau.`;

  return {
    alimentation,
    illustration,
    ensemble,
    analyseAvantLien,
    libelleLien: chiffres.moisMobilisation,
    analyseApresLien,
  };
}
