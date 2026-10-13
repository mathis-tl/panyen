Tu déploies le site Panye sur Vercel avec le connecteur Vercel, puis tu le testes. Réponds en
français. Tu ne modifies pas le dépôt, tu ne commites pas, tu ne pousses pas, tu ne touches pas
aux autres projets Vercel du compte.

## Projet
- Dépôt GitHub : `mathis-tl/panyen`, branche `main` (dernier commit à la date de ce prompt : `9c6ebbc`).
- Site statique Vite (deux pages : `index.html` et `techos.html`), sans serveur, sans variable
  d'environnement. Les Parquet publiés (`web/public/data/*.parquet`, ~36 Ko) sont versionnés.
- La configuration est dans `web/vercel.json` : framework `vite`, commande `npm run build`,
  sortie `dist`.

## 1. Déployer
1. Crée un projet Vercel nommé `panyen` depuis le dépôt `mathis-tl/panyen` (branche `main`).
2. Réglages : **Root Directory = `web`** ; Install `npm ci` (ou le défaut) ; Build `npm run build` ;
   Output `dist` ; Node 22.x ou 24.x (le dépôt vise 24.9.0). Aucune variable d'environnement.
3. Lance le déploiement de production et attends qu'il soit prêt. S'il échoue, lis les logs de
   build, dis la cause exacte et arrête-toi : ne contourne pas en modifiant le dépôt.
4. Récupère l'URL de production (et le domaine `*.vercel.app`).

## 2. Contrôles immédiats
- `/` et `/techos.html` répondent 200 ; `/data/differentiel_ipc.parquet` répond 200 ;
  `/media/martinique.mp4` répond 200 ; `/drapeau-martinique.svg` répond 200.
- Le titre de `/` commence par « Panye » et le `h1` dit « Depuis 2022, l'écart n'a presque pas
  bougé : les courses alimentaires coûtent environ 40 % de plus en Martinique que dans
  l'Hexagone. »

## 3. Test de qualité
Exécute `docs/prompts/prompt-test-qualite-site.md` (lis-le dans le dépôt), en remplaçant
`<URL_VERCEL>` par l'URL de production : Lighthouse mobile et bureau, poids et hôtes tiers,
console, liens, captures à 375 et 1440 px, accessibilité, balises meta, chiffres du README.

## Rapport (court)
1. URL de production, identifiant du déploiement, durée du build.
2. Tableau des mesures : mesure → valeur → seuil visé → OK / À corriger.
3. Défauts classés (bloquant / à corriger / peut attendre) avec la page, l'élément et la valeur.
4. Ce que tu n'as pas pu faire, dit explicitement.
