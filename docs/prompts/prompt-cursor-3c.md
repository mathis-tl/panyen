Tu termines une seule spec : **Incrément 3 — tranche verticale carburants**,
dans sa **reprise 3c**. La dernière section de `SPEC.txt` (« REPRISE 3c ») fait
autorité, avec les sections de l'incrément 3 qu'elle maintient. En cas de
divergence avec ce prompt, arrête-toi avant toute modification et signale
précisément la contradiction.

Le correctif 3b est terminé et vérifié : ne le refais pas. Cette boucle publie
réellement, vérifie l'écran, rend le rapport final de l'incrément 3, puis
s'arrête.

DÉMARRAGE ET NAVIGATION

1. Lire `AGENTS.md`, `CLAUDE.md`, puis dans `SPEC.txt` : « Porte C », « Porte
   D », « Vérification réelle finale », « Fini » et « REPRISE 3c ».
2. Capturer `git status --short --branch`, `git log -1 --oneline`, puis les
   SHA-256 de `uv.lock`, `web/package-lock.json`, des trois bruts Insee, de
   chaque brut sous `data/raw/carburants/`, de
   `web/public/data/carburants.parquet` et de
   `web/public/data/differentiel_ipc.parquet`. Écrire ces empreintes dans
   `/private/tmp/panyen_3c/avant.sha`. L'arbre contient beaucoup de
   changements non commités qui appartiennent à Mathis : ne les annule pas.
3. Utiliser Graphify avant toute lecture large :

   `graphify query "Comment publier_carburants construit, vérifie et remplace carburants.parquet, et comment l'écran web carburants le charge et l'affiche ?" --budget 1200`

   Confirmer dans `publication/publier_carburants.py`, le `Makefile`,
   `web/src/main.ts` et les modules `web/src/*carburants*`. Le graphe n'est
   jamais la preuve unique.
4. Lire et appliquer `~/.claude/skills/verification-loop/SKILL.md` avant le
   rapport final.

ORDRE DE TRAVAIL

Chaque commande lourde se lance **seule** : attendre la fin de la précédente.

1. `uv run ruff check .` puis `uv run pytest`.
2. `make verify`.
3. `make verifier-carburants` : rendre lignes, grains, bornes, carburants,
   volumes mensuels et mois incomplets de chaque modèle.
4. `make publier-carburants`, sous `/usr/bin/time -l`, avec le journal dans
   `/private/tmp/panyen_3c/publier.log`. Rendre chemin, taille, SHA-256,
   lignes et bornes du Parquet publié.
5. Relire le Parquet publié et le comparer à `fct_comparaison_carburants`.
6. Prouver la conservation de l'ancien Parquet en cas d'échec, selon le
   point 4 de la reprise.
7. Lancer `npm --prefix web run build` puis `npm --prefix web run preview`,
   et vérifier les vues IPC et carburants dans un navigateur à 375, 390 et
   1440 px, erreurs console comprises. Contrôler chaque exigence de la porte
   D, notamment le ruban q10–q90, le repère q25–q75, la médiane, l'escalier
   du plafond avec la date du `2022-11-16`, l'axe unique en €/L, la provenance,
   septembre 2026 marqué incomplet et les correspondances non comparables.
   Garder les captures dans `/private/tmp/panyen_3c/`, jamais dans Git.
   Arrêter le serveur de prévisualisation ensuite.
8. Recalculer les empreintes dans `/private/tmp/panyen_3c/apres.sha` et les
   comparer à `avant.sha`. Seul `carburants.parquet` peut changer.

CONTRAT À NE PAS DÉGRADER

- Pas de nouvelle collecte ni d'accès réseau aux sources : les bruts du
  2026-09-10 font foi.
- Le Parquet du 2026-09-12 n'est jamais réutilisé ni recopié à la main. Il
  n'est remplacé que par `make publier-carburants`.
- Aucune modification de code sans bug démontré par la vérification. Si un
  correctif devient nécessaire, il est minimal, reste dans le périmètre de
  fichiers de l'incrément 3, est testé en rouge puis vert, et figure dans le
  rapport.
- Ne pas modifier la mécanique de flux du correctif 3b.
- Ne pas modifier `SPEC.txt`, ce prompt, `CLAUDE.md`, `AGENTS.md`,
  `ROADMAP.md`, la CI, les bruts, les modèles et Parquets IPC/ECSP.
- Aucun thread ni processus parallèle ajouté. Aucune dépendance ajoutée.
  Lockfiles inchangés.
- Scripts et fichiers de mesure uniquement dans `/private/tmp/panyen_3c/`.
- Aucun commit, push, branche, remote ou PR.

SEULS MOTIFS DE STOP AVANT LA FIN

- Une empreinte de départ contredit l'état décrit dans la reprise 3c.
- Un arrêt 137 ou 143 se reproduit après une relance seule.
- Le Parquet publié diffère de `fct_comparaison_carburants`.
- Un écran montre une valeur inventée ou une comparaison de niveaux d'indices
  entre territoires.
- Un correctif sortirait du périmètre de fichiers ou exigerait une dépendance.

Un test rouge ou un défaut d'affichage mineur se traite dans la boucle.

VÉRIFICATION FINALE OBLIGATOIRE

1. `git diff --check`, puis relire le diff complet de tout fichier modifié
   pendant cette boucle.
2. `git status --short --branch`.
3. `graphify update .`, puis rejouer la requête de départ.
4. Faire relire l'ensemble de l'incrément 3 par `panyen_verifier` et corriger
   toute réserve bloquante avant le rapport.

RAPPORT

Rends le rapport unique demandé par « Fini » de l'incrément 3 :
- verdict ;
- fichiers touchés, avec quoi, où et pourquoi en une phrase chacun ;
- décisions de comparabilité ;
- inventaire et empreintes ;
- grains, volumes et bornes ;
- tests et compteurs ;
- preuve de publication atomique ;
- vérification visuelle ;
- limites et risques.

Puis **STOP**. Ne coche rien dans `ROADMAP.md`, ne committe pas et ne pousse
pas.
