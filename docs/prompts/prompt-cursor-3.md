Tu implémentes une seule spec : **Incrément 3 — tranche verticale carburants**,
écrite en entier dans `SPEC.txt` à la racine de `panyen`. `SPEC.txt` fait
autorité. En cas de divergence avec ce prompt, arrête-toi avant toute
modification et signale précisément la contradiction.

Cette boucle est volontairement verticale : elle va des sources à l'écran. Les
portes A à D de la spec sont des contrôles internes, pas des livraisons
séparées. Quand une porte est verte, poursuis immédiatement. Ne demande pas
l'autorisation de passer à la suivante et ne rends qu'un seul rapport final.

DÉMARRAGE ET NAVIGATION

1. Lire `AGENTS.md`, `SPEC.txt`, `CLAUDE.md`, la section Incrément 3 de
   `ROADMAP.md`, puis les sections 4 et 5 de `docs/SOURCES.md`.
2. Capturer `git status --short --branch`, `git log -1 --oneline` et les
   empreintes initiales demandées par la spec. L'arbre contient déjà des
   changements de cadrage appartenant à Mathis : ne les annule pas.
3. Utiliser Graphify avant toute lecture large avec la commande réelle :

   `graphify query "Comment relier dans panyen la collecte brute immuable, les modèles dbt, la publication Parquet atomique et l'écran statique pour livrer toute la tranche carburants sans dégrader la tranche IPC ?" --budget 1800`

   Confirmer ensuite les conclusions dans les fichiers sources. Commencer par
   `ingest/insee_ipc.py`, `transformation/sdmx.py`, les modèles et tests dbt,
   `publication/publier_differentiel_ipc.py`, `Makefile`, puis
   `web/src/chargement.ts`, `web/src/rendu.ts`, `web/src/graphe.ts` et leurs
   tests. Employer au besoin `graphify path`, `graphify explain`,
   `graphify affected` ou `rg` ; le graphe n'est jamais la preuve unique.
4. Rechercher dans les documentations officielles les solutions maintenues
   avant d'ajouter une dépendance. Réutiliser en priorité la bibliothèque
   standard, DuckDB/dbt, hyparquet et Plot déjà présents.
5. Lire et appliquer `~/.claude/skills/verification-loop/SKILL.md` avant le
   rapport final.

OBJECTIF UTILISATEUR

Le site statique doit permettre de situer la distribution mensuelle des prix
déclarés par les stations métropolitaines par rapport aux plafonds
réglementaires martiniquais depuis avril 2022. La différence de régime doit
être explicite : distribution de prix déclarés d'un côté, maximum administratif
uniforme de l'autre. Chaque chiffre doit remonter à un brut et une URL
officielle.

CONTRAT À NE PAS DÉGRADER

- `ingest/` télécharge et range uniquement ; aucun parsing ni correction métier.
- Bruts octet pour octet, horodatés UTC, sidecars SHA-256, aucune collision ni
  réécriture ; `data/raw/carburants/` reste ignoré par Git.
- Parsing et transcriptions sourcées seulement en aval.
- Tests et CI sans réseau ; collecte et publication restent manuelles.
- Aucune comparaison de niveaux d'indices IPC territoriaux ; ne modifie pas les
  résultats de la tranche IPC/ECSP existante.
- Aucun proxy silencieux entre carburants. SP95, SP98 et E10 ne sont ni agrégés
  ni assimilés au supercarburant martiniquais sans preuve officielle.
- Aucun commit, push, branche, remote ou PR.

SEULS MOTIFS DE STOP AVANT LA FIN

Après recherche diligente dans les sources officielles, STOP et demande
l'arbitrage de Mathis seulement si :

- un acte/mois reste introuvable, illisible ou contradictoire ;
- aucune correspondance de produit directe ne permet une comparaison honnête ;
- un secret, une infrastructure distante, une mutation destructive ou un choix
  produit hors spec devient indispensable.

Un volume élevé, une difficulté d'implémentation ou un test rouge se traite dans
la boucle : diagnostiquer, corriger et continuer.

ARBITRAGE APRÈS LE STOP SUR LE CORPUS MARTINIQUAIS

- Ne transforme pas en masse les communiqués en sources primaires. Une exception
  `communique_exception` reste décidée acte par acte, avec `motif_exception`,
  seulement après échec documenté de la recherche dans les index RAAP/RAA,
  leurs sous-pages mensuelles et les actes individuels officiels.
- L'archive préfectorale est navigable par année, type de recueil, mois et
  pagination. Pour 2022, consulter notamment `RAAP-2022/RAAP` et
  `RAAP-2022/Editions-speciales`, puis leurs pages mensuelles ; ne pas conclure
  à une absence depuis la seule page d'archive racine ou un moteur de recherche.
- L'ancre `2022-11-16` est résolue par le RAA `R02-2022-309`, publié le
  15 novembre 2022. Il contient, pages 3 à 8, l'arrêté
  `R02-2022-11-15-00003`, signé le 15 novembre et applicable du 16 au
  30 novembre 2022 :
  `https://www.martinique.gouv.fr/contenu/telechargement/20144/136508/file/RAA-02-2022-309.pdf`.
