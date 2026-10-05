# Mission : trouver des dépôts GitHub modernes et soignés pour l'interface de « panyen »

## Le projet
« panyen » (« panier » en créole martiniquais) est un site de données statique, sans
serveur. Il répond à une question : **l'écart de prix mesuré en 2022 entre la Martinique et
la France hexagonale s'est-il creusé ou resserré depuis ?** Public : des non-spécialistes
qui ne savent pas ce qu'est un indice des prix. Le site doit donner la réponse, sa période
et sa limite (« c'est une estimation ») en moins d'une minute.

## Stack actuelle (à respecter ou à justifier d'en sortir)
- Vite + TypeScript, **sans framework** (DOM direct), `web/`.
- Graphiques : `@observablehq/plot`. Données : fichiers Parquet lus dans le navigateur
  avec `hyparquet`. Aucune API, aucun serveur : hébergement statique.
- Thèmes clair et sombre ; accessibilité en priorité (daltonisme, `prefers-reduced-motion`,
  chiffres tabulaires, libellés directs, pas de double axe).
- Machine de développement modeste (8 Go) : préférer des dépendances légères.

## Direction artistique (extrait de `docs/prompts/panyen-brief-da.md`)
- Inspirations : Reuters Graphics (« How the US economy can look pretty good but feel
  pretty bad »), Our World in Data, Apple « Environment » pour le premier écran.
- Concept : un **relevé de caisse**, une colonne étroite où chaque ligne est un constat
  suivi de sa preuve. Signature : « la règle du panier », trois barres horizontales
  (100 € dans l'Hexagone ; Martinique 2022, mesuré en plein ; Martinique aujourd'hui,
  prolongé par un segment **hachuré** = estimé).
- Palette : bleu profond (Martinique) et ambre (Hexagone) sur ardoise pâle / nuit d'encre.
  Pas de rouge ni de vert. Typographies : Schibsted Grotesk, Atkinson Hyperlegible Next,
  IBM Plex Mono (toutes OFL).
- Écrans : écart 2022 par poste (barres), évolutions IPC en quatre petits graphiques,
  carburants (distribution métropolitaine et plafond martiniquais), puis fraîcheur des
  données.

## Ce que je cherche
Des **dépôts GitHub** (et leur démo en ligne) dont on peut s'inspirer ou que l'on peut
réutiliser, dans quatre familles. Pour chaque famille, 2 à 4 dépôts au plus :
1. **Sites ou gabarits éditoriaux de data-journalisme** : mise en page type Reuters /
   Pudding / OWID / NYT, récit scrollé (« scrollytelling »), annotations sur graphiques.
2. **Bibliothèques et systèmes de composants légers**, utilisables sans React, pour la
   structure de page, la typographie, les thèmes clair/sombre, les tableaux de bord.
3. **Exemples et extensions de graphiques** compatibles Observable Plot (ou concurrents
   plus légers si justifié) : annotations, motifs hachurés, étiquettes directes en bout de
   courbe, petits multiples, infobulles accessibles.
4. **Briques d'accessibilité et de thème** : bascule clair/sombre, `prefers-reduced-motion`,
   palettes testées pour le daltonisme, composants de navigation au clavier.

« Moderne et stylé » signifie ici : rendu actuel et sobre, typographie soignée, bonne
hiérarchie, pas de look de template générique. Montre la démo en ligne ou une capture.

## Critères de tri (à vérifier, pas à supposer)
Pour chaque dépôt, relève et **vérifie sur la page** :
- licence (MIT, Apache-2.0, BSD, OFL, CC…) et compatibilité avec un site public ;
- activité : date du dernier commit et de la dernière release, issues ouvertes, nombre de
  mainteneurs ; écarte ce qui n'est plus maintenu depuis plus de 18 mois (sauf si c'est
  une simple source d'inspiration, à signaler comme telle) ;
- poids : dépendances et taille livrée (gzip) quand elle est mesurable ; framework imposé ;
- accessibilité : ce que le dépôt affirme **et** ce qui est démontré (démo testée, rapport,
  attributs ARIA visibles dans le code) ; ne reprends pas une promesse du README sans la
  recouper ;
- compatibilité avec notre stack : intégrable dans Vite + TypeScript sans framework ?
  coût d'intégration en une phrase.
Le nombre d'étoiles est une information, pas un critère de sélection.

## Contraintes
- Ne cite que des pages que tu as **réellement ouvertes**, avec l'URL exacte. Signale les
  dépôts archivés, les liens morts et les démos qui ne se chargent pas.
- **N'invente aucun chiffre** (étoiles, dates, tailles) : si tu ne l'as pas lu, écris
  « non vérifié ».
- Sépare toujours **fait** (lu sur la page), **affirmation du dépôt** et **ta propre
  appréciation**.
- Aucune bibliothèque qui exige un serveur, un compte, une clé d'API ou un service tiers
  au chargement de la page (pas de télémétrie, pas de police ou de script chargé depuis un
  CDN non maîtrisé sans le signaler).
- Hors sujet : tout ce qui concerne la collecte de prix chez des distributeurs, et toute
  réutilisation de code privé.
- Ne propose pas de refonte de la stack (React, Next, etc.) sauf si un dépôt le justifie
  nettement ; dans ce cas, chiffre le coût (poids, réécriture) et indique l'alternative
  sans framework.

## Format de ta réponse
1. **Tableau de synthèse** : dépôt (URL) · famille · licence · dernier commit · framework /
   dépendances · accessibilité (démontrée ou affirmée) · coût d'intégration · verdict
   (**adopter**, **s'inspirer seulement**, **écarter**).
2. **Fiches courtes** (5 lignes) pour les 5 meilleurs candidats : ce qu'on en prend,
   comment l'intégrer dans `web/`, ce qui pourrait casser la direction artistique.
3. **Trois pistes d'interface** combinant ces briques (par exemple : « éditorial Reuters
   sans framework », « tableau de bord sobre », « récit scrollé »), chacune avec ses
   dépendances exactes, son poids estimé et son principal risque.
4. **Recommandation** : une piste, justifiée en 5 lignes, avec ce qu'il faudrait
   prototyper en premier pour la valider.
5. **Les manques** : ce qui n'a pas pu être vérifié, ce qui reste à tester dans un
   navigateur (mobile 375 px, thème sombre, clavier, lecteur d'écran).
