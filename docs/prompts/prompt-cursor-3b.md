Tu implémentes une seule spec : **Correctif 3b — parsing national en flux**,
écrite dans la dernière section de `SPEC.txt` à la racine de `panyen`
(« CORRECTIF 3b »). Cette section fait autorité. En cas de divergence avec ce
prompt, arrête-toi avant toute modification et signale précisément la
contradiction.

Le reste de `SPEC.txt` décrit l'incrément 3 en cours. Il reste valable, mais
cette boucle ne traite que le correctif 3b : elle ne reprend ni la collecte,
ni la publication, ni l'écran, et ne coche rien dans `ROADMAP.md`.

DÉMARRAGE ET NAVIGATION

1. Lire `AGENTS.md`, `CLAUDE.md`, la section « CORRECTIF 3b » de `SPEC.txt`,
   puis la section « Porte B » de la même spec.
2. Capturer `git status --short --branch`, `git log -1 --oneline`, puis les
   SHA-256 de `transformation/carburants.py`,
   `dbt/models/staging/stg_carburants.py`, `tests/test_carburants.py`,
   `uv.lock` et `web/package-lock.json`. Si une des deux empreintes de
   référence de la spec ne correspond pas, arrête-toi et signale-le. L'arbre
   contient beaucoup de changements non commités qui appartiennent à Mathis :
   ne les annule pas.
3. Avant toute modification, copier `transformation/carburants.py` vers
   `/private/tmp/panyen_3b/carburants_reference.py` (étape A de la spec).
4. Utiliser Graphify avant toute lecture large avec la commande réelle :

   `graphify query "Comment les ZIP nationaux carburants sont-ils parsés puis chargés dans stg_carburants, et quels tests et modèles dépendent de parser_zip et parser_membre_xml ?" --budget 1200`

   Confirmer dans `transformation/carburants.py`,
   `dbt/models/staging/stg_carburants.py`, `tests/test_carburants.py` et
   `dbt/profiles.yml`. Le graphe n'est jamais la preuve unique.
5. Pour `ET.iterparse` et `read_json`, s'appuyer sur les documentations
   officielles de Python 3.13 et de DuckDB 1.5, rien d'autre.
6. Lire et appliquer `~/.claude/skills/verification-loop/SKILL.md` avant le
   rapport final.

OBJECTIF

`stg_carburants` se construit sur les cinq archives réelles avec une mémoire
bornée, en quelques minutes, et **produit exactement les mêmes lignes** que le
parseur actuel. Le build précédent mourait en silence : environ 6 à 7 Go par
année pour l'arbre XML et les objets, et environ 5 h d'`executemany`.

ORDRE DE TRAVAIL

1. Écrire d'abord les tests hors réseau de la spec. Vérifier qu'ils échouent
   pour la bonne raison : fonction absente, flux lu en entier.
2. Implémenter les points 1 à 5 dans `transformation/carburants.py`, puis le
   point 6 dans `stg_carburants.py`. Les tests existants doivent passer sans
   modification.
3. Lancer le script de parité B sur les cinq ZIP, avant tout build dbt.
4. Lancer le build mesuré avec `/usr/bin/time -l`, puis la vérification C.
5. Lancer `make verifier-carburants`, puis `make verify`.

CONTRAT À NE PAS DÉGRADER

- Mêmes observations, même grain, mêmes erreurs signalées. Aucune règle de
  parsing ne change. Une différence de parité est un bug du correctif.
- Aucune ligne avalée : une erreur au milieu du flux fait échouer le modèle
  avec sa provenance.
- Aucun thread, processus parallèle ou OpenMP. Aucune dépendance ajoutée.
  Lockfiles inchangés.
- Ne modifier que `transformation/carburants.py`,
  `dbt/models/staging/stg_carburants.py` et `tests/test_carburants.py`.
- Ne pas modifier `SPEC.txt`, ce prompt, `CLAUDE.md`, `AGENTS.md`,
  `ROADMAP.md`, la CI, le `Makefile`, `stg_ipc.py`, les bruts, les modèles en
  aval, la publication ou le web.
- Scripts de parité et fichiers de mesure uniquement dans
  `/private/tmp/panyen_3b/`.
- Aucun commit, push, branche, remote ou PR.

SEULS MOTIFS DE STOP AVANT LA FIN

- Une empreinte de référence ne correspond pas au départ.
- La parité B ou C révèle une différence que tu ne sais pas expliquer par un
  bug du nouveau code.
- Le RSS maximal dépasse 2 Go ou la durée dépasse 20 min après une
  implémentation conforme.
- Une dépendance nouvelle ou une modification hors des trois fichiers devient
  indispensable.

Un test rouge ou une erreur d'implémentation se traite dans la boucle. Un
échec d'un modèle ou d'un test en aval pendant `make verifier-carburants` se
**rapporte** avec sa cause, mais ne se corrige pas ici.

VÉRIFICATION FINALE OBLIGATOIRE

1. `uv run ruff check .` et `uv run pytest` : rendre les compteurs réels.
2. Parité B : pour chaque ZIP, rendre le nombre d'observations et les SHA-256
   de la référence et du nouveau code.
3. Build mesuré : rendre la durée, le RSS maximal, les lignes par
   `fichier_source`, le total et les bornes de `releve_utc`. Parité C : rendre
   les comptes et SHA-256 relus depuis DuckDB.
4. `make verifier-carburants` : rendre le statut de chaque modèle et test.
5. `make verify` : rendre les compteurs réels.
6. Prouver que `uv.lock`, `web/package-lock.json` et les bruts sont
   inchangés.
7. `git diff --check`, puis relire le diff complet des trois fichiers.
8. `graphify update .`
9. Faire relire l'implémentation par `panyen_verifier` et corriger toute
   réserve bloquante avant le rapport.

RAPPORT

Rends un seul rapport : verdict ; fichiers touchés, avec quoi, où et pourquoi
en une phrase chacun ; tests et compteurs ; tableau de parité ; mesures
mémoire et durée ; résultat de `verifier-carburants` ; limites et risques.
Puis **STOP**. Ne committe pas et ne pousse pas.
