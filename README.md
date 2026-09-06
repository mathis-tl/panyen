# panyen

> *panyen* — « panier », en créole martiniquais.

En 2022, l'Insee a mesuré que les produits alimentaires coûtaient **40 % plus
cher** en Martinique qu'en France métropolitaine. Ce site répond à la question
qui vient juste après, poste par poste — alimentation, énergie, produits
manufacturés, services : **depuis, le différentiel d'évolution des prix se
creuse-t-il ou se resserre-t-il ?**

L'écart de niveau n'est publié que pour l'alimentation (mesure ECSP 2022). Pour
les autres postes, seule l'évolution est comparable.

*(Capture à venir.)*

## Ce que ce projet garantit

- Toute valeur affichée vient d'une source publique identifiée, avec sa date de
  collecte et son identifiant d'origine.
- Le pipeline se rafraîchit seul : mensuellement pour les indices, quotidiennement
  pour les carburants.
- Si un test de qualité échoue, **rien n'est republié** : le site conserve sa
  dernière version saine plutôt que d'afficher un chiffre faux.

## Ce que ce projet ne garantit pas

Il ne dit pas combien coûte un panier en Martinique aujourd'hui, et il ne peut pas
le dire. Un indice des prix est en base 100 **sur son propre territoire** : deux
indices ne se comparent pas en niveau, seulement en évolution. Le seul écart de
niveau connu est celui de l'enquête de 2022 (alimentation) ; ce qui est tracé
ici est un **différentiel d'évolution** depuis avril 2022, et toute estimation
de l'écart alimentaire actuel est étiquetée comme telle.

## Les chiffres

*(À remplir au fil de la construction — chaque chiffre accompagné de la commande
qui le reproduit.)*

- 9 915 stations dans le fichier national des carburants au 29/08/2026, dont 0
  outre-mer — parce que l'obligation de déclarer ses prix n'existe pas dans les
  DOM, où le prix est fixé par arrêté préfectoral.

## Différentiel IPC depuis 2022 (quatre postes)

Reconstruction, hors réseau, à partir du brut déjà collecté :

```bash
uv run dbt build --project-dir dbt --profiles-dir dbt --select stg_ipc+ ecsp_alimentation_2022+
```

La commande retient le fichier `quatre_postes_france_metropolitaine` le plus
récent en entier, rebase chaque série sur avril 2022 **dans son propre
territoire et son propre poste**, puis apparie les facteurs d'évolution. Le
dernier mois commun est unique pour les quatre postes : la France publie souvent
un mois de plus, ce mois-là n'entre pas dans le calcul.

En mots simples :

- Pour un territoire et un poste, le facteur d'un mois est « l'indice de ce mois
  divisé par l'indice d'avril 2022 **du même territoire et du même poste** ».
- L'évolution en % est ce facteur, moins 1, fois 100.
- Le différentiel compare ces deux évolutions, jamais les niveaux d'indice.
- Pour l'alimentation seulement, l'estimation de l'écart de prix part du +40 %
  mesuré en 2022, multiplié par le rapport exact des deux facteurs.

À avril 2022, le +40 % alimentaire est une **mesure** ECSP
(`mesure_ecsp_2022`). Chaque mois suivant, `ecart_prix_estime_pct` est une
**estimation** (`estimation_a_partir_ecsp_2022`). Hors alimentation, ces
colonnes restent NULL : l'ECSP publie par fonction COICOP, pas par poste IPC.

## Essayer

```bash
git clone <url> && cd panyen
make install
uv run python ingest/insee_ipc.py --depuis 2022-04 --dry-run
uv run python ingest/insee_ipc.py --depuis 2022-04
uv run dbt build --project-dir dbt --profiles-dir dbt --select stg_ipc+ ecsp_alimentation_2022+
make verify
make publier
```

`make verify` (Ruff, pytest, `dbt build` de `stg_ipc` et du différentiel IPC,
tests Vitest, build Vite) n'appelle pas le réseau et ne publie jamais le
Parquet. La collecte Insee ci-dessus doit avoir eu lieu une fois, pour fournir
le XML brut `ipc_postes_*.xml`.

## CI

```bash
make ci
```

`make ci` reproduit localement le job GitHub Actions : installation verrouillée
(`uv sync --locked`, `npm ci`), puis `make verify` avec `UV_LOCKED=1`. Le
workflow se déclenche sur pull request, push sur `main` et manuellement. Il ne
contacte pas l'API Insee : le dry-run sans écriture est couvert par un test à
réponse synthétique. Il ne publie ni Parquet ni site.

## La page

La page statique lit `web/public/data/differentiel_ipc.parquet` dans le
navigateur via `hyparquet`, sans serveur applicatif. Le changement de poste
redessine depuis les lignes déjà en mémoire, sans aucune requête. Elle exige que
`make publier` ait tourné au moins une fois pour produire le fichier Parquet.

```bash
make dev
```

`make publier` exécute d'abord `make verify`, puis exporte `fct_differentiel_ipc`
vers un candidat Parquet Zstandard voisin, le valide contre la fact, et remplace
atomiquement `web/public/data/differentiel_ipc.parquet` avec `os.replace`. Si la
vérification, l'export ou la validation échoue, la dernière version saine est
conservée telle quelle. Le fichier généré n'est pas versionné.

Lire le Parquet publié :

```bash
uv run python -c "import duckdb; print(duckdb.sql(\"select poste, count(*), min(periode), max(periode) from 'web/public/data/differentiel_ipc.parquet' group by 1 order by 1\").fetchall())"
```

## Limites connues

- La France publie ses indices avant les DOM : le dernier mois affiché est le
  dernier mois commun aux huit séries des quatre postes.
- L'enquête de comparaison spatiale est quinquennale ; entre deux enquêtes,
  l'écart de niveau alimentaire ne peut être qu'estimé. Hors alimentation,
  aucun écart de niveau n'est publiable.
- Les prix des carburants ne sont disponibles au niveau de la station qu'en
  métropole.

## Décisions

- **La référence géographique active est la France métropolitaine**, alignée sur
  l'ECSP 2022. Un lot historique France entière (`011813717`) reste au brut,
  étiqueté comme tel, et n'est plus collecté.
- **DuckDB + dbt + Parquet + hyparquet**, pas de serveur : le site lit le
  Parquet dans le navigateur via `hyparquet` (lecteur Parquet pur JavaScript,
  0,3 Mo) et affiche les graphiques avec Observable Plot. Zéro coût d'hébergement,
  et le visiteur peut filtrer sans aller-retour réseau.
- **Le brut n'est jamais corrigé à l'ingestion.** Les collecteurs téléchargent et
  rangent, rien d'autre, pour que toute exécution passée reste rejouable.
- **Le Bouclier Qualité Prix a été écarté** après vérification : il ne publie
  qu'un prix plafond global, sans détail par produit. Voir `docs/CONTEXTE.md`.

## Documentation

- `docs/CONTEXTE.md` — pourquoi ce projet, la limite méthodologique, le glossaire
- `docs/SOURCES.md` — chaque source, son appel exact, ce qu'elle ne donne pas
- `ROADMAP.md` — les jalons et leur définition de fini