- La page 4 de l'arrêté (page 6 du PDF) fixe les prix maximum affichés à la pompe
  avec la réduction alors applicable : `1.68` EUR/L pour « Super carburant sans
  plomb » et `1.81` EUR/L pour « Gazole routier ». Relis visuellement ces valeurs
  dans le PDF avant saisie et inclus-les dans la double lecture finale.
- Une couche texte limitée aux en-têtes ne rend pas un acte absent : conformément
  à `SPEC.txt`, rends seulement les pages nécessaires pour lecture humaine et
  transcris les valeurs sourcées. N'ajoute ni OCR ni parseur PDF générique.
- Si une autre période reste réellement sans acte après ce parcours, le prochain
  STOP doit lister les dates d'effet exactes encore manquantes, les URL d'index
  consultées, les téléchargements tentés et les communiqués officiels disponibles.
  Il ne doit plus porter globalement sur « 2022–2024 ».

PORTE A — SOURCES ET COLLECTE

1. Inventorier d'abord les sources officielles, puis créer les deux manifestes
   exacts de `SPEC.txt` : actes martiniquais et correspondances produits.
2. Le manifeste des actes couvre chaque mois de `2022-04-01` à `2026-09-01`,
   conserve toutes les dates d'effet et contient `2022-11-16`. Un RAA/RAAP ou
   arrêté est primaire ; un communiqué est secondaire sauf exception motivée.
3. Créer le seed réglementaire au grain `(carburant_mq, debut_effet)`. Chaque
   prix en euros/litre, libellé, page, référence et URL est recopié du document
   primaire et recoupé avec le manifeste. Aucune valeur issue d'un résumé ou
   d'une intuition.
4. Dans le manifeste de correspondance, classer chaque produit `directe` ou
   `non_comparable` avec justification officielle. Seules les correspondances
   directes passent dans le graphique. S'il en existe au moins une, continuer
   sans demander de décision et documenter les exclusions.
5. Créer `ingest/prix_carburants_national.py` pour exactement les quatre
   archives annuelles 2022–2025, `/annee` pour 2026 et `/jour`. Ne pas inventer
   `/annee/2026`. Valider le ZIP et ses membres XML sans les extraire ni lire
   les prix.
6. Créer `ingest/arretes_carburants_martinique.py` pour les URL uniques du
   manifeste, avec documents primaires et communiqués distincts.
7. Implémenter le contrat commun : timeout, User-Agent, brut intact, sidecar,
   ouverture exclusive, sortie chemin/taille/SHA-256, erreur bruyante et
   `--dry-run` sans aucune écriture.
8. Ajouter les trois cibles de collecte prévues. Elles ne doivent être appelées
   ni par `make verify`, ni par `make ci`.
9. Écrire tous les tests synthétiques de la porte A avant la collecte réelle.
   Le nombre d'actes et de périodes est mesuré, jamais codé comme présupposé.

Quand le corpus est complet et au moins une correspondance directe est sourcée,
poursuis immédiatement avec la porte B.

PORTE B — PARSING ET MODÈLES

1. Inspecter un XML réel de chaque archive 2022–2025 et du stock 2026. Noter les
   variantes de schéma réellement vues ; ne coder aucune heuristique destinée à
   masquer une variante inconnue.
2. Créer `transformation/carburants.py`, testé sur ZIP/XML synthétiques, puis
   `stg_carburants.py`. Lire les membres en mémoire sans extraction sur disque,
   valider unités, dates et valeurs, et conserver la provenance complète.
3. Utiliser les archives 2022–2025 et le dernier stock 2026 pour l'historique.
   Ne pas joindre `/jour`, qui recouvre le stock et sert seulement au contrôle
   du point d'entrée courant.
4. Implémenter exactement les grains et modèles de `SPEC.txt` :
   `stg_carburants`, `stg_arretes`, `fct_carburant_station`,
   `int_carburant_station_mois`, `fct_distribution_carburants_metropole`,
   `fct_prix_max_mq`, puis `fct_comparaison_carburants`.
5. Une station ne compte qu'une fois par carburant et mois : retenir sa dernière
   déclaration du mois. Ne pas reporter sa dernière valeur sur un mois sans
   déclaration. Les doublons identiques sont dédupliqués déterministement ; un
   même grain avec deux prix différents échoue.
6. Calculer q10, q25, médiane, q75, q90 et nombre de stations. Septembre 2026 est
   conservé avec `mois_complet=false`. Une baisse de plus de 30 % entre deux
   mois complets fait échouer le build.
7. Construire les périodes martiniquaises par date d'effet, fin exclusive au
   prochain acte et dernière fin `NULL`. Tester explicitement `2022-11-16`.
8. Produire l'union de publication avec l'ordre exact de colonnes de la spec et
   une nullabilité discriminée par `type_ligne`.
9. Ajouter tests de schéma, données et unités dbt ainsi que les tests Python. Le
   build réel peut avoir une cible `verifier-carburants` dépendant des bruts ;
   `make verify` doit rester hors réseau tout en exécutant tests unitaires,
   parsing dbt, tests web et build existant.

