Tu implémentes une seule spec : **incrément 2 — étendre l'IPC aux quatre
postes**, écrite en entier dans `SPEC.txt` à la racine de `panyen`.
`SPEC.txt` fait autorité. En cas de divergence avec ce prompt, arrête-toi et
signale-la avant toute modification.

L'incrément 1 est validé, GREEN et coché. Tu l'étends, tu ne le refais pas.
Cette boucle ne touche ni aux carburants (incrément 3), ni au design final
(incrément 4), ni à la planification (incrément 5).

DÉMARRAGE ET FICHIERS DE DÉPART

1. Lire `AGENTS.md`, `SPEC.txt`, la règle méthodologique de `CLAUDE.md` et la
   section Incrément 2 de `ROADMAP.md`.
2. Utiliser Graphify avant toute lecture large, avec la commande réelle :

   `graphify query "Comment une observation SDMX traverse aujourd'hui le collecteur, le parseur, stg_ipc, le rebasage et la fact alimentaire jusqu'au Parquet et au front, et où le poste alimentation est-il codé en dur ?" --budget 1800`

   Confirmer ensuite dans `ingest/insee_ipc.py`, `transformation/sdmx.py`,
   `dbt/models/staging/stg_ipc.py`,
   `dbt/models/intermediate/int_ipc_alimentation_rebase.sql`,
   `dbt/models/marts/fct_differentiel_alimentation.sql`, les trois `schema.yml`,
   `dbt/tests/`, `dbt/seeds/`,
   `publication/publier_differentiel_alimentation.py`, `web/src/*.ts` et
   `Makefile`. Employer au besoin `graphify path`, `graphify explain`,
   `graphify affected` ou `rg`, jamais le graphe comme preuve unique.
3. Lire `docs/SOURCES.md` avant d'affirmer quoi que ce soit sur les séries.
4. Lire et appliquer `~/.claude/skills/verification-loop/SKILL.md` avant le
   rapport final.

OBJECTIF UTILISATEUR

Voir, poste par poste — alimentation, énergie, produits manufacturés, services —
si le différentiel d'évolution des prix entre la Martinique et la France
métropolitaine se creuse ou se resserre depuis avril 2022. Changer de poste sur
le site ne doit déclencher aucun appel serveur.

LES DEUX RÈGLES QUI PEUVENT FAIRE ÉCHOUER CETTE BOUCLE

**1. Aucune ancre ECSP hors alimentation.** L'ECSP 2022 publie ses écarts de
niveau par grandes fonctions COICOP (alimentaire +40 %, communications +37 %,
santé +13 %…). Les postes IPC « produits manufacturés » et « services »
traversent plusieurs de ces fonctions : l'habillement et les biens de santé sont
des produits manufacturés, les communications et les services de santé sont des
services. Aucune correspondance n'est publiée par l'Insee.

Donc : `ecart_ecsp_2022_pct`, `ecart_prix_estime_pct`, `source_ecsp` et
`nature_ecart` sont **NULL** pour `energie`, `produits_manufactures` et
`services`. Inventer, interpoler, emprunter ou approcher une ancre pour ces
postes est un bug bloquant. Si tu crois avoir trouvé une correspondance sourcée,
**STOP** et signale-la : ce n'est pas ta décision.

**2. Jamais de comparaison de niveaux entre territoires.** Les facteurs et les
évolutions se calculent à l'intérieur d'un seul territoire et d'un seul poste,
ancrés sur `2022-04-01`. `differentiel_evolution_points` et `coefficient_ecart`
comparent des évolutions, c'est licite ; aucun niveau d'indice ne sort de
`int_ipc_rebase`.

IDBANKS — VÉRIFIÉS LE 2026-09-06, À NE PAS RE-CHERCHER

| poste                 | valeur `poste`          | France métropolitaine (`FM`) | Martinique (`D972`) |
|-----------------------|-------------------------|------------------------------|---------------------|
| Alimentation          | `alimentation`          | `011813720`                  | `011813726`         |
| Énergie               | `energie`               | `011813867`                  | `011813873`         |
| Produits manufacturés | `produits_manufactures` | `011813783`                  | `011813789`         |
| Services              | `services`              | `011813909`                  | `011813915`         |

Mesuré en un appel avec `startPeriod=2022-04` : 52 observations par série,
2022-04 → 2026-07, aucun statut autre que `A`, base 2025, ensemble des ménages.
Si ta collecte donne autre chose, dis-le au lieu de l'absorber.

CONTRAT D'IMPLÉMENTATION — RÉSUMÉ EXÉCUTABLE

Collecte — `ingest/insee_ipc.py`
- Un référentiel de huit idbanks portant poste, territoire et libellé ; ordre
  déterministe ; un seul appel HTTP ; `startPeriod=2022-04` inchangé.
