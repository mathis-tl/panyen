Tu implémentes une seule spec : **Incrément 5 — interface finale accessible**, en
une seule boucle, phases A à D. `SPEC.txt` fait autorité, avec
`docs/prompts/panyen-brief-da.md` (corrigé le 2026-10-05) pour tout le visuel et
`docs/analyse/recit.md` (validé par Mathis) pour le texte. En cas de divergence entre
ce prompt, la spec, le brief ou le récit, arrête-toi avant toute modification et
signale précisément la contradiction.

Les incréments 3 et 4 sont clos et le correctif carburants 4b est publié : ne les
refais pas. Ne relance pas `make publier-carburants`. Cette boucle s'arrête après le
rapport final.

DÉMARRAGE

1. Lire `AGENTS.md`, `CLAUDE.md` (règle des niveaux, échec bruyant, aucune valeur
   inventée, conventions dbt, grain déclaré), `SPEC.txt` en entier, le brief DA en
   entier, `docs/analyse/recit.md` et `docs/analyse/validation.md` § 6.
2. Capturer `git status --short --branch`, `git log -1 --oneline` et les SHA-256 de
   `web/public/data/*.parquet`, `uv.lock`, `web/package-lock.json` dans
   `/private/tmp/panyen_5/avant.sha`.
3. Lire avant d'écrire : `web/src/*.ts` (main, calculs, rendu, graphe et leurs
   variantes carburants, types, validation, chargement) et leurs tests, `style.css`,
   `publication/publier_carburants.py`, `Makefile`, `dbt/seeds/*`,
   `dbt/models/marts/schema.yml`. Réutiliser l'existant ; aucune abstraction pour le
   plaisir.
4. Pour les choix visuels, appliquer le skill `frontend-design` en respectant le
   brief : le brief l'emporte.

PHASES (porte de vérification entre chaque phase ; ne passe à la suivante qu'après
la porte)

A. Données : seeds `ecsp_niveaux.csv`, `revenus_ecart_national.csv`, publication des
   seeds (dont `evenements_contexte.csv`) en Parquet. Chaque valeur est relue sur sa
   page source avant d'entrer dans un seed (`validation.md` § 6 donne les valeurs
   et les URL) ; une valeur non relue n'entre pas. Tests dbt, grain en en-tête et
   `schema.yml`. Publication seulement si dbt est vert. Porte : `make verify` vert,
   les deux Parquet existants identiques.
B. Socle : polices Fontsource, variables CSS, thèmes, hachure SVG, infobulle
   accessible, squelette. Porte : tests et build verts, captures du socle.
C. Écrans : titre à trois états, règle du panier, écart 2022 par poste, quatre
   graphiques IPC avec événements annotés, carburants, section « Pourquoi c'est
   ressenti plus cher », récit en trois registres, section Méthode. Porte : tests,
   build, captures de chaque écran relues une à une.
D. Qualité : contrastes, daltonisme, animations, clavier, lecteur d'écran, réseau,
   poids. Porte : rapport chiffré.

TDD (règle `tdd-adaptive`) : test rouge puis vert pour le choix des trois états
(frontières de ±2 points, valeur exacte), les barres « à la même date », la
résolution des emplacements du récit (un emplacement non résolu fait échouer),
le libellé selon le dernier mois commun, et les tests dbt des nouveaux seeds. Pas de
TDD pour le CSS ni les textes.

CONTRAT À NE PAS DÉGRADER

- **Règle des niveaux** : jamais deux niveaux d'indice côte à côte ; l'écart de
  niveau vient d'une enquête ECSP ; tout prolongement est étiqueté « estimation ».
  Un contre-exemple est un bug bloquant.
- **Aucune valeur inventée ni recopiée à la main dans le site** : tout chiffre
  affiché est lu dans un Parquet. Le pic « environ 42,5 % en décembre 2024 » est
  calculé depuis `ecart_prix_estime_pct`. Provenance conservée jusqu'à l'affichage.
- Échec bruyant : valeur absente ou emplacement non résolu = écran en erreur visible.
- Pas de CDN, pas de police tierce, aucune requête vers un domaine tiers.
- Dépendances : seulement les trois paquets Fontsource ; toute autre est justifiée par
  écrit avant ajout.
- Ne pas modifier : `SPEC.txt`, ce prompt, `CLAUDE.md`, `AGENTS.md`, `ROADMAP.md`,
  `docs/` (y compris `recit.md` et `validation.md`), `ingest/`, `transformation/`,
  les modèles IPC et carburants existants, les bruts, la CI, `uv.lock`. Les seuls
  fichiers dbt autorisés sont les nouveaux seeds, leurs tests et leur déclaration
  dans `schema.yml`. Si le récit doit changer, signale-le dans le rapport.
- Une seule commande lourde à la fois (machine 8 Go) ; aucun processus parallèle.
- Mesures et captures dans `/private/tmp/panyen_5/` ; copier les captures utiles
  dans `.agent-work/preuves-5/` (ignoré par git). Jamais dans Git.
- Aucun commit, push, branche ou PR.

VÉRIFICATION FINALE

`make verify`, `npm --prefix web run test`, `npm --prefix web run build`, puis
`npm --prefix web run preview` et navigateur à 375 et 1440 px, thèmes clair et
sombre, chaque écran : 0 erreur console, clavier, `prefers-reduced-motion`, onglet
Réseau sans domaine tiers. **Regarde les captures**, ne te contente pas de les
compter. Arrête le serveur ensuite. Recalcule les empreintes dans `apres.sha` : les
deux Parquet existants et `uv.lock` identiques ; seuls les nouveaux Parquet,
`web/package.json` et `web/package-lock.json` changent.

SEULS MOTIFS DE STOP AVANT LA FIN

- Une empreinte de départ contredit l'état décrit dans `SPEC.txt`.
- Une valeur ne peut pas être relue sur sa source, ou le Parquet ne fournit pas une
  valeur nécessaire : s'arrêter et le dire, ne rien inventer.
- Une exigence du brief ou du récit enfreint la règle des niveaux ou contredit la spec.
- Un arrêt 137 ou 143 se reproduit après une relance seule.

RAPPORT FINAL (en français, factuel, sans habillage)

1. Ce qui a changé : quoi / où / pourquoi, une phrase par changement, par phase.
2. Tests écrits (rouge puis vert) et commandes réellement lancées ; ce qui n'a pas
   été lancé, dit explicitement.
3. Captures relues : ce que chacune montre, par écran, thème et largeur ; défauts
   visibles restants.
4. Contrastes calculés, daltonisme, poids du bundle avant / après, requêtes réseau.
5. Empreintes avant / après ; lignes et colonnes des nouveaux Parquet.
6. Écarts avec la spec, le brief ou le récit ; décisions prises seul ; points à valider
   par Mathis (seuil de ±2 points, échelle commune des graphiques IPC, mois de fin de
   l'estimation).
