# CLAUDE.md — panyen

## Le projet en une phrase

Un site de données qui répond à une question : **l'écart de prix mesuré en 2022
entre la Martinique et la France hexagonale s'est-il creusé ou resserré depuis ?**

Pipeline autonome (Insee + prix des carburants) → DuckDB + dbt → Parquet →
page statique qui interroge le Parquet dans le navigateur. Aucun serveur.

## Règles de session — non négociables

1. **Boucle par sujet** : analyse → cause/constat avec preuves → 2-3 propositions
   chiffrées → **STOP, validation Mathis** → implémentation → vérification.
2. **Un sujet à la fois.** Pas de refonte transversale non demandée.
3. **Échec bruyant, jamais silencieux.** Une ligne douteuse est signalée et
   visible, jamais avalée. Un mois manquant fait échouer, il ne se comble pas.
4. **Aucune valeur inventée.** Toute valeur affichée est soit lue dans une source,
   soit calculée à partir de sources tracées. La provenance (idbank, fichier brut,
   horodatage) ne se perd jamais en cours de route.
5. Chaque changement tracé : quoi / où / pourquoi, en une phrase.
6. Répondre en français.

## Démarrage et incréments

- `ROADMAP.md` donne l'ordre des incréments ; `SPEC.txt` est l'unique spec active.
  La remplacer entre deux incréments plutôt que d'accumuler des specs dans le repo.
- Avant de coder : objectif utilisateur, contraintes, non-objectifs et définition de
  fini doivent être explicites dans `SPEC.txt`.
- Rechercher les solutions maintenues existantes avant toute infrastructure maison,
  en privilégiant les sources officielles. Ne proposer 2-3 architectures que si le
  choix est réellement structurant.
- Coder le plus petit incrément vertical, vérifier build/tests, puis documenter la
  commande de lancement. Ne pas commencer l'incrément suivant dans la même boucle.

## L'erreur méthodologique à ne jamais commettre

Un indice des prix est en **base 100 sur son propre territoire**. L'indice
martiniquais et l'indice français ne sont **pas** comparables en niveau : ils
mesurent chacun une évolution par rapport à leur propre point de départ.

- Comparer deux **évolutions** entre territoires : autorisé, c'est le cœur du site.
- Comparer deux **niveaux** d'indice entre territoires : interdit, c'est faux.
- Le seul écart de niveau connu vient de l'enquête de comparaison spatiale de
  l'Insee (mars-avril 2022). Toute extrapolation de cet écart est une **estimation**
  et doit être étiquetée comme telle partout où elle apparaît.

Si une requête, un graphe ou une phrase du site enfreint cette règle, c'est un bug
bloquant, pas un détail de présentation.

## Faits vérifiés (ne pas re-vérifier sans raison)

- API Insee SDMX ouverte, **sans clé ni compte** :
  `https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/<idbank>[+<idbank>…]`
  Jusqu'à **500 séries par appel**, séparées par `+`.
  Paramètres : `startPeriod`, `endPeriod`, `firstNObservations`, `lastNObservations`.
  En-tête recommandé : `Accept: application/vnd.sdmx.structurespecificdata+xml;version=2.1`.
- idbanks confirmés (base 2025, ensemble des ménages) :
  - `011813726` Martinique · Alimentation · indice
  - `011813717` France · Alimentation · indice
  - `011813873` Martinique · Énergie · indice
  - `011813728` Martinique · Alimentation · glissement annuel
  - `011813719` France · Alimentation · glissement annuel
- **Règle des neuf rangs** : dans un poste donné, les territoires se suivent
  (France, France métropolitaine, Guadeloupe, Martinique, Guyane, La Réunion) avec
  trois séries chacun (indice, variation mensuelle, glissement annuel). L'indice
  martiniquais tombe **neuf rangs après** l'indice France. Vérifié sur alimentation
  et énergie. À confirmer par balayage pour les autres postes.
- Prix des carburants : `https://donnees.roulez-eco.fr/opendata/{instantane,jour,jour/AAAAMMJJ,annee/AAAA}`,
  archives annuelles depuis 2007, XML compressé, licence ouverte.
- **Les DOM sont absents du fichier national** : mesuré le 29/08/2026, 9 915 stations,
  dont 0 en code postal 97. Ce n'est pas un trou : l'obligation de déclarer vise les
  stations vendant ≥ 500 m³/an en métropole ; outre-mer le prix est plafonné par
  arrêté préfectoral mensuel, identique dans tout le département.

## Pièges connus dans les données

- **Bord irrégulier** : la France publie son indice avant les DOM. En août 2026, la
  France avait une valeur d'août et la Martinique s'arrêtait à juillet. Le dernier
  mois affiché doit être le **dernier mois commun** aux deux territoires, et le site
  doit le dire. Le test « pas de trou » vérifie l'intérieur d'une série, pas que
  toutes les séries finissent au même mois.
- Valeurs manquantes possibles (statut `ND`) dans les séries anciennes.
- Un changement de base (2015 → 2025) invalide les comparaisons : garde-fou
  « indice entre 50 et 200 » pour l'attraper.

## Conventions

- Français partout : noms de fichiers, de colonnes, de modèles, commentaires.
- `ingest/` ne parse rien : télécharge et écrit le brut horodaté dans `data/raw/`.
  Jamais d'écrasement, jamais de correction à l'ingestion.
- dbt : `stg_` (nettoyage, une table par source) → `int_` (jointures) → `fct_`/`dim_`
  (tables finales publiées).
- Toute table déclare son **grain** en commentaire d'en-tête et dans `schema.yml`.
- Si un test dbt échoue, **le Parquet n'est pas régénéré** : le site conserve la
  dernière version saine et la page de fraîcheur affiche le rouge.

## Hors périmètre (décidé, ne pas relancer sans discussion)

- Le Bouclier Qualité Prix : listes en `.ods`/PDF, **prix plafond global** sans
  détail par produit — aucune série de prix exploitable. Sujet séparé, plus tard.
- Toute forme de collecte de prix chez des distributeurs (scraping, appariement
  produit) : hors sujet et hors cadre.
- Toute réutilisation de code écrit pendant le stage chez Willy Anti-Gaspi.