- Le brut s'appelle désormais `ipc_postes_<AAAA-MM-JJTHHMMSSZ>.xml`. Ouverture
  en `"xb"`. `--dry-run` garde son contrat : requête réelle, aucune écriture.

Parsing — `transformation/sdmx.py`
- Référentiel `idbank → (poste, code_territoire)` sur neuf entrées, dont
  `011813717` (`FE`, alimentation, historique).
- `Observation` gagne `poste`.
- Le lot autorisé est déduit du **préfixe du nom de fichier** :
  `ipc_alimentation_` → exactement `{726, 717}` ou exactement `{726, 720}` ;
  `ipc_postes_` → exactement les huit idbanks actifs. Tout autre ensemble lève
  `ErreurSdmx` en nommant le fichier et les idbanks fautifs.
- Les deux XML historiques restent lus, jamais renommés, jamais réécrits.
- Conserver `FREQ = M`, la cohérence `idbank → REF_AREA`, le refus des doublons
  `(idbank, periode)`, les attributs obligatoires, `OBS_VALUE` absent toléré
  seulement si `OBS_STATUS = 'ND'`, et l'horodatage lu dans le nom du fichier.

dbt
- Renommer sans alias : `int_ipc_alimentation_rebase` → `int_ipc_rebase`,
  `fct_differentiel_alimentation` → `fct_differentiel_ipc`.
- `stg_ipc` gagne `poste` et `lot_collecte`
  (`alimentation_france_entiere`, `alimentation_france_metropolitaine`,
  `quatre_postes_france_metropolitaine`). Grain inchangé.
- `int_ipc_rebase` : lot actif = fichier `quatre_postes_france_metropolitaine` le
  plus récent ; **aucun lot actif ⇒ échec bruyant**, jamais un repli sur
  l'ancien lot alimentaire. `dernier_mois_commun` = minimum des derniers mois
  renseignés des huit séries, **valeur unique** partagée par les quatre postes.
  Calendrier mensuel complet de `2022-04-01` à cette borne, croisé avec les huit
  couples attendus.
- `fct_differentiel_ipc`, grain `(poste, periode)`, colonnes dans l'ordre exact
  donné par `SPEC.txt`, avec `libelle_poste` accentué et `ancre_ecsp_disponible`.
  `left join` sur le seed `ecsp_alimentation_2022`, qui n'est pas modifié.
- Le poste ne doit pas être traité par quatre blocs copiés : une seule logique,
  paramétrée par le référentiel.

Tests dbt exigés
- Grain unique `(poste, periode)`.
- Quatre postes, même ensemble de périodes pour chacun.
- `dernier_mois_commun` unique et égal au `max(periode)` de chaque poste.
- **Garde-fou d'ancre** : `ancre_ecsp_disponible` vrai exactement pour
  l'alimentation ; les quatre colonnes ECSP toutes non nulles quand il est vrai,
  toutes nulles quand il est faux, aucun état mixte.
- Identités arithmétiques recalculées en SQL, tolérance `1e-9`.
- Garde-fou « indice entre 50 et 200 » conservé.
- Aucune colonne de niveau d'indice ne sort de `int_ipc_rebase`.

Publication
- `publier_differentiel_alimentation.py` → `publier_differentiel_ipc.py`, table
  `fct_differentiel_ipc`, destination `web/public/data/differentiel_ipc.parquet`,
  tri `poste, periode`.
- Ordre strict conservé : vérifier → exporter → valider → `os.replace` en
  dernière mutation, candidat nettoyé sur erreur, refus de publier une colonne
  `valeur_indice`. `make publier` pointe la nouvelle cible.

Front
- `types.ts`, `chargement.ts`, `validation.ts`, `calculs.ts`, `rendu.ts`,
  `graphe.ts` : nouvelles colonnes, champs ECSP nullables, valeurs nulles jamais
  converties en `0`, `NaN` ou `"null"`.
- La validation refuse : un poste manquant, des périodes désalignées entre
  postes, un `dernier_mois_commun` non unique, un champ ECSP non nul sur un poste
  sans ancre. Chaque erreur nomme le poste fautif.
- Deux récits. Avec ancre : le récit de 1.6, intact. Sans ancre : évolution de
  chaque territoire, différentiel en points, minimum et maximum du différentiel,
  conclusion **en points** — pas de panier illustratif, pas d'écart de prix.
- Sélecteur des quatre postes, accessible au clavier, `alimentation` par défaut,
  redessin depuis les lignes déjà en mémoire, **zéro requête**.
- Pour un poste sans ancre, une note visible explique que l'ECSP mesure par
  fonction de consommation, que ce découpage ne recouvre pas ce poste IPC, et
  que seule l'évolution est comparable.
