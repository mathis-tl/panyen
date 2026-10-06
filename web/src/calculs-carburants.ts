/**
 * Calculs d'affichage carburants — aucun DOM, aucun réseau.
 */
import type { LigneCarburant, ProduitNonComparable } from "./types-carburants.ts";
import { formaterMoisUtc } from "./validation-carburants.ts";

export interface MoisDistribution {
  date: Date;
  moisComplet: boolean;
  q10: number;
  q25: number;
  mediane: number;
  q75: number;
  q90: number;
  nombreStations: number;
  collecteUtc: Date;
}

export interface SegmentPlafond {
  debut: Date;
  finExclusive: Date | null;
  prixMax: number;
  referenceActe: string;
  urlSource: string;
}

export interface ResumeCarburants {
  carburant: string;
  libelleCarburant: string;
  distributions: MoisDistribution[];
  plafonds: SegmentPlafond[];
  periodeDebut: Date;
  periodeFin: Date;
  dernierMoisIncomplet: boolean;
  collecteUtc: Date;
  phrase: string;
  produitsNonComparables: ProduitNonComparable[];
}

const PRODUITS_NON_COMPARABLES: ProduitNonComparable[] = [
  {
    carburantMq: "super_sans_plomb",
    libelleMq: "Supercarburant sans plomb",
    raison:
      "Le flux national distingue SP95, SP98 et E10 ; les arrêtés martiniquais ne nomment qu'un « supercarburant sans plomb » sans grade officiellement équivalent. Aucun proxy n'est tracé.",
  },
];

export function listerCarburantsComparables(lignes: LigneCarburant[]): string[] {
  const ids = new Set<string>();
  for (const ligne of lignes) {
    if (ligne.type_ligne === "distribution_metropole") {
      ids.add(ligne.carburant);
    }
  }
  return [...ids].sort();
}

export function calculerResumeCarburants(
  lignes: LigneCarburant[],
  carburant: string,
): ResumeCarburants {
  const distributions = lignes
    .filter(
      (l) =>
        l.type_ligne === "distribution_metropole" && l.carburant === carburant,
    )
    .map(
      (l): MoisDistribution => ({
        date: l.date_reference,
        moisComplet: l.mois_complet ?? true,
        q10: l.q10_eur_litre as number,
        q25: l.q25_eur_litre as number,
        mediane: l.mediane_eur_litre as number,
        q75: l.q75_eur_litre as number,
        q90: l.q90_eur_litre as number,
        nombreStations: l.nombre_stations as number,
        collecteUtc: l.collecte_utc_nationale as Date,
      }),
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (distributions.length === 0) {
    throw new Error(`Aucune distribution pour le carburant ${carburant}.`);
  }

  const plafonds = lignes
    .filter(
      (l) =>
        l.type_ligne === "plafond_martinique" &&
        (l.carburant === carburant ||
          l.carburant.toLowerCase() === carburant.toLowerCase()),
    )
    .map(
      (l): SegmentPlafond => ({
        debut: l.date_reference,
        finExclusive: l.fin_effet_exclusive,
        prixMax: l.prix_max_mq_eur_litre as number,
        referenceActe: l.reference_acte as string,
        urlSource: l.url_source_primaire as string,
      }),
    )
    .sort((a, b) => a.debut.getTime() - b.debut.getTime());

  const libelle =
    distributions[0]?.collecteUtc &&
    lignes.find(
      (l) =>
        l.type_ligne === "distribution_metropole" && l.carburant === carburant,
    )?.libelle_carburant;

  const dernier = distributions[distributions.length - 1];
  const dernierMoisIncomplet = !dernier.moisComplet;

  const phrase = dernierMoisIncomplet
    ? `Distribution des stations de l'Hexagone pour le ${libelle ?? carburant}, par rapport au plafond réglementaire martiniquais — dernier mois incomplet (${formaterMoisUtc(dernier.date)}).`
    : `Distribution des stations de l'Hexagone pour le ${libelle ?? carburant}, par rapport au plafond réglementaire martiniquais depuis ${formaterMoisUtc(distributions[0].date)}.`;

  return {
    carburant,
    libelleCarburant: libelle ?? carburant,
    distributions,
    plafonds,
    periodeDebut: distributions[0].date,
    periodeFin: dernier.date,
    dernierMoisIncomplet,
    collecteUtc: dernier.collecteUtc,
    phrase,
    produitsNonComparables: PRODUITS_NON_COMPARABLES,
  };
}

export function formaterEurosLitre(valeur: number): string {
  return `${valeur.toFixed(2).replace(".", ",")} €/L`;
}

export function titreCarburants(carburant: string): string {
  return `panyen — carburants ${carburant}, Hexagone / Martinique`;
}
