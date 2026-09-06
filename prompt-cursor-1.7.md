Tu implémentes une seule spec : **1.7 — CI reproductible de la tranche
alimentaire**, écrite en entier dans `SPEC.txt` à la racine de `panyen`.
`SPEC.txt` fait autorité. En cas de divergence avec ce prompt, arrête-toi et
signale-la avant toute modification.

1.6 est validée et ne doit plus être modifiée. Le worktree contient toute cette
tranche non commitée : préserve-la. Cette boucle ajoute seulement la CI ; elle ne
commence ni les autres IPC, ni les carburants, ni le design final.

DÉMARRAGE ET FICHIERS DE DÉPART

1. Lire `AGENTS.md`, `SPEC.txt`, la règle méthodologique de `CLAUDE.md` et la
   section Incrément 1 de `ROADMAP.md`.
2. Utiliser Graphify avant toute lecture large avec la commande réelle :

   `graphify query "Quelles commandes installent et vérifient aujourd’hui la tranche alimentaire, quels lockfiles les rendent reproductibles et quel dry-run est couvert sans réseau ?" --budget 1800`

   Confirmer dans `Makefile`, `pyproject.toml`, `.python-version`,
   `web/package.json`, `uv.lock`, `web/package-lock.json`,
   `tests/test_insee_ipc.py` et `README.md`. Employer au besoin
   `graphify path`, `graphify explain`, `graphify affected` ou `rg`, jamais
   le graphe comme preuve unique.
3. Vérifier dans les sources officielles les actions maintenues et la
   correspondance exacte tag/SHA avant d’écrire le YAML :
   - https://docs.astral.sh/uv/guides/integration/github/
   - https://github.com/actions/checkout
   - https://github.com/actions/setup-python
   - https://github.com/actions/setup-node
   - https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching
4. Lire et appliquer `~/.claude/skills/verification-loop/SKILL.md` avant le
   rapport final.

OBJECTIF UTILISATEUR

Sur chaque pull request, push sur `main` et lancement manuel, un clone propre
doit installer les dépendances verrouillées puis exécuter lint Python, tests
Python, dbt, tests web et build statique. Une erreur bloque le job.

DÉCISION DRY-RUN

N’appelle pas l’API Insee dans la CI. Le CLI `--dry-run` effectue une vraie
requête avant de ne rien écrire : ce serait une dépendance externe instable. Le
contrat reproductible est son test existant avec réponse synthétique,
`test_dry_run_n_ecrit_rien`. Le smoke test live reste en incrément 5.

CONTRAT D’IMPLÉMENTATION

- Ajouter `make ci` et `ci` à `.PHONY`. Cette cible réemploie
  l’installation existante puis `make verify`, sans recopier ses commandes.
- Créer `.node-version` avec `24.9.0`.
- Créer seulement `.github/workflows/ci.yml`.
- Déclencheurs : `pull_request`, push sur `main`, `workflow_dispatch`.
- Permissions workflow : `contents: read`.
- Un job `verification`, `ubuntu-24.04`, timeout 15 minutes, concurrence par
  workflow/référence avec annulation de l’exécution précédente.
- Étapes : checkout ; Python lu depuis `.python-version` ; setup-uv avec binaire
  `0.12.7` et cache `uv.lock` ; Node lu depuis `.node-version` avec cache npm
  `web/package-lock.json` ; `make ci`.
- Faire appliquer `UV_LOCKED=1` par la cible `make ci` pendant `make verify`, afin
  que le contrat soit identique localement et dans GitHub Actions.
- Épingler chaque action par SHA complet et commenter le tag stable :
  - `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1` — v7.0.1 ;
  - `actions/setup-python@5fda3b95a4ea91299a34e894583c3862153e4b97` — v7.0.0 ;
  - `actions/setup-node@820762786026740c76f36085b0efc47a31fe5020` — v7.0.0 ;
  - `astral-sh/setup-uv@c771a70e6277c0a99b617c7a806ffedaca235ff9` — v9.0.0.
  STOP si la vérification officielle ne confirme pas une correspondance.
- Après `make ci`, vérifier que `data/raw/insee/` n’a pas changé.
- Documenter brièvement dans `README.md` : commande locale, déclencheurs,
  absence de réseau métier, de publication et de déploiement.

PÉRIMÈTRE ET FICHIERS TOUCHABLES

- Nouveau : `.github/workflows/ci.yml`, `.node-version`.
- Modification : `Makefile`, `README.md`.
- Tests uniquement si une petite preuve utile manque réellement.
- Aucun autre fichier ; minimiser le diff.

NON-OBJECTIFS

- Aucun changement de code Python/TypeScript/SQL, test métier, graphe, style,
  calcul, donnée, Parquet, seed, modèle dbt, schéma, lockfile ou dépendance.
- Aucune collecte live, publication, matrice, Docker, action maison, Dependabot,
  badge, artifact, couverture ou déploiement.
- Aucun secret ni permission d’écriture.
- Ne modifier ni `SPEC.txt`, `AGENTS.md`, `CLAUDE.md` ou `ROADMAP.md`.
- Ne pas cocher 1.7 : sans remote, l’exécution GitHub réelle reste non prouvée.
- Ne pas créer de remote, branche, commit, push ou PR.
- Ne pas commencer l’incrément 2 ou 4.

TESTS ET VÉRIFICATION

- Capturer avant exécution les empreintes des deux lockfiles et des bruts Insee.
- Exécuter `make ci` et rendre les résultats détaillés : Ruff, 44 pytest dont le
  dry-run synthétique, dbt 91/91, 36 Vitest et build Vite.
- Prouver ensuite que `uv.lock`, `web/package-lock.json` et
  `data/raw/insee/` sont inchangés.
- Parser le YAML avec un parseur déjà présent, sans ajouter de dépendance.
- Auditer manuellement déclencheurs, permissions, SHA, versions, caches, ordre,
  timeout et absence de secret/publication/collecte.
- `git diff --check`, diff complet et `git status --short --branch`.
- Exécuter `graphify update .`, puis rejouer la requête initiale.
- Faire relire le changement par `panyen_verifier`.

FINI

`make ci` réussit, les lockfiles et bruts restent intacts, le workflow reflète
exactement cette commande avec permissions minimales et actions épinglées, le
dry-run est couvert hors réseau, et `panyen_verifier` accepte. Le rapport doit
indiquer honnêtement que l’exécution GitHub distante attend un futur remote/push.

Rendre : verdict local ; fichiers touchés ; versions/SHA ; sortie de `make ci` ;
preuves d’immutabilité ; audit YAML ; preuve GitHub distante encore absente ;
risques.

Puis **STOP**. Ne committe pas, ne pousse pas, ne coche pas 1.7 et ne commence
aucun incrément suivant.
