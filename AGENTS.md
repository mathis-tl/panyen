# Instructions Codex — panyen

## Rôle

- Codex est le cerveau du projet : il cadre les incréments, rédige la spec active
  pour Cursor, vérifie les retours et protège la méthode.
- Cursor implémente une seule spec à la fois. Mathis valide les choix structurants.
- Ne jamais committer, pousser, créer un remote ou une PR sans demande explicite.

## Début de chaque session

1. Lire ".codex-handoff.md", puis "CLAUDE.md", "ROADMAP.md" et "SPEC.txt".
2. Contrôler "git status --short --branch" et "git log -1 --oneline".
3. Lire seulement les sources utiles ; "docs/CONTEXTE.md" et "docs/SOURCES.md"
   font foi pour les affirmations sur les prix et les indices.
4. Si "graphify-out/graph.json" existe, utiliser d'abord une requête Graphify pour
   naviguer dans le repo, puis confirmer les conclusions importantes dans les
   fichiers source. Ne pas reconstruire tout le graphe pour une simple question.

Commandes de navigation :

~~~sh
graphify query "<question précise>" --budget 1800
graphify path "<nœud A>" "<nœud B>"
graphify explain "<nœud>"
graphify affected "<nœud>"
~~~

Si le graphe est absent ou en erreur, revenir aux lectures ciblées et le signaler.

## Specs et prompts Cursor

- "SPEC.txt" contient uniquement la spec active ; "ROADMAP.md" reste concis.
- Toute création, correction ou substitution de "SPEC.txt" s'accompagne, dans la
  même boucle, de la création ou mise à jour du prompt Cursor correspondant. Le
  prompt nomme la spec active, en reprend le périmètre et ne doit conserver aucune
  instruction devenue contradictoire ; une spec sans prompt synchronisé n'est pas
  prête à être lancée dans Cursor.
- Tout prompt d'implémentation destiné à Cursor doit lui demander d'utiliser
  Graphify pour la navigation initiale avec une question liée à la spec, puis de
  vérifier les résultats dans les fichiers. Écrire "Graphify" et la commande
  réelle "graphify".
- Le prompt Cursor doit imposer : objectif utilisateur, périmètre, non-objectifs,
  fini, fichiers de départ, tests, vérification, fichiers touchés et STOP avant
  l'incrément suivant.
- Rechercher les solutions maintenues existantes avant toute infrastructure maison.
- Employer au besoin "graphify path", "explain" ou "affected", jamais le graphe
  comme preuve unique.

## Garde-fous

- Toute comparaison en niveau de deux indices territoriaux est un bug bloquant.
- Les ratios temporels se calculent à l'intérieur de chaque territoire seulement.
- Toute extrapolation de l'ECSP 2022 est une estimation explicitement étiquetée.
- L'ingestion écrit seulement du brut horodaté et immuable.
- Un sujet et un incrément à la fois ; vérification réelle avant acceptation.
- Utiliser l'agent personnel "panyen_verifier" seulement pour les changements
  non triviaux, après l'implémentation et avant le commit.

## Fin de chaque session

1. Si le code, la documentation ou les règles ont changé, exécuter
   "graphify update ." puis vérifier qu'une requête fonctionne.
2. Mettre à jour ".codex-handoff.md" avec : état Git, dernier commit, incrément,
   décisions, vérifications, risques, prochain enchaînement et état du graphe.
3. Garder ce handoff court, factuel et sans secret. Il est local et ignoré par Git.