- La limite méthodologique de 1.6 reste affichée partout. Le cycle
  `ResizeObserver` validé en 1.6 ne doit pas régresser.

PÉRIMÈTRE ET FICHIERS TOUCHABLES

- Nouveau : un `data/raw/insee/ipc_postes_<horodatage>.xml`,
  `int_ipc_rebase.sql`, `fct_differentiel_ipc.sql`, les tests dbt associés,
  `publication/publier_differentiel_ipc.py`, les fixtures XML de test.
- Modification : `ingest/insee_ipc.py`, `transformation/sdmx.py`, `stg_ipc.py`,
  les trois `schema.yml`, `Makefile`, `web/src/*.ts`, `tests/*.py`,
  `docs/SOURCES.md`, `README.md`.
- Suppression : modèles, tests et script renommés, et leurs tests obsolètes.
- Aucun autre fichier ; minimiser le diff.

NON-OBJECTIFS

- Aucune ancre ECSP fabriquée, estimée ou empruntée hors alimentation.
- Aucune comparaison de niveaux d'indice entre territoires.
- Aucun sous-poste (produits frais, produits pétroliers, habillement, santé,
  loyers), aucun autre territoire, aucune série « Ensemble ».
- Aucun travail sur les carburants ni sur le Bouclier Qualité Prix.
- Aucune refonte visuelle : le sélecteur est sobre et fonctionnel.
- Pas de superposition des quatre postes sur un même graphe.
- Ne modifier ni le seed ECSP, ni `CLAUDE.md`, `AGENTS.md`, `SPEC.txt`, le
  workflow CI, les lockfiles ou les dépendances.
- Ne pas cocher l'incrément 2 dans `ROADMAP.md` : Mathis coche après revue.
- Ne pas planifier de collecte, ne pas déployer.
- Ne créer ni branche, commit, push ou PR.

TESTS ET VÉRIFICATION

1. Capturer les SHA256 des deux XML historiques et des lockfiles.
2. Lancer **une seule fois** `uv run python ingest/insee_ipc.py`. Rendre nom,
   taille, SHA256 du nouveau brut et le nombre d'observations par série. Prouver
   que les deux XML historiques sont inchangés.
3. Étendre les tests Python : fixture huit séries acceptée ; `ipc_postes_` à sept
   séries refusé ; idbank surnuméraire refusé ; paire mélangée refusée ; les deux
   fixtures alimentaires toujours lues ; `--dry-run` sans écriture ni réseau,
   avec réponse synthétique.
4. Étendre les tests de publication : renommage, tri `poste, periode`, table vide
   ou absente, nettoyage du candidat, refus d'une colonne de niveau.
5. Étendre les tests Vitest : quatre postes validés, poste manquant rejeté,
   périodes désalignées rejetées, champ ECSP non nul sur poste sans ancre rejeté,
   récit réduit correct, bascule de poste sans appel réseau.
6. Exécuter `make ci` et rendre les compteurs **réellement obtenus**. Les 44
   pytest, 91 tests dbt et 36 Vitest de l'incrément 1 sont un plancher, pas une
   cible. Ne prédis aucun compteur.
7. Exécuter `make publier` ; rendre chemin, taille, SHA256, lignes, postes et
   bornes de période. Attendu à confirmer, pas à présumer : 4 postes, 52 mois,
   208 lignes.
8. Contrôler à la main dans le Parquet : `ecart_prix_estime_pct` non nul
   uniquement sur l'alimentation, aucune colonne de niveau d'indice.
9. Prouver que les lockfiles sont inchangés.
10. `git diff --check`, diff complet relu, `git status --short --branch`.
11. Exécuter `graphify update .`, puis rejouer la requête Graphify de départ.
12. Faire relire le changement par `panyen_verifier`.

FINI

Une commande reconstruit les quatre postes depuis le brut versionné ; les quatre
postes traversent la même chaîne sans logique dupliquée ; le dernier mois commun
est unique, explicite et affiché ; un test cassé empêche la publication ; aucun
écart de niveau n'apparaît hors alimentation et le site dit pourquoi ; le
changement de poste ne déclenche aucun appel serveur ; `make ci` et
`panyen_verifier` sont verts.

Rendre : verdict ; fichiers touchés ; brut collecté et son empreinte ; preuve
d'immutabilité des XML historiques et des lockfiles ; sortie de `make ci` avec
compteurs réels ; sortie de `make publier` ; contrôle manuel du Parquet ;
extrait du diff sur le garde-fou d'ancre ; risques restants.

Puis **STOP**. Ne coche pas l'incrément 2, ne committe pas, ne pousse pas et ne
commence pas l'incrément 3.
