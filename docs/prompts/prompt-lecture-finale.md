# Lecture finale et analyse finale — panyen

Tu lis. Tu ne modifies rien, tu ne commites pas, tu ne pousses pas, tu n'ouvres pas l'incrément 6.

## Pourquoi

Mathis va figer l'étude au 8 octobre 2026, puis committer le README, pousser, nettoyer GitHub et déployer. Avant ça, il veut savoir si un lecteur qui ne connaît pas les indices comprend la réponse, et si quelque chose est faux.

La question du site : l'écart de prix mesuré en 2022 entre la Martinique et l'Hexagone s'est-il creusé ou resserré depuis ?

Décision déjà prise, à noter dans le verdict, sans la discuter et sans la faire toi-même : retirer le logo de supermarché de l'en-tête. C'est le dessin de panier (`logo-panier` dans `web/src/entete.ts`), à côté du drapeau et du mot « Panye ». Le drapeau de la Martinique reste.

## Où lire

La page tourne déjà : http://127.0.0.1:5173/
Si elle ne répond pas : `npm --prefix web run dev -- --host 127.0.0.1 --port 5173` depuis la racine du dépôt.

Lis la page entière, dans l'ordre, comme un premier visiteur : en-tête, réponse, écart 2022, évolutions, gazole, revenus, récit, méthode, conclusion. Puis la page « Pour les techos ».

Fichiers, et seulement ceux-là sauf si une phrase de la page t'oblige à ouvrir la source du chiffre :

- `README.md` et `docs/captures/reponse.png`, `docs/captures/conclusion.png` (non commités : c'est le paquet que Mathis va relire)
- `docs/analyse/recit.md`
- `docs/analyse/validation.md` (dossier de juillet 2026 : le Parquet publié va jusqu'à août 2026, les deux ne doivent pas être confondus)
- `docs/CONTEXTE.md`, `docs/SOURCES.md`
- `ROADMAP.md` (incrément 6 reporté), `SPEC.txt`
- Le Parquet `web/public/data/differentiel_ipc.parquet`, avec la commande du README, pour confronter chaque chiffre du README et de la conclusion

`web/src/calculs-ecran.ts` (`paragraphesConclusion`) seulement si une phrase de la conclusion te semble fausse.

## Règle bloquante

Un indice est en base 100 sur son propre territoire. Comparer deux évolutions, oui. Comparer deux niveaux d'indice entre la Martinique et l'Hexagone, non. Le seul écart de niveau vient de l'enquête de mars-avril 2022. Tout prolongement est une estimation et doit être dit comme telle. Le site ne mesure pas l'effet des mesures publiques.

Le texte visible dit « Hexagone » ou « France hexagonale ». « France métropolitaine » peut rester dans un code, une colonne ou un titre d'idbank.

## Ce que tu rends

### 1. Lecture

En une demi-page : ce qu'un inconnu retient après avoir lu la page, sans ton vocabulaire de pipeline. Dis si la réponse à la question est claire avant la conclusion, et si la conclusion ajoute une interprétation ou un fait.

### 2. Chiffres

Tableau court : phrase lue (page ou README), valeur, où tu l'as revérifiée (Parquet, seed, ou source citée). Signale chaque divergence. Ne recalcule pas l'enquête de 2022 : 40,2 % alimentaire et 13,8 % ensemble sont les ancres du seed. Analyses Martinique n° 63 arrondit à 40 % et 14 %.

### 3. Analyse

Trois questions, chacune avec une réponse nette :

1. L'étude peut-elle être figée sur août 2026, ou un chiffre affiché est-il faux ?
2. La conclusion reste-t-elle dans les règles (estimation, pas de comparaison de niveaux, pas d'effet des mesures publiques) ?
3. Qu'est-ce qui bloquerait le déploiement, et qu'est-ce qui peut attendre ?

### 4. Verdict

`FIGER` ou `CORRIGER`. Si `CORRIGER` : au plus cinq points, chacun avec l'endroit (page, README ou fichier:ligne) et la phrase exacte qui ne va pas. Pas de réécriture de fond proposée. Pas de nouvelle collecte, pas de thème sombre, pas de republication des carburants.

## Hors de cette lecture

Incréments 6 et 7, déploiement, nettoyage GitHub, VoiceOver, choix de méthode des carburants, réécriture du ton de la conclusion.
