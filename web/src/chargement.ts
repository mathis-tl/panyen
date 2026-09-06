/**
 * Chargement et parsing du Parquet via hyparquet.
 */
import { asyncBufferFromUrl, parquetReadObjects } from "hyparquet";
import { compressors } from "hyparquet-compressors";
import {
  type CodePoste,
  type LigneDifferentiel,
  type NatureEcart,
  POSTES_ATTENDUS,
} from "./types.ts";
import { validerColonnes, validerLignes } from "./validation.ts";

function urlParquet(): string {
  const base = import.meta.env.BASE_URL;
  return `${base}data/differentiel_ipc.parquet`;
}

/**
 * Charge et valide le Parquet. Lève en cas d'erreur réseau ou de données invalides.
 */
export async function chargerDonnees(): Promise<LigneDifferentiel[]> {
  const url = urlParquet();

  let buffer: AsyncBuffer;
  try {
    buffer = await asyncBufferFromUrl({ url });
  } catch (cause) {
    throw new Error(`Impossible de charger ${url} : ${String(cause)}`, { cause });
  }

  const objets = await parquetReadObjects({ file: buffer, compressors });

  if (objets.length === 0) {
    throw new Error("Le fichier Parquet est vide.");
  }

  const colonnes = Object.keys(objets[0] as Record<string, unknown>);
  validerColonnes(colonnes);

  const lignes: LigneDifferentiel[] = objets.map((obj) => {
    const r = obj as Record<string, unknown>;
    return {
      periode: asDate(r["periode"]),
      dernier_mois_commun: asDate(r["dernier_mois_commun"]),
      poste: asPoste(r["poste"]),
      libelle_poste: asString(r["libelle_poste"]),
      fichier_source: asString(r["fichier_source"]),
      collecte_utc: asDate(r["collecte_utc"]),
      idbank_martinique: asString(r["idbank_martinique"]),
      idbank_france_metropolitaine: asString(r["idbank_france_metropolitaine"]),
      facteur_martinique: asNumber(r["facteur_martinique"]),
      facteur_france_metropolitaine: asNumber(r["facteur_france_metropolitaine"]),
      evolution_martinique_pct: asNumber(r["evolution_martinique_pct"]),
      evolution_france_metropolitaine_pct: asNumber(
        r["evolution_france_metropolitaine_pct"],
      ),
      differentiel_evolution_points: asNumber(r["differentiel_evolution_points"]),
      coefficient_ecart: asNumber(r["coefficient_ecart"]),
      ancre_ecsp_disponible: asBoolean(r["ancre_ecsp_disponible"]),
      ecart_ecsp_2022_pct: asNumberOrNull(r["ecart_ecsp_2022_pct"]),
      ecart_prix_estime_pct: asNumberOrNull(r["ecart_prix_estime_pct"]),
      source_ecsp: asStringOrNull(r["source_ecsp"]),
      nature_ecart: asNatureOrNull(r["nature_ecart"]),
    };
  });

  validerLignes(lignes);
  return lignes;
}

function asDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (typeof v === "number") return new Date(v);
  if (typeof v === "string") return new Date(v);
  throw new Error(`Impossible de convertir en date : ${String(v)}`);
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

function asNumber(v: unknown): number {
  if (v === null || v === undefined) {
    throw new Error("Nombre attendu, reçu null.");
  }
  const n = Number(v);
  if (!Number.isFinite(n)) {
    throw new Error(`Nombre invalide : ${String(v)}`);
  }
  return n;
}

function asNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) {
    throw new Error(`Nombre invalide : ${String(v)}`);
  }
  return n;
}

function asBoolean(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  throw new Error(`Booléen attendu : ${String(v)}`);
}

function asPoste(v: unknown): CodePoste {
  const texte = asString(v);
  if ((POSTES_ATTENDUS as readonly string[]).includes(texte)) {
    return texte as CodePoste;
  }
  throw new Error(`Poste inconnu : ${texte}`);
}

function asNatureOrNull(v: unknown): NatureEcart | null {
  if (v === null || v === undefined) return null;
  const texte = String(v);
  if (texte === "mesure_ecsp_2022" || texte === "estimation_a_partir_ecsp_2022") {
    return texte;
  }
  throw new Error(`nature_ecart inconnue : ${texte}`);
}

type AsyncBuffer = Awaited<ReturnType<typeof asyncBufferFromUrl>>;
