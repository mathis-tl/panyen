/**
 * Récit validé. Les [Mesuré] sont des emplacements remplis depuis les Parquet.
 * Un emplacement manquant fait échouer l'appel.
 */
import {
  calculerPanierIllustratif,
  formaterEuros,
  formaterPct,
  selectionnerJalons,
} from "./calculs.ts";
import {
  ecartsAnnuels,
  evolutionEntreMois,
  exigerMois,
  formaterPointsPct,
  phrasePicEstime,
  resoudreEmplacements,
} from "./calculs-ecran.ts";
import type { LigneFormule, LigneNiveau, LigneRevenu } from "./chargement-contexte.ts";
import type { LigneDifferentiel } from "./types.ts";
import { formaterMoisUtc } from "./validation.ts";

export interface BlocRecit {
  registre: "mesure" | "contexte" | "lecture";
  texte: string;
  sources: { href: string; libelle: string }[];
}

function pct(n: number): string {
  return `${formaterPct(n)} %`;
}

function exigerNiveau(niveaux: LigneNiveau[], annee: number, poste: string): LigneNiveau {
  const ligne = niveaux.find((n) => n.annee_enquete === annee && n.poste === poste);
  if (!ligne) throw new Error(`Niveau ECSP absent : ${poste}, ${annee}.`);
  return ligne;
}

function formaterPublie(ligne: LigneNiveau): string {
  const decimales = ligne.precision_pct < 1 ? 1 : 0;
  const corps = Math.abs(ligne.ecart_fisher_pct).toFixed(decimales).replace(".", ",");
  const signe = ligne.ecart_fisher_pct < 0 ? "−" : "";
  return `${signe}${corps} %`;
}

export function exigerFormule(formules: LigneFormule[], formule: string): LigneFormule {
  const ligne = formules.find((f) => f.annee_enquete === 2022 && f.formule === formule);
  if (!ligne) throw new Error(`Formule ECSP absente : ${formule}, 2022.`);
  return ligne;
}

export function pctPublie(ligne: LigneFormule): string {
  return `${Math.round(ligne.ecart_pct)} %`;
}

