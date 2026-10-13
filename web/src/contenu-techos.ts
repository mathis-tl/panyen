/**
 * Contenu de la page « Pour les techos », séparé du rendu pour être testé sans DOM.
 * Les valeurs de l'exemple chiffré sont lues dans le Parquet publié (août 2026).
 */

export type BlocTechos =
  | { type: "texte"; texte: string }
  | { type: "formule"; lignes: string[] }
  | { type: "liste"; items: string[] }
  | { type: "etapes"; items: Array<{ titre: string; outil: string; texte: string }> };

export interface SectionTechos {
  id: string;
  titre: string;
  blocs: BlocTechos[];
}

export const SECTIONS_TECHOS: SectionTechos[] = [
  {
    id: "question",
    titre: "La question",
    blocs: [
      {
        type: "texte",
        texte:
          "Panye répond à une seule question : l'écart de prix mesuré en 2022 entre la Martinique et l'Hexagone s'est-il creusé ou resserré depuis ?",
      },
      {
        type: "texte",
        texte: "L'Hexagone, ici, c'est la France hexagonale : le continent et la Corse.",
      },
      {
        type: "texte",
        texte:
          "Il n'y a pas de serveur ni de base de données en ligne. Tout le calcul est fait avant la publication ; le navigateur lit des fichiers et dessine.",
      },
    ],
  },
  {
    id: "trajet",
    titre: "Le trajet des données",
    blocs: [
      {
        type: "texte",
        texte:
          "Six étapes, de l'Insee à l'écran. Chaque étape lit la précédente et ne la modifie jamais.",
      },
      {
        type: "etapes",
        items: [
          {
            titre: "1. Collecte",
            outil: "Python, API SDMX de l'Insee (ouverte, sans clé)",
            texte:
              "Un seul appel demande dix séries d'indices des prix à la consommation : cinq postes (alimentation, énergie, produits manufacturés, services, ensemble) pour la Martinique et pour la France hexagonale, depuis avril 2022. La réponse est rangée telle quelle, horodatée, dans le dossier du brut. Rien n'est corrigé à ce stade et aucun fichier n'est écrasé : une exécution passée reste rejouable.",
          },
          {
            titre: "2. Nettoyage",
            outil: "dbt, modèle de préparation",
            texte:
              "Le XML devient une table : une ligne par fichier, série et mois. Les contrôles vérifient que chaque identifiant de série correspond au bon poste et au bon territoire, qu'il n'y a pas de doublon, et que chaque indice reste dans une plage plausible (entre 50 et 200), ce qui attrape un changement de base de l'Insee.",
          },
          {
            titre: "3. Mise à la même origine",
            outil: "dbt, modèle intermédiaire",
            texte:
              "Chaque série est rapportée à son propre mois d'avril 2022. Le calendrier doit être complet pour les dix séries : un mois manquant fait échouer le traitement, il ne se comble pas. Le dernier mois retenu est le dernier mois commun aux dix séries.",
          },
          {
            titre: "4. Différentiel et estimation",
            outil: "dbt, table finale",
            texte:
              "Les évolutions des deux territoires sont appariées, puis l'écart de prix de 2022 mesuré par l'Insee est prolongé. Le résultat tient en 265 lignes : cinq postes par 53 mois, d'avril 2022 à août 2026. Chaque ligne dit si l'écart est une mesure ou une estimation.",
          },
          {
            titre: "5. Publication",
            outil: "Python, fichier Parquet compressé",
            texte:
              "La table est exportée vers un fichier candidat, relue et comparée à la table d'origine, puis le fichier du site est remplacé d'un seul geste. Si un contrôle a échoué, rien n'est publié : le site garde sa dernière version saine.",
          },
          {
            titre: "6. Lecture dans le navigateur",
            outil: "TypeScript, hyparquet, Observable Plot",
            texte:
              "La page lit le Parquet, vérifie les colonnes et chaque ligne avant de dessiner quoi que ce soit, puis trace les graphiques en SVG. Si les données sont invalides, elle affiche « Données indisponibles » et aucun chiffre.",
          },
        ],
      },
    ],
  },
  {
    id: "calcul",
    titre: "Le calcul de l'écart estimé",
    blocs: [
      {
        type: "texte",
        texte:
          "Un indice des prix est en base 100 sur son propre territoire. L'indice martiniquais et l'indice de l'Hexagone ne se comparent pas en niveau : chacun mesure une évolution depuis son propre point de départ. Le calcul ne compare donc que des évolutions.",
      },
      {
        type: "texte",
        texte:
          "Notations : I est l'indice publié par l'Insee pour un poste p, un territoire (M pour la Martinique, H pour l'Hexagone) et un mois t. Le mois 0 est avril 2022.",
      },
      {
        type: "formule",
        lignes: [
          "facteur       f(T, t) = I(T, t) / I(T, 0)",
          "évolution     (f - 1) x 100, en %",
          "différentiel  évolution(M) - évolution(H), en points",
          "coefficient   c(t) = f(M, t) / f(H, t)",
          "écart estimé  (1 + a) x c(t) - 1",
        ],
      },
      {
        type: "texte",
        texte:
          "Ici a est l'écart de prix de 2022, mesuré par l'Insee dans l'enquête de comparaison spatiale des prix (indice de Fisher) : 40,2 % pour l'alimentation, 13,8 % pour l'ensemble. Il n'existe pas pour l'énergie, les produits manufacturés et les services : pour ces postes, le site ne montre que des évolutions.",
      },
      {
        type: "texte",
        texte:
          "Pourquoi cette formule ? Pour un même panier, le rapport des prix au mois t est le rapport de 2022, multiplié par le rapport des hausses depuis 2022. Le rapport de 2022 vaut 1 + a (mesuré). Le rapport des hausses vaut c(t), calculé à partir de deux indices chacun lu dans son territoire. Les niveaux d'indice ne sont jamais divisés l'un par l'autre.",
      },
      {
        type: "formule",
        lignes: [
          "P(M,t) / P(H,t) = P(M,0) / P(H,0) x [P(M,t) / P(M,0)] / [P(H,t) / P(H,0)]",
          "                = (1 + a) x c(t)",
        ],
      },
      {
        type: "texte",
        texte:
          "Exemple chiffré, alimentation, août 2026. Les indices ont monté de 20,0 % en Martinique et de 19,9 % dans l'Hexagone depuis avril 2022 (f(M) = 1,2002 et f(H) = 1,1988, donc c = 1,0011). L'écart estimé vaut 1,402 x 1,0011 - 1 = 40,35 %, affiché 40,4 %. Pour l'ensemble : f(M) = 1,1005, f(H) = 1,1270, c = 0,9765, et 1,138 x 0,9765 - 1 = 11,1 %.",
      },
      {
        type: "texte",
        texte:
          "Le Parquet garde les facteurs, les identifiants Insee des deux séries, le fichier brut d'origine et sa date de collecte : n'importe quel chiffre affiché se retrouve ligne à ligne.",
      },
    ],
  },
  {
    id: "limites-calcul",
    titre: "Ce que le calcul suppose, et où il peut se tromper",
    blocs: [
      {
        type: "liste",
        items: [
          "Mesuré et estimé ne sont pas la même chose. Seul avril 2022 est une mesure. Chaque mois suivant est une estimation, hachurée sur la page, de moins en moins sûre à mesure qu'on s'éloigne de 2022.",
          "L'écart de niveau dépend du panier. En 2022, l'Insee publie 31 % pour un panier alimentaire aux habitudes martiniquaises (Paasche) et 50 % pour un panier aux habitudes de l'Hexagone (Laspeyres). Le chiffre de 40,2 % est leur moyenne géométrique (Fisher) : racine de 1,31 x 1,50 donne 1,402.",
          "Les indices pondèrent chaque territoire avec ses propres habitudes d'achat, qui changent d'une année à l'autre. Le coefficient c(t) suppose que les paniers restent comparables entre 2022 et t.",
          "L'estimation de l'ensemble applique l'écart de l'enquête à l'indice de tous les produits : l'enquête laisse de côté le fioul, le gaz de ville et le ferroviaire, que l'indice contient. Les champs ne sont pas identiques.",
          "L'Insee ne donne pas de marge d'erreur pour l'enquête de 2022 ; la précision de 0,1 point affichée est celle de l'arrondi. La prochaine enquête fixera un nouveau point de départ.",
          "La France hexagonale publie ses indices avant les DOM. Un mois publié d'un seul côté n'entre pas : le dernier mois est le dernier mois commun.",
        ],
      },
    ],
  },
  {
    id: "controles",
    titre: "Les contrôles",
    blocs: [
      {
        type: "texte",
        texte:
          "Une règle guide tout : une ligne douteuse est signalée et visible, jamais avalée. Les contrôles sont automatiques et se lancent avec une seule commande, sans réseau.",
      },
      {
        type: "liste",
        items: [
          "Données (dbt) : 201 tests, dont 134 sur les cinq postes de l'IPC. Grain unique, séries attendues présentes, calendrier sans trou, indice dans la plage, ancre d'avril 2022 présente, mois commun unique, aucune ancre de niveau inventée pour l'énergie, les produits manufacturés et les services, nature de l'écart (mesure ou estimation) cohérente avec la date.",
          "Collecte et publication (Python) : 101 tests, plus la vérification de style Ruff. La collecte, la lecture du SDMX et le remplacement du fichier publié sont couverts, avec des réponses simulées.",
          "Page (Vitest) : 117 tests. Calculs, validation du Parquet, étiquetage « estimé », textes, absence de comparaison de niveaux d'indice.",
          "Intégration continue : le même enchaînement tourne sur GitHub à chaque pull request et à chaque envoi sur la branche principale. Il ne contacte pas l'Insee et ne publie rien.",
          "Qualité de la page : voir le bas de page, avec les mesures Lighthouse, le poids et l'absence d'hôte tiers.",
        ],
      },
    ],
  },
  {
    id: "gazole",
    titre: "Le gazole",
    blocs: [
      {
        type: "texte",
        texte:
          "Dans l'Hexagone, chaque station déclare ses prix dans un fichier national ouvert. Pour chaque période pendant laquelle un même plafond martiniquais s'applique, le prix d'une station est la moyenne de ses prix pondérée par la durée pendant laquelle chaque prix a été affiché. Le site en tire la médiane, les déciles 10 et 90 (la bande claire, huit stations sur dix) et les quartiles (les petites barres, la moitié centrale).",
      },
      {
        type: "texte",
        texte:
          "En Martinique, le préfet fixe un prix maximal par arrêté, le même dans tout le département. C'est la ligne rouge. Ce n'est pas le prix payé pompe par pompe, et les DOM sont absents du fichier national : il n'y a donc aucune médiane de stations pour la Martinique.",
      },
      {
        type: "texte",
        texte:
          "Les carburants sans équivalent direct des deux côtés, comme les essences, ne sont pas comparés : la page les liste sous « Non comparé », avec la raison.",
      },
    ],
  },
  {
    id: "page",
    titre: "La page",
    blocs: [
      {
        type: "liste",
        items: [
          "Une page statique construite avec Vite et TypeScript, hébergée comme simples fichiers. Aucune requête vers un autre domaine : les polices, la vidéo, les données et le code viennent du même site.",
          "L'en-tête et le bandeau s'affichent d'abord ; les données et les graphiques arrivent ensuite, sans bloquer le premier affichage.",
          "Les graphiques sont des SVG. Les deux courbes ont un résumé en texte pour les lecteurs d'écran, et le graphique du gazole se parcourt au clavier mois par mois avec les flèches.",
          "Le rouge est la Martinique, le vert est l'Hexagone. Une barre pleine est mesurée, une barre hachurée est estimée. Le thème est clair seulement.",
          "Panye veut dire panier, en créole martiniquais. Le bandeau est une vidéo muette, en boucle, passée en noir et blanc ; elle ne démarre pas si le visiteur a demandé moins de mouvement ou une économie de données.",
        ],
      },
    ],
  },
  {
    id: "limites",
    titre: "Ce qui n'est pas fait",
    blocs: [
      {
        type: "liste",
        items: [
          "Pas de collecte automatique : la collecte et la publication sont manuelles, et l'étude est figée au 8 octobre 2026. Une mise à jour attendra un hébergement qui la planifie.",
          "Pas de prix de produits en magasin : le site ne collecte aucun prix chez les distributeurs, et le Bouclier Qualité Prix ne publie qu'un prix plafond global, sans détail par produit.",
          "Pas de réponse à « combien coûte un panier aujourd'hui » : seulement « l'écart de 2022 a-t-il bougé ».",
        ],
      },
    ],
  },
];

/** Tout le texte visible de la page, pour les tests. */
export function texteVisibleTechos(): string {
  const morceaux: string[] = [];
  for (const section of SECTIONS_TECHOS) {
    morceaux.push(section.titre);
    for (const bloc of section.blocs) {
      if (bloc.type === "texte") morceaux.push(bloc.texte);
      else if (bloc.type === "formule") morceaux.push(...bloc.lignes);
      else if (bloc.type === "liste") morceaux.push(...bloc.items);
      else for (const etape of bloc.items) morceaux.push(etape.titre, etape.outil, etape.texte);
    }
  }
  return morceaux.join("\n");
}
