Tu fais une seule modification visuelle : **l'Hexagone passe du bleu au vert** (rappel du
drapeau). Rien d'autre. Pas de refonte, pas de nouvelle donnée, aucun commit, aucun push,
pas d'incrément 6. `CLAUDE.md` s'applique (règle des niveaux, aucune valeur inventée).

## Décision de Mathis (2026-10-10)
Martinique reste en rouge `#9D1520`. L'Hexagone, aujourd'hui bleu `#1D5FA6`, devient vert `#0B6A36`.
Après ça, si tout est bon, la page part en production.

## Collision avec le vert existant (tranché par Mathis)
`web/src/style.css` définit déjà `--drapeau-vert: #0B6A36`, utilisé par l'étiquette « Contexte »
du récit. **L'Hexagone prend `#0B6A36`. L'étiquette « Contexte » passe au noir `#231F1E`**
(comme « Mesuré » : le mot de l'étiquette suffit à les distinguer). « Analyse » reste rouge.

## Où changer (liste de départ, vérifie par `grep -rn -i "hexagone\|bleu\|1d5fa6" web/src web/*.html docs/prompts/panyen-brief-da.md README.md`)
- `web/src/style.css` : `--hexagone` (l.11) → `#0B6A36` ; usages dérivés (`color-mix(... var(--hexagone) 20% ...)`
  l.870, liseré et motifs l.871-889) suivent le jeton, vérifier qu'aucun bleu n'est écrit en dur.
- `web/src/graphe.ts`, `web/src/graphe-carburants.ts` : ils lisent `var(--hexagone)` ; ne rien
  coder en dur.
- Textes visibles qui disent « bleu » : `web/src/page.ts` (« la ligne bleue, les stations de
  l'Hexagone » l.518 ; légende « Ligne bleue : prix médian » l.1016), `web/src/techos.ts`
  (« La ligne bleue est la médiane » l.42 ; « le bleu est l'Hexagone » l.49) → « verte » / « le
  vert ». Adapter les tests qui citent ces phrases.
- Étiquette « Contexte » du récit (CSS `.registre-contexte` ou équivalent) → noir `#231F1E`.
- `docs/prompts/panyen-brief-da.md` (§ 2, § 5, § 6, annexe : « Hexagone en bleu `#1D5FA6` »,
  couleurs, ratios) et `README.md` si une couleur y est citée.
- `docs/captures/reponse.png` et `docs/captures/conclusion.png` : à refaire après le changement
  (la capture de la réponse montre l'ancien bleu).

## Accessibilité (allégée, décision de Mathis : le daltonisme n'est pas un critère)
Ne mesure pas l'écart perceptuel rouge/vert et ne t'arrête pas dessus. Garde seulement le
contraste de lecture : le vert sur le fond clair doit rester ≥ 4,5:1 (`#0B6A36` : 6,2:1) ; indique
la valeur dans le rapport. Les noms en bout de courbe et les épaisseurs de trait ne changent pas.

## Vérification
`npm --prefix web test`, `npx tsc --noEmit` dans `web/`, `make verify` à 0 (aucune donnée ne
change : empreintes SHA-256 des Parquet identiques avant/après), puis navigateur à 375 et
1440 px, **chaque section** : courbes (4 petits graphes), gazole (ruban, médiane, légende), barres
du panier, barres « Ce qui coïncide », écart année par année, récit (étiquettes), techos.
Regarde les captures. `grep` final : plus de `1d5fa6`, plus de « bleu » / « bleue » dans les
textes affichés.

## Rapport (en français, court)
Quoi / où / pourquoi par changement ; contraste du vert ; captures relues ; ce qui n'a pas été
lancé.