export function blocsRecit(
  lignesToutes: LigneDifferentiel[],
  niveaux: LigneNiveau[],
  revenus: LigneRevenu[],
  formules: LigneFormule[],
): BlocRecit[] {
  const alimentation = lignesToutes.filter((l) => l.poste === "alimentation");
  if (alimentation.length === 0) throw new Error("Série alimentation absente.");
  const jalons = selectionnerJalons(alimentation);
  const fin = alimentation[alimentation.length - 1];
  if (fin.ecart_prix_estime_pct === null || jalons.ancre.ecart_ecsp_2022_pct === null) {
    throw new Error("Écart alimentaire absent pour le récit.");
  }
  if (jalons.maximumEstime.ecart_prix_estime_pct === null) {
    throw new Error("Pic estimé absent.");
  }

  const jusquaOctobre = exigerMois(alimentation, 2024, 10);
  const versDecembre = evolutionEntreMois(alimentation, 2024, 10, 2025, 12);
  const apresOctobre = evolutionEntreMois(
    alimentation,
    2024,
    10,
    fin.periode.getUTCFullYear(),
    fin.periode.getUTCMonth() + 1,
  );
  const panierDepart = calculerPanierIllustratif(jalons.ancre);
  const panierFin = calculerPanierIllustratif(fin);

  const valeurs: Record<string, string> = {
    ecart_alimentaire_2022: pct(jalons.ancre.ecart_ecsp_2022_pct),
    mois_fin: formaterMoisUtc(fin.periode),
    evo_mq: pct(fin.evolution_martinique_pct),
    evo_fm: pct(fin.evolution_france_metropolitaine_pct),
    evo_mq_oct: pct(jusquaOctobre.evolution_martinique_pct),
    evo_fm_oct: pct(jusquaOctobre.evolution_france_metropolitaine_pct),
    evo_mq_apres: pct(apresOctobre.martinique),
    evo_fm_apres: pct(apresOctobre.france),
    evo_mq_2025: pct(versDecembre.martinique),
    evo_fm_2025: pct(versDecembre.france),
    pic: phrasePicEstime(
      jalons.maximumEstime.ecart_prix_estime_pct,
      formaterMoisUtc(jalons.maximumEstime.periode),
      fin.ecart_prix_estime_pct,
      formaterMoisUtc(fin.periode),
    ),
    ecart_fin: pct(fin.ecart_prix_estime_pct),
    paasche_2022: pctPublie(exigerFormule(formules, "paasche_panier_martiniquais")),
    laspeyres_2022: pctPublie(exigerFormule(formules, "laspeyres_panier_hexagonal")),
    niveau_2010_alim: formaterPublie(exigerNiveau(niveaux, 2010, "alimentation")),
    niveau_2015_alim: formaterPublie(exigerNiveau(niveaux, 2015, "alimentation")),
    niveau_2022_alim: formaterPublie(exigerNiveau(niveaux, 2022, "alimentation")),
    niveau_2010_ens: formaterPublie(exigerNiveau(niveaux, 2010, "ensemble")),
    niveau_2015_ens: formaterPublie(exigerNiveau(niveaux, 2015, "ensemble")),
    niveau_2022_ens: formaterPublie(exigerNiveau(niveaux, 2022, "ensemble")),
    euros_mq_2022: formaterEuros(panierDepart.martinique),
    euros_fm_fin: formaterEuros(panierFin.metropole),
    euros_mq_fin: formaterEuros(panierFin.martinique),
    ecart_euros_2022: formaterEuros(panierDepart.martinique - panierDepart.metropole),
    ecart_euros_fin: formaterEuros(panierFin.martinique - panierFin.metropole),
  };

  for (const poste of ["energie", "produits_manufactures", "services"] as const) {
    const serie = lignesToutes.filter((l) => l.poste === poste);
    const derniere = serie[serie.length - 1];
    if (!derniere) throw new Error(`Série absente : ${poste}.`);
    valeurs[`evo_mq_${poste}`] = pct(derniere.evolution_martinique_pct);
    valeurs[`evo_fm_${poste}`] = pct(derniere.evolution_france_metropolitaine_pct);
  }
  const manufactures = evolutionEntreMois(
    lignesToutes.filter((l) => l.poste === "produits_manufactures"),
    2024,
    10,
    fin.periode.getUTCFullYear(),
    fin.periode.getUTCMonth() + 1,
  );
  const energieChoc = evolutionEntreMois(
    lignesToutes.filter((l) => l.poste === "energie"),
    2025,
    12,
    fin.periode.getUTCFullYear(),
    fin.periode.getUTCMonth() + 1,
  );
  valeurs.evo_mq_manuf_apres = pct(manufactures.martinique);
  valeurs.evo_fm_manuf_apres = pct(manufactures.france);
  valeurs.evo_mq_energie_choc = pct(energieChoc.martinique);
  valeurs.evo_fm_energie_choc = pct(energieChoc.france);

  const revenu = (indicateur: string): LigneRevenu => {
    const ligne = revenus.find((r) => r.indicateur === indicateur);
    if (!ligne) throw new Error(`Revenu absent : ${indicateur}.`);
    return ligne;
  };
  const prive = revenu("salaire_net_moyen_prive");
  const public_ = revenu("salaire_net_moyen_fonction_publique");
  const nonsal = revenu("revenu_activite_non_salaries");
  valeurs.revenu_prive = formaterPointsPct(prive.ecart_moyenne_nationale_pct);
  valeurs.revenu_public = formaterPointsPct(public_.ecart_moyenne_nationale_pct);
  valeurs.revenu_nonsal = formaterPointsPct(nonsal.ecart_moyenne_nationale_pct);
  valeurs.annee_revenus = String(prive.annee);

  if (!jalons.ancre.source_ecsp) throw new Error("Source ECSP absente pour l'ancre.");
  const sourceAncre = jalons.ancre.source_ecsp;

  const mesure = (texte: string, sources: BlocRecit["sources"] = []): BlocRecit => ({
    registre: "mesure",
    texte: resoudreEmplacements(texte, valeurs),
    sources,
  });

  const annuels = ecartsAnnuels(alimentation);
  if (annuels.length === 0) throw new Error("Écarts annuels absents.");

  return [
    mesure(
      "En mars-avril 2022, l'Insee a mesuré que les produits alimentaires coûtaient {ecart_alimentaire_2022} de plus en Martinique que dans l'Hexagone. C'est la seule mesure de l'écart de niveau dont on dispose pour ce poste.",
      [{ href: sourceAncre, libelle: "Insee, ECSP 2022" }],
    ),
    mesure(
      "D'avril 2022 à {mois_fin}, les prix alimentaires ont augmenté de {evo_mq} en Martinique et de {evo_fm} dans l'Hexagone. D'avril 2022 à octobre 2024, {evo_mq_oct} contre {evo_fm_oct} ; d'octobre 2024 à {mois_fin}, {evo_mq_apres} contre {evo_fm_apres}.",
    ),
    mesure(
      "D'octobre 2024 à décembre 2025, les prix alimentaires ont augmenté de {evo_mq_2025} en Martinique et de {evo_fm_2025} dans l'Hexagone.",
    ),
    mesure(
      "Hors alimentation, d'avril 2022 à {mois_fin}, l'énergie a augmenté de {evo_mq_energie} en Martinique contre {evo_fm_energie} dans l'Hexagone, et les services de {evo_mq_services} contre {evo_fm_services}. Les produits manufacturés : {evo_mq_produits_manufactures} contre {evo_fm_produits_manufactures}. Après octobre 2024, {evo_mq_manuf_apres} contre {evo_fm_manuf_apres}. Pour l'énergie, de décembre 2025 à {mois_fin} : {evo_mq_energie_choc} contre {evo_fm_energie_choc}.",
    ),
    mesure("{pic}"),
    mesure(
      "Sur le niveau, l'Insee a mesuré un écart alimentaire de {niveau_2010_alim} en 2010, {niveau_2015_alim} en 2015 et {niveau_2022_alim} en 2022, et un écart tous produits de {niveau_2010_ens}, {niveau_2015_ens} puis {niveau_2022_ens}.",
    ),
    mesure(
      "Depuis 2022, l'alimentation a augmenté de {evo_mq} en Martinique et de {evo_fm} dans l'Hexagone. Appliqués à un niveau de départ supérieur, des pourcentages proches creusent l'écart en euros : un panier à 100 € dans l'Hexagone et {euros_mq_2022} en Martinique en 2022 vaudrait {euros_fm_fin} et {euros_mq_fin}, soit {ecart_euros_fin} d'écart au lieu de {ecart_euros_2022} (illustration arithmétique, pas une mesure). Mesuré en pourcentage, l'écart estimé est de {ecart_fin} en {mois_fin}.",
    ),
    {
      registre: "contexte",
      texte: resoudreEmplacements(
        "Ce chiffre de 2022 dépend du panier retenu : {paasche_2022} avec les habitudes martiniquaises, {laspeyres_2022} avec celles de l'Hexagone. Tous produits confondus, l'écart est de {niveau_2022_ens}.",
        valeurs,
      ),
      sources: [
        {
          href: "https://www.insee.fr/fr/statistiques/7649202",
          libelle: "Insee Analyses Martinique n° 63",
        },
      ],
    },
    {
      registre: "contexte",
      texte:
        "Les trois enquêtes de niveau ne sont pas strictement comparables : l'Insee juge la comparaison 2010-2015 délicate, les paniers et les modes de consommation ayant changé.",
      sources: [
        {
          href: "https://www.insee.fr/fr/statistiques/1908423",
          libelle: "Insee Analyses Martinique n° 9",
        },
      ],
    },
    {
      registre: "contexte",
      texte: `En ${valeurs.annee_revenus}, le salaire net moyen est ${valeurs.revenu_prive} par rapport à la moyenne nationale dans le privé, et ${valeurs.revenu_public} dans la fonction publique. Le revenu d'activité des non-salariés est ${valeurs.revenu_nonsal}. La moyenne nationale inclut l'Île-de-France.`,
      sources: [
        {
          href: prive.source_url,
          libelle: "Insee, disparités territoriales de revenus",
        },
      ],
    },
    {
      registre: "lecture",
      texte: resoudreEmplacements(
        "Le ralentissement de l'alimentation coïncide avec le protocole contre la vie chère. Le protocole ne couvre qu'une part du panier, et aucune étude indépendante n'a mesuré son effet sur l'indice global. On peut constater la coïncidence ; on ne peut pas encore parler de cause.",
        valeurs,
      ),
      sources: [],
    },
    {
      registre: "lecture",
      texte: resoudreEmplacements(
        "L'écart sur l'énergie tient d'abord à des règles différentes — fiscalité, prix administrés. Il ne dit pas que l'énergie coûte moins cher en Martinique : il dit seulement que son prix y a moins augmenté.",
        valeurs,
      ),
      sources: [],
    },
    {
      registre: "lecture",
      texte: resoudreEmplacements(
        "Quatre ans après la mesure de 2022, l'écart alimentaire estimé est revenu vers son niveau de départ, pas en dessous. Ces éléments coïncident avec le sentiment d'une vie plus chère : un niveau alimentaire supérieur de {ecart_alimentaire_2022}, qui ne s'est pas refermé, et des revenus du privé inférieurs à la moyenne nationale. Cette coïncidence n'est pas une démonstration. Seule une nouvelle enquête de comparaison spatiale pourra dire où en est le niveau.",
        valeurs,
      ),
      sources: [],
    },
  ];
}
