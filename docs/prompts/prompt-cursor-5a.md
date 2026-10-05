Tu implémentes une seule spec : **Incrément 5a — socle visuel et écran principal**.
`SPEC.txt` fait autorité, avec `docs/prompts/panyen-brief-da.md` (corrigé le
2026-10-05) pour tout ce qui est visuel. En cas de divergence entre ce prompt, la
spec et le brief, arrête-toi avant toute modification et signale précisément la
contradiction.

L'incrément 4 est clos et le correctif carburants 4b est publié : ne les refais
pas. Cette boucle ne touche ni le pipeline, ni dbt, ni les Parquet, ni les bruts.
Elle s'arrête après le rapport final.

DÉMARRAGE

1. Lire `AGENTS.md`, `CLAUDE.md` (règle des niveaux, règle d'échec bruyant), puis
   `SPEC.txt` en entier et `docs/prompts/panyen-brief-da.md` en entier.
2. Capturer `git status --short --branch`, `git log -1 --oneline` et les SHA-256
   de `web/public/data/differentiel_ipc.parquet`, `web/public/data/carburants.parquet`,
   `uv.lock` et `web/package-lock.json` dans `/private/tmp/panyen_5a/avant.sha`.
3. Lire les modules existants avant d'écrire : `web/src/main.ts`, `calculs.ts`,
   `rendu.ts`, `graphe.ts`, `calculs-carburants.ts`, `rendu-carburants.ts`,
   `graphe-carburants.ts`, `style.css`, `types.ts` et leurs tests. Réutiliser ce
   qui existe ; aucune abstraction pour le plaisir.
4. Pour les choix visuels, appliquer le skill `frontend-design` en respectant le
   brief : le brief l'emporte sur toute préférence esthétique du skill.
5. Lire `docs/analyse/validation.md` § 6 uniquement si un texte affiché cite un
   chiffre de la recherche (non nécessaire pour 5a).

PÉRIMÈTRE (SPEC.txt, « Périmètre de l'incrément 5a »)

1. Socle : paquets `@fontsource/schibsted-grotesk`, `@fontsource/atkinson-hyperlegible-next`,
   `@fontsource/ibm-plex-mono` (seules dépendances ajoutées), variables CSS de
   couleur du brief, thème clair et sombre (bascule manuelle + défaut
   `prefers-color-scheme`), `prefers-reduced-motion`.
2. Titre-réponse à trois états calculé depuis le Parquet (alimentation), seuil ±2
   points en constante nommée, avec pic estimé et dernier mois commun.
3. Règle du panier : barres « pour 100 € dans l'Hexagone à la même date »,
   hachure SVG faite chez nous pour l'estimé, libellé « estimé ».
4. Renvois en exposant, ligne « Estimation, fin [mois] 2026 ».
5. Graphe carburants : plafond martiniquais en bleu, infobulle lisible dans les
   deux thèmes, focus clavier sur les mois.
6. `h1` court séparé du paragraphe de conclusion ; squelette à la place de
   « Chargement… ».

TDD (règle `tdd-adaptive`)

- Test rouge puis vert pour : le choix des trois états du titre (valeurs aux
  frontières de ±2 points, valeur exactement égale), le calcul des barres « à la
  même date » (aucune barre ne reçoit un niveau d'indice), le choix du libellé
  quand le dernier mois commun change.
- Pas de TDD pour le CSS pur ni les textes.

CONTRAT À NE PAS DÉGRADER

- **Règle des niveaux** : jamais deux niveaux d'indice côte à côte ; l'écart de
  niveau vient de l'ECSP 2022 et tout prolongement est étiqueté « estimation ».
  Un contre-exemple dans l'interface est un bug bloquant.
- **Aucune valeur inventée** : tout chiffre affiché est lu dans le Parquet ; rien
  n'est recopié à la main dans le site. Si le Parquet ne fournit pas une valeur,
  l'écran échoue visiblement, il ne remplit pas.
- Le pic « environ 42,5 % en décembre 2024 » est calculé à l'exécution depuis
  `ecart_prix_estime_pct`, jamais écrit en dur.
- Pas de CDN, pas de police Google, pas de requête vers un domaine tiers.
- Contraste WCAG AA des deux couleurs de territoire, vérifié sur les valeurs CSS
  finales ; la couleur n'est jamais seule ; animations ≤ 300 ms en
  `transform`/`opacity` ; état final immédiat sous `prefers-reduced-motion`.
- Une seule commande lourde à la fois (machine 8 Go) ; aucun processus parallèle.
- Ne pas modifier : `SPEC.txt`, ce prompt, `CLAUDE.md`, `AGENTS.md`, `ROADMAP.md`,
  `docs/`, `dbt/`, `ingest/`, `publication/`, `transformation/`, les Parquet, les
  bruts, la CI, `uv.lock`.
- Dépendances : seulement les trois paquets Fontsource ; `web/package-lock.json`
  change uniquement pour eux.
- Fichiers de mesure et captures uniquement dans `/private/tmp/panyen_5a/`,
  jamais dans Git. Copier les captures utiles dans `.agent-work/preuves-5a/`
  (ignoré par git) car `/private/tmp` est vidé au redémarrage.
- Aucun commit, push, branche ou PR.

ORDRE DE TRAVAIL

1. `npm --prefix web run test` et `npm --prefix web run build` : état de départ.
2. Tests rouges (titre à trois états, barres « même date »), puis implémentation
   minimale jusqu'au vert.
3. Socle CSS (polices, variables, thèmes), puis écran principal, puis graphe
   carburants (couleur, infobulle, clavier), puis nettoyages `h1` / squelette.
4. `npm --prefix web run test`, `npm --prefix web run build`, `npx tsc --noEmit` si
   le build ne l'inclut pas.
5. `npm --prefix web run preview` et vérification navigateur à 375 px et 1440 px,
   thèmes clair et sombre : titre-réponse, règle du panier, graphe carburants ;
   0 erreur console ; infobulle lisible ; focus clavier visible ; test avec
   réduction des animations ; onglet Réseau sans domaine tiers. **Regarder les
   captures**, pas seulement les compter. Arrêter le serveur ensuite.
6. Recalculer les empreintes dans `/private/tmp/panyen_5a/apres.sha` : seuls
   `web/package-lock.json` (et `web/package.json`) peuvent changer ; les deux
   Parquet et `uv.lock` doivent être identiques.
7. `make verify` seulement si une donnée ou le pipeline a été touché ; sinon écrire
   « non lancé » dans le rapport.

SEULS MOTIFS DE STOP AVANT LA FIN

- Une empreinte de départ contredit l'état décrit dans `SPEC.txt`.
- Le Parquet ne fournit pas une valeur nécessaire (ancre, dernier mois commun,
  estimation) : s'arrêter et le dire, ne rien inventer.
- Une exigence du brief enfreint la règle des niveaux ou entre en conflit avec la
  spec.
- Un arrêt 137 ou 143 se reproduit après une relance seule.

RAPPORT FINAL (en français, factuel, sans habillage)

1. Ce qui a changé : quoi / où / pourquoi, une phrase par changement.
2. Tests écrits (rouge puis vert) et résultat des commandes réellement lancées ;
   ce qui n'a pas été lancé, dit explicitement.
3. Captures relues : ce que chacune montre, pour chaque largeur et chaque thème ;
   défauts visibles restants.
4. Contrastes calculés, poids du bundle avant / après, requêtes réseau observées.
5. Empreintes avant / après.
6. Écarts avec la spec ou le brief, décisions prises seul, points à valider par
   Mathis (notamment le seuil de ±2 points).
7. Ce qui reste pour 5b.
