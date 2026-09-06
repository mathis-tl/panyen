/**
 * Chargement et parsing du Parquet via hyparquet.
 */
import { asyncBufferFromUrl, parquetReadObjects } from "hyparquet";
import { compressors } from "hyparquet-compressors";
import { type LigneDifferentiel, type NatureEcart } from "./types.ts";
import { validerColonnes, validerLignes } from "./validation.ts";

function urlParquet(): string {
  const base = import.meta.env.BASE_URL;
  return `${base}data/differentiel_alimentation.parquet`;
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

  // Valider les colonnes à partir du premier objet
  const colonnes = Object.keys(objets[0] as Record<string, unknown>);
  validerColonnes(colonnes);

  // Typer les lignes
  const lignes: LigneDifferentiel[] = objets.map((obj) => {
    const r = obj as Record<string, unknown>;
    return {
      periode: asDate(r["periode"]),
      dernier_mois_commun: asDate(r["dernier_mois_commun"]),
      poste: String(r["poste"]),
      fichier_source: String(r["fichier_source"]),
      collecte_utc: asDate(r["collecte_utc"]),
      idbank_martinique: String(r["idbank_martinique"]),
      idbank_france_metropolitaine: String(r["idbank_france_metropolitaine"]),
      facteur_martinique: Number(r["facteur_martinique"]),
      facteur_france_metropolitaine: Number(r["facteur_france_metropolitaine"]),
      evolution_martinique_pct: Number(r["evolution_martinique_pct"]),
      evolution_france_metropolitaine_pct: Number(r["evolution_france_metropolitaine_pct"]),
      differentiel_evolution_points: Number(r["differentiel_evolution_points"]),
      coefficient_ecart: Number(r["coefficient_ecart"]),
      ecart_ecsp_2022_pct: Number(r["ecart_ecsp_2022_pct"]),
      ecart_prix_estime_pct: Number(r["ecart_prix_estime_pct"]),
      source_ecsp: String(r["source_ecsp"]),
      nature_ecart: String(r["nature_ecart"]) as NatureEcart,
    };
  });

  validerLignes(lignes);
  return lignes;
}

/** Convertit une valeur Parquet (Date, number-timestamp, string) en Date UTC. */
function asDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (typeof v === "number") return new Date(v);
  if (typeof v === "string") return new Date(v);
  throw new Error(`Impossible de convertir en date : ${String(v)}`);
}

/** Type partiel pour asyncBufferFromUrl retour. */
type AsyncBuffer = Awaited<ReturnType<typeof asyncBufferFromUrl>>;
