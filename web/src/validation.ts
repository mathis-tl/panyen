/**
 * Validation pure du jeu de données lu depuis le Parquet.
 * Lève une erreur explicite pour chaque cas pathologique.
 */
import {
  COLONNES_ATTENDUES,
  POSTES_ATTENDUS,
  type CodePoste,
  type LigneDifferentiel,
  type NatureEcart,
} from "./types.ts";

export class ErreurValidation extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ErreurValidation";
  }
}

const NATURES_VALIDES = new Set<NatureEcart>([
  "mesure_ecsp_2022",
  "estimation_a_partir_ecsp_2022",
]);

/** Valide les colonnes brutes avant le typage. */
export function validerColonnes(colonnes: string[]): void {
  const attendu = COLONNES_ATTENDUES.join(",");
  const recu = colonnes.join(",");
  if (attendu !== recu) {
    throw new ErreurValidation(
      `Colonnes attendues : ${attendu}\nColonnes reçues : ${recu}`,
    );
  }
}

/** Regroupe les lignes par poste, en conservant l'ordre d'apparition. */
export function regrouperParPoste(
  lignes: LigneDifferentiel[],
): Map<CodePoste, LigneDifferentiel[]> {
  const groupes = new Map<CodePoste, LigneDifferentiel[]>();
  for (const ligne of lignes) {
    const liste = groupes.get(ligne.poste) ?? [];
    liste.push(ligne);
    groupes.set(ligne.poste, liste);
  }
  return groupes;
}

/** Valide le contenu des lignes typées (quatre postes). */
export function validerLignes(lignes: LigneDifferentiel[]): void {
  if (lignes.length === 0) {
    throw new ErreurValidation("Le fichier ne contient aucune ligne.");
  }

  const groupes = regrouperParPoste(lignes);
  for (const poste of POSTES_ATTENDUS) {
    if (!groupes.has(poste)) {
      throw new ErreurValidation(`Poste manquant : ${poste}.`);
    }
  }
  for (const poste of groupes.keys()) {
    if (!(POSTES_ATTENDUS as readonly string[]).includes(poste)) {
      throw new ErreurValidation(`Poste inattendu : ${poste}.`);
    }
  }

  let periodesReference: string | null = null;
  let dernierMoisCommun: number | null = null;

  for (const poste of POSTES_ATTENDUS) {
    const duPoste = groupes.get(poste)!;
    validerPeriodesPoste(poste, duPoste);
    validerEcspPoste(poste, duPoste);

    const clePeriodes = duPoste.map((l) => l.periode.getTime()).join(",");
    if (periodesReference === null) {
      periodesReference = clePeriodes;
    } else if (clePeriodes !== periodesReference) {
      throw new ErreurValidation(
        `Périodes désalignées pour le poste ${poste}.`,
      );
    }

    for (const ligne of duPoste) {
      const dmc = ligne.dernier_mois_commun.getTime();
      if (dernierMoisCommun === null) {
        dernierMoisCommun = dmc;
      } else if (dmc !== dernierMoisCommun) {
        throw new ErreurValidation(
          `dernier_mois_commun non unique (poste ${poste}).`,
        );
      }
    }
  }
}

function validerPeriodesPoste(poste: CodePoste, lignes: LigneDifferentiel[]): void {
  const periodes = lignes.map((l) => l.periode.getTime());
  for (let i = 1; i < periodes.length; i++) {
    if (periodes[i] <= periodes[i - 1]) {
      throw new ErreurValidation(
        `Périodes non strictement croissantes pour le poste ${poste} à l'index ${i}.`,
      );
    }
  }

  for (let i = 1; i < lignes.length; i++) {
    const precedente = lignes[i - 1].periode;
    const courante = lignes[i].periode;
    const moisAttendu = new Date(
      Date.UTC(precedente.getUTCFullYear(), precedente.getUTCMonth() + 1, 1),
    );
    if (courante.getTime() !== moisAttendu.getTime()) {
      throw new ErreurValidation(
        `Mois manquant pour le poste ${poste} entre ` +
          `${formaterMoisUtc(precedente)} et ${formaterMoisUtc(courante)}.`,
      );
    }
  }
}

function validerEcspPoste(poste: CodePoste, lignes: LigneDifferentiel[]): void {
  if (poste === "alimentation") {
    for (const ligne of lignes) {
      if (!ligne.ancre_ecsp_disponible) {
        throw new ErreurValidation(
          `Ancre ECSP manquante pour le poste ${poste}.`,
        );
      }
      if (
        ligne.ecart_ecsp_2022_pct === null ||
        ligne.ecart_prix_estime_pct === null ||
        ligne.source_ecsp === null ||
        ligne.nature_ecart === null
      ) {
        throw new ErreurValidation(
          `Champ ECSP nul sur le poste ${poste} alors que l'ancre est disponible.`,
        );
      }
      if (!NATURES_VALIDES.has(ligne.nature_ecart)) {
        throw new ErreurValidation(
          `Valeur inconnue pour nature_ecart (poste ${poste}) : « ${ligne.nature_ecart} ».`,
        );
      }
    }
    const mesures = lignes.filter((l) => l.nature_ecart === "mesure_ecsp_2022");
    if (mesures.length !== 1) {
      throw new ErreurValidation(
        `Attendu exactement 1 ligne mesure_ecsp_2022 pour le poste ${poste}, ` +
          `trouvé ${mesures.length}.`,
      );
    }
    return;
  }

  for (const ligne of lignes) {
    if (ligne.ancre_ecsp_disponible) {
      throw new ErreurValidation(
        `Ancre ECSP inattendue pour le poste ${poste}.`,
      );
    }
    if (
      ligne.ecart_ecsp_2022_pct !== null ||
      ligne.ecart_prix_estime_pct !== null ||
      ligne.source_ecsp !== null ||
      ligne.nature_ecart !== null
    ) {
      throw new ErreurValidation(
        `Champ ECSP non nul sur le poste ${poste} sans ancre.`,
      );
    }
  }
}

/** Formate un Date UTC en « mois année » français. */
export function formaterMoisUtc(date: Date): string {
  const mois = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ];
  return `${mois[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}
