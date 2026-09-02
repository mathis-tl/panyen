# panyen

> *panyen* — « panier », en créole martiniquais.

En 2022, l'Insee a mesuré que les produits alimentaires coûtaient **40 % plus
cher** en Martinique qu'en France hexagonale. Ce site répond à la question qui
vient juste après, et à laquelle personne ne répond publiquement : **depuis, cet
écart se creuse-t-il ou se resserre-t-il ?**

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
niveau connu est celui de l'enquête de 2022 ; ce qui est tracé ici est un
**différentiel d'évolution** depuis cette enquête, et toute estimation de l'écart
actuel est étiquetée comme telle.

## Les chiffres

*(À remplir au fil de la construction — chaque chiffre accompagné de la commande
qui le reproduit.)*

- 9 915 stations dans le fichier national des carburants au 29/08/2026, dont 0
  outre-mer — parce que l'obligation de déclarer ses prix n'existe pas dans les
  DOM, où le prix est fixé par arrêté préfectoral.

## Essayer

```bash
git clone <url> && cd panyen
make install
uv run python ingest/insee_ipc.py --depuis 2022-04 --dry-run
uv run python ingest/insee_ipc.py --depuis 2022-04
uv run dbt build --project-dir dbt --profiles-dir dbt --select stg_ipc+
make verify
```

`make verify` (Ruff, pytest, `dbt build` de `stg_ipc`, build Vite) n'appelle pas le réseau. La collecte Insee ci-dessus doit avoir eu lieu une fois, pour fournir le XML brut.

## Limites connues

- La France publie ses indices avant les DOM : le dernier mois affiché est le
  dernier mois commun aux deux territoires.
- L'enquête de comparaison spatiale est quinquennale ; entre deux enquêtes,
  l'écart de niveau ne peut être qu'estimé.
- Les prix des carburants ne sont disponibles au niveau de la station qu'en
  métropole.

## Décisions

- **DuckDB + dbt + Parquet + DuckDB-WASM**, pas de serveur : le site interroge un
  fichier dans le navigateur du visiteur. Zéro coût d'hébergement, et le visiteur
  peut filtrer sans aller-retour réseau.
- **Le brut n'est jamais corrigé à l'ingestion.** Les collecteurs téléchargent et
  rangent, rien d'autre, pour que toute exécution passée reste rejouable.
- **Le Bouclier Qualité Prix a été écarté** après vérification : il ne publie
  qu'un prix plafond global, sans détail par produit. Voir `docs/CONTEXTE.md`.

## Documentation

- `docs/CONTEXTE.md` — pourquoi ce projet, la limite méthodologique, le glossaire
- `docs/SOURCES.md` — chaque source, son appel exact, ce qu'elle ne donne pas
- `ROADMAP.md` — les jalons et leur définition de fini
