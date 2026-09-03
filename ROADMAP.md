# ROADMAP — panyen

Le projet avance par **incréments vérifiables**, sans calendrier artificiel. Un
seul incrément est actif à la fois et sa commande de vérification doit être connue
avant de coder. `SPEC.txt` contient uniquement la spec active ; elle est remplacée
au passage à l'incrément suivant. Son historique sera conservé par Git dès
l'initialisation du dépôt.

## Règles de passage

1. Définir l'objectif utilisateur, les contraintes, les non-objectifs et le fini.
2. Ne comparer 2 ou 3 architectures que si le choix est réellement structurant.
3. Rechercher les solutions maintenues existantes avant toute infrastructure maison.
4. Choisir le plus petit incrément vertical utile.
5. Vérifier la structure du repo et `CLAUDE.md` avant l'implémentation.
6. Implémenter par petites étapes observables.
7. Exécuter build/tests et documenter la commande de lancement.

---

## Incrément 0 — Cadrage et réemploi

**But** : verrouiller les choix structurants nécessaires à la première tranche,
avec des preuves issues en priorité des documentations officielles.

- [x] Confirmer objectif utilisateur, contraintes, non-objectifs et réussite.
- [x] Auditer le repo et conserver ce qui est déjà suffisant.
- [x] Rechercher les solutions existantes pour l'environnement Python, SDMX,
      DuckDB/dbt, export Parquet, frontend statique, graphiques et CI.
- [x] Ne produire 2 ou 3 architectures que pour les choix ayant un vrai impact.
- [x] Décider la chaîne minimale et les commandes de build/test/lancement.

**Fini quand** : chaque brique à utiliser possède une décision courte et sourcée,
les créations maison sont justifiées, et l'incrément 1 peut être spécifié sans
question d'architecture ouverte.

---

## Incrément 1 — Tranche verticale alimentation

**But utilisateur** : voir si le différentiel d'évolution des prix alimentaires
entre la Martinique et la France métropolitaine se creuse ou se resserre depuis
avril 2022.

- [x] **1.1 — Socle reproductible** : Git, uv/Python, dbt-duckdb, Vite et commandes.
- [x] **1.2 — Collecte IPC alimentaire** : deux séries, brut horodaté, dry-run, tests.
- [x] **1.3 — Staging SDMX** : parsing aval, provenance et tests de structure.
- [x] **1.3b — Périmètre géographique** : passer la référence active de France
      entière à France métropolitaine, sans effacer le brut historique.
- [x] **1.4 — Différentiel alimentaire** : appariement, rebasage, calculs et tests dbt.
- [x] **1.5 — Publication sûre** : Parquet remplacé seulement après tests verts.
- [ ] **1.6 — Écran alimentaire minimal** : lecture Parquet navigateur, Plot et
      limite méthodologique.
- [ ] **1.7 — CI de la tranche** : lint, tests, build et dry-run reproductibles.

**Fini quand** : une commande reconstruit la tranche depuis le brut, un test cassé
empêche la publication, chaque chiffre est traçable et aucun niveau d'indice
territorial n'est comparé.

---

## Incrément 2 — Étendre les IPC

**But utilisateur** : comparer le différentiel d'évolution selon le poste de
dépense.

- [ ] Identifier et vérifier les idbanks France/Martinique pour énergie,
      produits manufacturés et services.
- [ ] Documenter les huit séries d'indice dans `docs/SOURCES.md`.
- [ ] Étendre les modèles et tests sans dupliquer la logique alimentation.
- [ ] Ajouter le sélecteur de poste au front.

**Fini quand** : les quatre postes passent par la même chaîne vérifiée, le dernier
mois commun est explicite et le changement de poste ne déclenche aucun appel serveur.

---

## Incrément 3 — Tranche verticale carburants

**But utilisateur** : comparer la distribution des prix métropolitains au plafond
mensuel martiniquais, deux régimes de prix explicitement différents.

- [ ] Collecter le flux national quotidien et une archive annuelle en brut.
- [ ] Collecter ou saisir les arrêtés martiniquais avec leur source exacte.
- [ ] Construire `stg_carburants`, `stg_arretes`, `fct_carburant_station` et
      `fct_prix_max_mq` avec grains déclarés.
- [ ] Tester les valeurs acceptées et les chutes de volumétrie supérieures à 30 %.
- [ ] Afficher distribution métropolitaine et plafonds martiniquais en escalier.

**Fini quand** : les deux sources sont rejouables et traçables, l'absence des DOM
dans le flux national est expliquée et aucune donnée manquante n'est masquée.

---

## Incrément 4 — Interface finale accessible

**But utilisateur** : comprendre le résultat, sa période et ses limites sans
connaître les indices de prix.

- [ ] Rechercher et choisir des bibliothèques maintenues avant tout composant maison.
- [ ] Produire trois variantes de l'écran principal, puis en choisir une.
- [ ] Finaliser les écrans ECSP 2022, IPC et carburants.
- [ ] Valider palette daltonisme, thèmes clair/sombre, légendes, labels directs,
      chiffres tabulaires et absence de double axe.
- [ ] Garder les interactions fréquentes sobres ; animations sous 300 ms,
      `transform`/`opacity`, survols adaptés et `prefers-reduced-motion`.

**Fini quand** : la page s'ouvre sans serveur applicatif, les filtres sont locaux,
la palette est validée dans les deux thèmes et la revue d'animations est sans réserve.

---

## Incrément 5 — Automatisation et fraîcheur

**But utilisateur** : savoir si les données sont actuelles et fiables.

- [ ] Planifier la collecte quotidienne des carburants et mensuelle des IPC.
- [ ] Conditionner la publication du Parquet au succès de tous les tests.
- [ ] Afficher source, dernière ingestion, âge, volumétrie et état des tests.
- [ ] Déployer la version statique.

**Fini quand** : une exécution planifiée met le site à jour sans intervention et
une exécution cassée conserve la dernière version saine.

---

## Incrément 6 — Reproductibilité et publication

**But utilisateur** : permettre à un tiers de comprendre et reproduire le projet.

- [ ] Finaliser le README : question, capture, garanties, limites et décisions.
- [ ] Associer chaque chiffre public à sa source et à sa commande de reproduction.
- [ ] Documenter installation, build, tests et lancement en quelques commandes.
- [ ] Exécuter une reconstruction propre et la vérification finale.

**Fini quand** : une personne extérieure comprend le projet en une minute et peut
reproduire les résultats avec les commandes documentées.

## Après le MVP

- Épingler le dépôt sur GitHub.
- Publier un billet sur la méthode du différentiel.
- Traiter éventuellement l'évolution du panier BQP dans un dépôt séparé.
