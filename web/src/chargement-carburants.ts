/**
 * Chargement du Parquet carburants via hyparquet.
 */
import { asyncBufferFromUrl, parquetReadObjects } from "hyparquet";
import { compressors } from "hyparquet-compressors";
import {
  type LigneCarburant,
  type TypeLigneCarburant,
} from "./types-carburants.ts";
import {
  validerColonnesCarburants,
  validerLignesCarburants,
} from "./validation-carburants.ts";

function urlParquetCarburants(): string {
  const base = import.meta.env.BASE_URL;
  return `${base}data/carburants.parquet`;
}

export async function chargerDonneesCarburants(): Promise<LigneCarburant[]> {
  const url = urlParquetCarburants();

  let buffer: Awaited<ReturnType<typeof asyncBufferFromUrl>>;
  try {
    buffer = await asyncBufferFromUrl({ url });
  } catch (cause) {
    throw new Error(`Impossible de charger ${url} : ${String(cause)}`, { cause });
  }

  const objets = await parquetReadObjects({ file: buffer, compressors });
  if (objets.length === 0) {
    throw new Error("Le fichier Parquet carburants est vide.");
  }

  const colonnes = Object.keys(objets[0] as Record<string, unknown>);
  validerColonnesCarburants(colonnes);

  const lignes: LigneCarburant[] = objets.map((obj) => {
    const r = obj as Record<string, unknown>;
    return {
      type_ligne: asTypeLigne(r["type_ligne"]),
      carburant: asString(r["carburant"]),
      libelle_carburant: asString(r["libelle_carburant"]),
      date_reference: asDate(r["date_reference"]),
      mois_complet: asBooleanOrNull(r["mois_complet"]),
      q10_eur_litre: asNumberOrNull(r["q10_eur_litre"]),
      q25_eur_litre: asNumberOrNull(r["q25_eur_litre"]),
      mediane_eur_litre: asNumberOrNull(r["mediane_eur_litre"]),
      q75_eur_litre: asNumberOrNull(r["q75_eur_litre"]),
      q90_eur_litre: asNumberOrNull(r["q90_eur_litre"]),
      nombre_stations: asNumberOrNull(r["nombre_stations"]),
      prix_max_mq_eur_litre: asNumberOrNull(r["prix_max_mq_eur_litre"]),
      fin_effet_exclusive: asDateOrNull(r["fin_effet_exclusive"]),
      reference_acte: asStringOrNull(r["reference_acte"]),
      url_source_primaire: asStringOrNull(r["url_source_primaire"]),
      collecte_utc_nationale: asDateOrNull(r["collecte_utc_nationale"]),
    };
  });

  validerLignesCarburants(lignes);
  return lignes;
}

function asTypeLigne(v: unknown): TypeLigneCarburant {
  const texte = asString(v);
  if (texte === "distribution_metropole" || texte === "plafond_martinique") {
    return texte;
  }
  throw new Error(`type_ligne inconnu : ${texte}`);
}

function asDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (typeof v === "number") return new Date(v);
  if (typeof v === "string") return new Date(v);
  throw new Error(`Impossible de convertir en date : ${String(v)}`);
}

function asDateOrNull(v: unknown): Date | null {
  if (v === null || v === undefined) return null;
  return asDate(v);
}

function asString(v: unknown): string {
  if (v === null || v === undefined) {
    throw new Error("Chaîne attendue, reçu null.");
  }
  return String(v);
}

function asStringOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  return String(v);
}

function asNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) {
    throw new Error(`Nombre invalide : ${String(v)}`);
  }
  return n;
}

function asBooleanOrNull(v: unknown): boolean | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "boolean") return v;
  throw new Error(`Booléen attendu : ${String(v)}`);
}