Quand grains, volumes et garde-fous sont verts sur données réelles, poursuis
immédiatement avec la porte C.

PORTE C — PUBLICATION

1. Créer `publication/publier_carburants.py` en réutilisant la structure déjà
   éprouvée : vérifier → build réel → exporter candidat → relire et comparer
   exactement → `os.replace` en dernier.
2. Publier un seul fichier `web/public/data/carburants.parquet`, copie exacte et
   ordonnée de `fct_comparaison_carburants`.
3. Tout échec conserve l'ancien fichier et supprime le candidat. Tester
   vérification rouge, table absente/vide, schéma/contenu faux, candidat
   invalide et ordre du remplacement.
4. Ajouter `publier-carburants`, puis `carburants` qui compose collecte et
   publication. Conserver le sens de la cible IPC `publier`.

Quand le Parquet réel est validé et empreinté, poursuis immédiatement avec la
porte D.

PORTE D — ÉCRAN MINIMAL

1. Ajouter un choix explicite entre vue IPC et vue Carburants. L'écran IPC doit
   conserver son comportement et ses résultats.
2. Créer des types, validation, chargement, calculs, rendu et graphique
   carburants séparés quand cela évite de grossir les modules IPC. Réutiliser
   hyparquet, Plot, redessin responsive et nettoyage existants.
3. Pour chaque produit directement comparable, afficher : ruban q10–q90,
   repère q25–q75, médiane et plafond martiniquais en escalier aux dates exactes.
   Un seul axe en euros/litre ; aucun double axe.
4. Afficher nombre de stations, période, collecte nationale, référence et lien
   de l'acte. Marquer septembre 2026 incomplet et expliquer les produits non
   comparables sans leur tracer de proxy.
5. Expliquer à l'écran : métropole seulement pour le flux national ; prix
   déclarés versus maximum réglementaire ; aucune observation des prix
   effectivement payés en Martinique.
6. Données absentes ou invalides = écran d'erreur explicite, jamais de fallback
   ni de graphique partiel.
7. Tester validation discriminée, tri, filtres, labels, provenance, erreur,
   responsive 375/390/1440 px, nettoyage d'observateurs et absence de double
   axe. Ne fais pas la refonte visuelle de l'incrément 4.

FICHIERS ET NON-OBJECTIFS

Les créations et modifications autorisées sont celles listées dans
`SPEC.txt`. En particulier, les collecteurs, manifestes, seed, transformation,
modèles/tests dbt, publication/tests, modules/tests web, `Makefile`, `README.md`
et les précisions de sources réellement découvertes sont dans le périmètre.

Ne modifie pas le workflow CI, `CLAUDE.md`, `AGENTS.md`, `SPEC.txt`, ce prompt,
le fond de la chaîne IPC/ECSP ni ses données brutes. N'ajoute ni OCR, serveur,
stockage distant, automatisation, carte, enseigne, gaz en bouteille, fioul ou
proxy de carburant. Ne commence pas l'incrément 4.

VÉRIFICATION FINALE OBLIGATOIRE

1. Exécuter les tests hors réseau et la collecte réelle complète.
2. Double-relire chaque prix réglementaire contre son acte primaire.
3. Exécuter le build réel et rendre grains, lignes, bornes, produits, volumes
   mensuels, baisses maximales et mois incomplets.
4. Exécuter `make verify` et rendre les compteurs réellement obtenus.
5. Publier réellement ; rendre chemin, taille, SHA-256, lignes et bornes.
6. Démontrer par test qu'un échec conserve l'ancien Parquet.
7. Vérifier dans le navigateur les deux vues à 375, 390 et 1440 px, console
   comprise ; placer les captures uniquement dans `/private/tmp`.
8. Prouver que les bruts Insee et les résultats IPC sont inchangés ; justifier
   toute évolution de lockfile.
9. Exécuter `git diff --check`, relire tout le diff et rechercher tout ancien
   nom de sous-incrément ou instruction devenue contradictoire.
10. Exécuter `graphify update .`, puis rejouer la requête initiale et confirmer
    la tranche complète dans les fichiers sources.
11. Faire relire l'implémentation par `panyen_verifier` et corriger toute réserve
    bloquante avant le rapport.
12. Cocher les lignes de l'incrément 3 dans `ROADMAP.md` seulement après toutes
    ces preuves.

FINI ET RAPPORT

La tranche est finie lorsqu'une commande manuelle collecte, construit, vérifie
et publie ; qu'au moins un produit réellement équivalent est comparé dans le
site statique ; que provenance, régime de prix, dates d'effet et mois incomplet
sont visibles ; et que toutes les vérifications sont vertes.

Rends un seul rapport : verdict, fichiers touchés, décisions de comparabilité,
inventaire et empreintes, grains/volumes/bornes, tests et compteurs, preuve de
publication atomique, vérification visuelle, limites et risques. Puis **STOP
avant l'incrément 4**. Ne committe pas et ne pousse pas.
