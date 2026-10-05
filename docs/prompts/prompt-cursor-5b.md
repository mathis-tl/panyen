Tu implémentes une seule spec : **Incrément 5b — une page qui se comprend sans
prérequis**, en une seule boucle, phases A à D. `SPEC.txt` fait autorité (textes
compris), avec `docs/prompts/panyen-brief-da.md` (**avenant 5b en tête : il l'emporte
sur le reste du brief**) pour tout le visuel. En cas de divergence entre ce prompt, la
spec et le brief, arrête-toi avant toute modification et signale précisément la
contradiction.

L'incrément 5 est implémenté mais non commité : l'arbre de travail est ton point de
départ, ne le réinitialise pas, ne commite pas. Les incréments 3 et 4 sont clos.
Ne relance pas `make publier-carburants`. Cette boucle s'arrête après le rapport final.

DÉMARRAGE

1. Lire `AGENTS.md`, `CLAUDE.md` (règle des niveaux, échec bruyant, aucune valeur
   inventée, conventions dbt), `SPEC.txt` en entier, le brief DA en entier.
2. Capturer `git status --short --branch`, `git log -1 --oneline` et les SHA-256 de
   `web/public/data/*.parquet`, `uv.lock`, `web/package-lock.json` dans
   `/private/tmp/panyen_5b/avant.sha` ; noter le poids du bundle (`npm --prefix web
   run build`).
3. Lire avant d'écrire : `web/src/page.ts`, `recit.ts`, `calculs-ecran.ts`,
   `graphe.ts`, `graphe-carburants.ts`, `axes-fr.ts`, `chargement-contexte.ts`,
   `style.css`, `web/index.html`, les tests `*.test.ts`, `dbt/seeds/*`,
   `dbt/tests/ecsp_alimentation_2022_mesure.sql`, `Makefile`. Réutiliser l'existant
   (`ligneBarre`, `ligneBarreSignee`, `sourceLigne`, `resoudreEmplacements`,
   `formaterPointsPct`, `phrasePicEstime`, `creerRegistreNettoyage`) ; aucune
   abstraction pour le plaisir.
4. Pour le visuel, appliquer le skill `frontend-design` en respectant l'avenant du
   brief : le but est de ne PAS ressembler à un site généré (pas de grotesque + police
   mono + étiquettes en majuscules espacées, pas de pastilles à bordure fine). Signature
   attendue : la ligne de ticket (étiquette, points de conduite, valeur) et des titres
   larges et lourds façon enseigne.

PHASES (porte de vérification entre chacune)

A. Donnée : ancre 40,0 → 40,2 (`SPEC.txt` phase A). Test rouge d'abord. Régénérer le
   Parquet IPC avec `make publier` ; consigner avant / après (pic, mois du pic, écart
   final, variation) ; si l'état du titre change, STOP.
B. Thème clair seul + polices Archivo / Literata + signature « ligne de ticket »
   (`SPEC.txt` phase B). Vérifie les axes réellement livrés par les paquets avant de
   dessiner. Désinstaller les trois anciens paquets Fontsource.
C. Gabarit de section et textes (`SPEC.txt` phase C et section « Textes ») : textes
   mot pour mot, chiffres via emplacements résolus, `lecture` → `analyse`, navigation,
   pied de page, constat « à peu près autant ».
D. Qualité : contrastes, daltonisme, clavier, mouvement réduit, réseau, poids.

TDD (`tdd-adaptive`) : rouge puis vert pour l'ancre 40,2 (dbt et vitest), le choix des
trois états (frontières ±2 exactes), « à peu près autant » sous 1 point, l'arrondi de
`ecart_fin_entier`, la résolution des emplacements (un emplacement non résolu lève une
erreur), le registre « analyse ». Pas de TDD pour le CSS ni les textes.

CONTRAT À NE PAS DÉGRADER

- **Règle des niveaux** : jamais deux niveaux d'indice côte à côte ; l'écart de niveau
  vient de l'enquête ECSP ; tout prolongement est étiqueté « estimation ». Les prix des
  carburants sont des euros, pas des indices. Un contre-exemple est un bug bloquant.
- **Aucune valeur inventée ni écrite à la main dans le site** : tout chiffre est lu
  dans un Parquet ou calculé depuis lui. Provenance conservée jusqu'à l'affichage.
- Échec bruyant : valeur absente ou emplacement non résolu = écran en erreur visible.
- Pas de CDN, de police tierce, de requête vers un domaine tiers, de framework.
- Dépendances : `@fontsource-variable/archivo` et `@fontsource-variable/literata`
  seulement ; toute autre est justifiée par écrit avant ajout.
- Ne pas modifier : `SPEC.txt`, ce prompt, le brief DA, `CLAUDE.md`, `AGENTS.md`,
  `ROADMAP.md`, `docs/`, `ingest/`, `transformation/`, les modèles IPC et carburants,
  les bruts, la CI, `uv.lock`. Les seuls fichiers dbt modifiables : le seed
  `ecsp_alimentation_2022.csv`, son test, son schéma et la remarque de
  `ecsp_niveaux.csv`. Si un texte de la spec te paraît faux ou ambigu, signale-le dans
  le rapport au lieu de le réécrire.
- Une seule commande lourde à la fois (machine 8 Go) ; aucun processus parallèle.
- Mesures et captures dans `/private/tmp/panyen_5b/` ; copier les captures utiles dans
  `.agent-work/preuves-5b/` (ignoré par git). Jamais dans Git.
- Aucun commit, push, branche ou PR.

VÉRIFICATION FINALE

`make verify`, `npm --prefix web run test`, `npm --prefix web run build`, puis
`npm --prefix web run preview` et navigateur à 375 et 1440 px, **thème clair seul**,
chaque section : 0 erreur console, clavier (menu mobile compris), `prefers-reduced-
motion`, onglet Réseau sans domaine tiers. **Regarde les captures**, ne te contente
pas de les compter. Arrête le serveur ensuite. Fais le test « lecteur novice » : lis la
page de haut en bas et, pour chaque terme du glossaire de la spec, indique où il est
défini. Les `grep` finaux de la spec doivent renvoyer zéro occurrence. Recalcule les
empreintes dans `apres.sha` : `carburants.parquet`, les trois Parquet de contexte et
`uv.lock` identiques ; seuls `differentiel_ipc.parquet`, `web/package.json` et
`web/package-lock.json` changent.

SEULS MOTIFS DE STOP AVANT LA FIN

- Une empreinte de départ contredit l'état décrit dans `SPEC.txt`.
- Le titre change d'état après le passage à 40,2.
- Un chiffre nécessaire n'est pas dans un Parquet : le dire, ne rien inventer.
- Une exigence enfreint la règle des niveaux ou contredit la spec.
- Un arrêt 137 ou 143 se reproduit après une relance seule.

RAPPORT FINAL (en français, factuel, sans habillage)

1. Ce qui a changé : quoi / où / pourquoi, une phrase par changement, par phase.
2. Tests écrits (rouge puis vert) et commandes réellement lancées ; ce qui n'a pas été
   lancé, dit explicitement.
3. Captures relues : ce que chacune montre, par section et largeur ; défauts visibles
   restants.
4. Contrastes calculés, daltonisme, poids du bundle avant / après, requêtes réseau, axes
   de police livrés.
5. Avant / après de la donnée (pic, écart final, variation) ; empreintes ; résultat des
   `grep`.
6. Écarts avec la spec ou le brief, textes jugés ambigus, décisions prises seul, points
   à valider par Mathis.
