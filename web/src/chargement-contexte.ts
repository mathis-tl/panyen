/**
 * Chargement des Parquet de contexte (niveaux ECSP, revenus, événements).
 * Une colonne ou une valeur absente fait échouer, elle ne se comble pas.
 */
import { asyncBufferFromUrl, parquetReadObjects } from "hyparquet";
import { compressors } from "hyparquet-compressors";

export interface LigneNiveau {
  annee_enquete: number;
  poste: string;
  ecart_fisher_pct: number;
  precision_pct: number;
  source_url: string;
  consulte_le: string;
  remarque: string;
}

export interface LigneFormule {
  annee_enquete: number;
  formule: string;
  ecart_pct: number;
  source_url: string;
  consulte_le: string;
  remarque: string;
}

export interface LigneRevenu {
  annee: number;
  indicateur: string;
  ecart_moyenne_nationale_pct: number;
  source_url: string;
  consulte_le: string;
  champ: string;
}

export interface LigneEvenement {
  date_evenement: Date;
  precision_date: string;
  titre: string;
  type_evenement: string;
  postes_concernes: string;
  url_source: string;
  type_source: string;
  consulte_le: string;
}

export interface ContexteCharge {
  niveaux: LigneNiveau[];
  formules: LigneFormule[];
  revenus: LigneRevenu[];
  evenements: LigneEvenement[];
}

async function lire(fichier: string): Promise<Record<string, unknown>[]> {
  const url = `${import.meta.env.BASE_URL}data/${fichier}`;
  let buffer;
  try {
    buffer = await asyncBufferFromUrl({ url });
  } catch (cause) {
    throw new Error(`Impossible de charger ${url} : ${String(cause)}`, { cause });
  }
  const objets = await parquetReadObjects({ file: buffer, compressors });
  if (objets.length === 0) throw new Error(`Parquet vide : ${fichier}.`);
  return objets as Record<string, unknown>[];
}

function exigerColonnes(ligne: Record<string, unknown>, colonnes: string[], fichier: string): void {
  for (const colonne of colonnes) {
    if (!(colonne in ligne)) {
      throw new Error(`Colonne absente dans ${fichier} : ${colonne}.`);
    }
  }
}

function nombre(valeur: unknown, colonne: string): number {
  if (typeof valeur === "number" && Number.isFinite(valeur)) return valeur;
  if (typeof valeur === "bigint") return Number(valeur);
  throw new Error(`Nombre absent : ${colonne}.`);
}

function texte(valeur: unknown, colonne: string): string {
  if (typeof valeur === "string" && valeur.trim() !== "") return valeur;
  throw new Error(`Texte absent : ${colonne}.`);
}

function dateIso(valeur: unknown, colonne: string): string {
  if (valeur instanceof Date) return valeur.toISOString().slice(0, 10);
  if (typeof valeur === "string" && valeur.trim() !== "") return valeur.slice(0, 10);
  throw new Error(`Date absente : ${colonne}.`);
}

function date(valeur: unknown, colonne: string): Date {
  if (valeur instanceof Date) return valeur;
  if (typeof valeur === "string" || typeof valeur === "number") return new Date(valeur);
  throw new Error(`Date absente : ${colonne}.`);
}

export async function chargerContexte(): Promise<ContexteCharge> {
  const [niveauxBruts, formulesBrutes, revenusBruts, evenementsBruts] = await Promise.all([
    lire("ecsp_niveaux.parquet"),
    lire("ecsp_alimentation_formules.parquet"),
    lire("revenus_ecart_national.parquet"),
    lire("evenements_contexte.parquet"),
  ]);

  const niveaux = niveauxBruts.map((ligne) => {
    exigerColonnes(
      ligne,
      ["annee_enquete", "poste", "ecart_fisher_pct", "precision_pct", "source_url", "consulte_le", "remarque"],
      "ecsp_niveaux.parquet",
    );
    return {
      annee_enquete: nombre(ligne["annee_enquete"], "annee_enquete"),
      poste: texte(ligne["poste"], "poste"),
      ecart_fisher_pct: nombre(ligne["ecart_fisher_pct"], "ecart_fisher_pct"),
      precision_pct: nombre(ligne["precision_pct"], "precision_pct"),
      source_url: texte(ligne["source_url"], "source_url"),
      consulte_le: dateIso(ligne["consulte_le"], "consulte_le"),
      remarque: texte(ligne["remarque"], "remarque"),
    };
  });

  const formules = formulesBrutes.map((ligne) => {
    exigerColonnes(
      ligne,
      ["annee_enquete", "formule", "ecart_pct", "source_url", "consulte_le", "remarque"],
      "ecsp_alimentation_formules.parquet",
    );
    return {
      annee_enquete: nombre(ligne["annee_enquete"], "annee_enquete"),
      formule: texte(ligne["formule"], "formule"),
      ecart_pct: nombre(ligne["ecart_pct"], "ecart_pct"),
      source_url: texte(ligne["source_url"], "source_url"),
      consulte_le: dateIso(ligne["consulte_le"], "consulte_le"),
      remarque: texte(ligne["remarque"], "remarque"),
    };
  });

  const revenus = revenusBruts.map((ligne) => {
    exigerColonnes(
      ligne,
      ["annee", "indicateur", "ecart_moyenne_nationale_pct", "source_url", "consulte_le", "champ"],
      "revenus_ecart_national.parquet",
    );
    return {
      annee: nombre(ligne["annee"], "annee"),
      indicateur: texte(ligne["indicateur"], "indicateur"),
      ecart_moyenne_nationale_pct: nombre(
        ligne["ecart_moyenne_nationale_pct"],
        "ecart_moyenne_nationale_pct",
      ),
      source_url: texte(ligne["source_url"], "source_url"),
      consulte_le: dateIso(ligne["consulte_le"], "consulte_le"),
      champ: texte(ligne["champ"], "champ"),
    };
  });

  const evenements = evenementsBruts.map((ligne) => {
    exigerColonnes(
      ligne,
      ["date_evenement", "precision_date", "titre", "type_evenement", "postes_concernes", "url_source", "type_source", "consulte_le"],
      "evenements_contexte.parquet",
    );
    return {
      date_evenement: date(ligne["date_evenement"], "date_evenement"),
      precision_date: texte(ligne["precision_date"], "precision_date"),
      titre: texte(ligne["titre"], "titre"),
      type_evenement: texte(ligne["type_evenement"], "type_evenement"),
      postes_concernes: texte(ligne["postes_concernes"], "postes_concernes"),
      url_source: texte(ligne["url_source"], "url_source"),
      type_source: texte(ligne["type_source"], "type_source"),
      consulte_le: dateIso(ligne["consulte_le"], "consulte_le"),
    };
  });

  return { niveaux, formules, revenus, evenements };
}
