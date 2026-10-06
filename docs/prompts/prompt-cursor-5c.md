Tu implémentes une seule spec : **Incrément 5c — estimer aussi l'écart « ensemble »,
honnêtement**, en une boucle, phases 0 à D. `SPEC.txt` fait autorité (textes compris),
`CLAUDE.md` pour les règles non négociables. En cas de contradiction entre ce prompt,
la spec et `CLAUDE.md`, arrête-toi avant toute modification et signale-la.

Les incréments 3, 4, 5 et 5b sont commités : ne les refais pas. Ne relance pas
`make publier-carburants`. Cette boucle s'arrête après le rapport final. Aucun commit.

DÉMARRAGE

1. Lire `CLAUDE.md`, `AGENTS.md`, `SPEC.txt` en entier, `docs/analyse/validation.md` § 6.
2. Capturer `git status --short --branch`, `git log -1 --oneline` et les SHA-256 de
   `web/public/data/*.parquet`, `uv.lock`, `web/package-lock.json` dans
   `/private/tmp/panyen_5c/avant.sha`.
3. Lire avant d'écrire : `ingest/insee_ipc.py`, `transformation/sdmx.py`,
   `dbt/models/staging/stg_ipc.py`, `dbt/models/intermediate/int_ipc_rebase.sql`,
   `dbt/models/marts/fct_differentiel_ipc.sql`, les `schema.yml` et tests dbt IPC
   (`dbt/tests/fct_differentiel_ipc_*`, `int_ipc_rebase_*`), `publication/`, `Makefile`,
   `web/src/{types,validation,chargement,page,recit,calculs-ecran}.ts` et leurs tests.
   Réutiliser l'existant (`ligneBarre`, `ligneBarreSignee`, `resoudreEmplacements`,
   `sourceLigne`).

PHASES (porte entre chacune ; ne passe à la suivante qu'après la porte)

0. Vérifications (`SPEC.txt` phase 0) : champ de l'ensemble 2022 (Insee Première
   n° 1958, page `7648939`), observations des deux nouvelles séries sans trou,
   faisabilité du contrôle rétrospectif. Résultat dans `docs/analyse/serie-ensemble.md`.
   **Si 0.1 ou 0.2 échoue : STOP et rapport.** 0.3 « non faisable » n'arrête pas la boucle.
A. Donnée : collecte des dix séries (un seul appel), référentiel, rebasage, ancre « ensemble »
   13,8 % lue dans `ecsp_niveaux`, mois commun unique, tests dbt rouge d'abord, `make publier`.
B. Front : le poste « ensemble » est reconnu sans graphique de courbe ; rien ne casse.
C. Page : les huit retouches C1 à C8 de la spec (C8 : plus aucun « métropol* » visible),
   textes mot pour mot.
D. Vérification finale.

TDD (`tdd-adaptive`) : rouge puis vert pour les tests dbt de la phase A (cinq postes,
ancre ensemble, mois commun, pas de trou), la barre estimée (échec si la ligne manque ou si
la nature n'est pas estimation), « aucune barre estimée pour un autre poste », les
libellés des revenus, l'absence de « — » dans `blocsRecit`, l'absence de « métropol » dans tout texte affiché, les deux cas de la conclusion.
Pas de TDD pour le CSS ni les textes.

CONTRAT À NE PAS DÉGRADER

- **Règle des niveaux** : jamais deux niveaux d'indice côte à côte ; l'écart de niveau vient
  de l'ECSP ; tout prolongement est étiqueté « estimation ». Un contre-exemple est bloquant.
- **Aucune pondération inventée**, aucune valeur écrite à la main dans le site ; provenance
  (idbank, fichier brut, horodatage) conservée.
- Échec bruyant : mois manquant, série absente, ligne attendue absente = erreur visible.
- Un test dbt qui échoue empêche la publication des Parquet.
- Dépendances : aucune nouvelle. Pas de CDN, pas de domaine tiers.
- Ne pas modifier : `SPEC.txt`, ce prompt, `CLAUDE.md`, `AGENTS.md`, `ROADMAP.md`, les
  modèles et seeds carburants, les bruts existants, la CI. Créations autorisées :
  `docs/analyse/serie-ensemble.md`, le nouveau brut horodaté.
- Une seule commande lourde à la fois (machine 8 Go) ; pas de processus parallèle.
- Mesures et captures dans `/private/tmp/panyen_5c/` ; copier les utiles dans
  `.agent-work/preuves-5c/` (ignoré par git).
- Aucun commit, push, branche ou PR.

VÉRIFICATION FINALE

`make verify`, `npm --prefix web test`, `tsc` dans `web/`, `npm --prefix web run build`,
puis aperçu navigateur à 375 et 1440 px : chaque section modifiée, 0 erreur console,
aucun hôte tiers. **Regarde les captures.** Arrête le serveur ensuite. Empreintes dans
`apres.sha` : `carburants.parquet`, `uv.lock` et les Parquet de contexte identiques,
sauf `ecsp_niveaux.parquet` (remarque mise à jour) ; `differentiel_ipc.parquet` change.

SEULS MOTIFS DE STOP AVANT LA FIN

- Une empreinte de départ contredit la spec ; l'API Insee ne répond pas ; 0.1 ou 0.2 échoue.
- Un mois manque dans une des deux nouvelles séries.
- Une exigence enfreint la règle des niveaux ou contredit la spec.
- Un arrêt 137 ou 143 se reproduit après une relance seule.

RAPPORT FINAL (en français, factuel)

1. Ce qui a changé : quoi / où / pourquoi, une phrase par changement, par phase.
2. Tests (rouge puis vert) et commandes réellement lancées ; ce qui n'a pas été lancé.
3. Résultats de la phase 0 (champ, trous, contrôle rétrospectif) ; écart « ensemble »
   estimé obtenu, comparé à l'ordre de grandeur de la spec.
4. Captures relues, par section et largeur ; défauts visibles restants.
5. Empreintes avant / après ; lignes et colonnes du Parquet IPC.
6. Écarts avec la spec, décisions prises seul, points à valider par Mathis.
