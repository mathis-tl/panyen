# Sources — inventaire vérifié au 9 septembre 2026

« Vérifié » signifie que la source a été appelée et la réponse regardée, pas
qu'une page prétend qu'elle existe. Toute source ajoutée plus tard suit le même
format : ce qu'elle donne, comment on l'appelle, ce qu'elle ne donne pas.

---

## 1. Insee — séries d'indices de prix (SDMX)

**Statut** : vérifié, ouvert, sans clé ni compte.

```
GET https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/<idbank>[+<idbank>…]
    ?startPeriod=2015-01
Accept: application/vnd.sdmx.structurespecificdata+xml;version=2.1
```

- Jusqu'à **500 séries par appel**, séparées par `+`.
- Paramètres : `startPeriod`, `endPeriod`, `firstNObservations`, `lastNObservations`.
- Deux formats SDMX-ML 2.1 par négociation de contenu ; `structurespecificdata`
  est le plus léger et s'applique par défaut.
- Testé sur `011813873` : valeurs mensuelles de janvier 1998 à juillet 2026,
  métadonnées mises à jour le 27 août 2026.

### idbanks actifs (base 2025, ensemble des ménages) — vérifiés le 2026-09-06

Collecte active : un seul appel des dix séries ci-dessous depuis `2022-04`.
Le relevé du 2026-09-06 s'arrêtait avant l'ajout de l'ensemble
(52 observations, jusqu'à juillet 2026). Le lot actif en ajoute deux séries.
Le Parquet publié le 2026-10-08 compte 53 mois, d'avril 2022 à août 2026. Le
brut s'appelle `ipc_postes_<horodatage>.xml`.

| poste | `poste` | France hexagonale (`FM`) | Martinique (`D972`) |
|---|---|---|---|
| Alimentation | `alimentation` | `011813720` | `011813726` |
| Énergie | `energie` | `011813867` | `011813873` |
| Produits manufacturés | `produits_manufactures` | `011813783` | `011813789` |
| Services | `services` | `011813909` | `011813915` |
| Ensemble | `ensemble` | `011814612` | `011814618` |

Lot historique conservé au brut (plus collecté) :

| idbank | territoire | poste | nature |
|---|---|---|---|
| `011813717` | France entière (`FE`) | Alimentation | indice — `france_entiere_historique` |

Les XML `ipc_alimentation_*.xml` restent lus, jamais renommés ni réécrits.

### Comment trouver les autres

Il n'existe pas de moteur de recherche pratique pour les idbanks. La méthode :
balayer une plage d'identifiants en un appel, avec `lastNObservations=1` pour que
la réponse reste minuscule, et lire les titres.

```
GET …/SERIES_BDM/011813725+011813726+011813727+011813728?lastNObservations=1
```

**Règle des rangs** (vérifiée sur les cinq postes, ensemble compris) : dans un
poste donné, les territoires se suivent — France entière (`FE`), France
hexagonale (`FM`), Guadeloupe, Martinique, Guyane, La Réunion — avec trois
séries chacun, dans l'ordre indice, variation mensuelle, glissement annuel.
L'indice martiniquais tombe donc **neuf rangs après** l'indice France entière
(`FE`), et **six rangs après** l'indice de la France hexagonale (`FM`).

### Ce que cette source ne donne pas

Aucun niveau de prix. Aucune comparaison entre territoires. Voir `CONTEXTE.md`.

---

## 2. Insee — enquête de comparaison spatiale des prix (ECSP)

**Statut** : vérifié. Quelques valeurs publiées, pas un jeu de données — à saisir
en `seed` dbt avec leur source.

Enquête de mars-avril 2022, indice de Fisher, ~5 000 relevés en Martinique et
~55 000 dans l'Hexagone, environ 500 familles de biens et services.

| mesure | Fisher | panier hexagonal | panier martiniquais |
|---|---|---|---|
| Ensemble | +13,8 % | +17 % | +11 % |
| Alimentaire | +40,2 % | +50 % | +31 % |

Analyses Martinique n° 63 arrondit ces Fisher à 14 % et 40 %. Le seed
`ecsp_niveaux.csv` retient 13,8 % et 40,2 %, lus dans l'Insee Première n° 1958.

Source : Insee Analyses Martinique n° 63 — <https://www.insee.fr/fr/statistiques/7649202>

La mesure alimentaire (40,2 %, Fisher, mars-avril 2022) est versionnée dans
`dbt/seeds/ecsp_alimentation_2022.csv`. L'ensemble (13,8 %) est dans
`dbt/seeds/ecsp_niveaux.csv`. Ce ne sont pas des constantes SQL : toute
extrapolation après avril 2022 est une estimation, calculée avec le coefficient
d'évolution `facteur_martinique / facteur_france_metropolitaine`.

### ECSP et postes IPC

L'ECSP 2022 publie ses écarts de niveau **par grandes fonctions COICOP** :
produits alimentaires +40 %, communications +37 %, loisirs et culture +14 %,
santé +13 %, hôtellerie et restauration +8 %, boissons alcoolisées et tabac
+23 %. Ce n'est **pas** la nomenclature des cinq postes de l'IPC.

L'alimentation a une ancre directe (40,2 %). L'ensemble a une ancre de 13,8 %
(Insee Première n° 1958), appliquée à l'indice Coicop 00 : c'est une estimation
après 2022, et les champs ne coïncident pas exactement. L'enquête laisse de
côté le fioul, le gaz de ville et les transports ferroviaires, et ne compare
que les biens consommés de manière significative des deux côtés. Le détail est
dans `docs/analyse/serie-ensemble.md`.

Les postes « produits manufacturés » et « services » de l'IPC traversent
plusieurs fonctions COICOP. Aucune correspondance n'est publiée par l'Insee.
Pour l'énergie, les produits manufacturés et les services, l'écart de niveau
2022 est inconnu : aucune valeur n'est inventée, interpolée ni empruntée.

Périodicité : environ quinquennale. Pas de date publique pour la prochaine.

---

## 3. Insee — publication mensuelle Martinique

**Statut** : vérifié. Donne le détail par poste et le comparatif national dans le
même document. Utile pour recouper les séries, pas comme source du pipeline.

Exemple relevé (avril 2026) : alimentation −0,2 % sur un mois et +1,5 % sur un an
en Martinique, contre +1,2 % au national ; produits frais −2,2 % sur un mois.

<https://www.insee.fr/fr/statistiques/8995280>

---

## 4. Prix des carburants — flux national

**Statut** : vérifié, licence ouverte.

```
https://donnees.roulez-eco.fr/opendata/instantane        (toutes les 10 min)
https://donnees.roulez-eco.fr/opendata/instantane_ruptures
https://donnees.roulez-eco.fr/opendata/jour              (30 derniers jours)
https://donnees.roulez-eco.fr/opendata/jour/AAAAMMJJ
https://donnees.roulez-eco.fr/opendata/annee             (année courante)
https://donnees.roulez-eco.fr/opendata/annee/AAAA        (archives closes, 2007 → 2025)
```

XML compressé en ZIP. Champs : identifiant du point de vente, latitude et
longitude (**à diviser par 100 000**), code postal, ville, horaires, services,
et par carburant le prix avec son horodatage de mise à jour. Les enseignes ne sont
pas fournies.

Pour la tranche validée avril 2022 → septembre 2026, l'index officiel annonce
34 Mo pour 2022, 28 Mo pour 2023, 26 Mo pour 2024 et 31 Mo pour 2025. Le stock
de l'année courante est mutable et mis à jour quotidiennement ; il ne faut pas
inventer une URL d'archive `/annee/2026` avant sa publication officielle. Les
ZIP nationaux restent donc dans le cache local ignoré `data/raw/carburants/`,
avec URL, taille et SHA-256 dans un sidecar de collecte.

### Couverture : Hexagone seulement — mesuré

Comptage du 29 août 2026 sur le flux quotidien : **9 915 stations, dont 0 en code
postal 97**.

Ce n'est pas un défaut du jeu de données. L'obligation de déclarer vise les
stations vendant au moins 500 m³ par an, un dispositif de l'Hexagone. Outre-mer,
il n'y a rien à déclarer : le prix est plafonné par arrêté préfectoral, révisé
mensuellement, identique dans tout le département.

Commande de recomptage :

```python
import io, zipfile, urllib.request
import xml.etree.ElementTree as ET
z = zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(
    "https://donnees.roulez-eco.fr/opendata/jour").read()))
root = ET.fromstring(z.read(z.namelist()[0]))
cps = [p.get("cp") for p in root.iter("pdv")]
print(len(cps), sum(1 for c in cps if c and c.startswith("97")))
```

---

## 5. Prix maximum des produits pétroliers en Martinique

**Statut** : vérifié, format rédigé sans flux structuré maintenu.

Les arrêtés préfectoraux fixent une date d'effet qui est généralement le premier
jour du mois, mais pas toujours. Une révision officielle a notamment pris effet
le **16 novembre 2022**. Le grain correct est donc une période d'effet, pas un
mois civil ; la fin d'une période ne peut être déduite du prochain acte qu'après
contrôle de continuité.

- <https://www.martinique.gouv.fr/Publications/Recueils-des-actes-administratifs-publies/Archives>
  — archives RAAP/RAA 2015–2026, source primaire ;
- <https://martinique.deets.gouv.fr/prix-des-produits-petroliers> — publications
  et archives AP/CP.

Le premier lot à inventorier est figé du 1er avril 2022 au 1er septembre 2026.
Chaque date d'effet doit porter la référence exacte de l'acte et son URL ; les
communiqués servent de contre-vérification, jamais de remplacement silencieux.

---

## 6. Écarté — Bouclier Qualité Prix

**Statut** : vérifié, puis écarté. Listes en `.ods` (2025) et PDF (2024). Prix
**plafond global** par format de magasin, aucun prix par produit : 134 produits
pour 390 € en 2023, 387 € en 2024, 180 produits en 2025 côté hypermarchés. Aucune
série de prix exploitable. Détail dans `CONTEXTE.md`.

- <https://www.martinique.gouv.fr/> — rubrique Bouclier Qualité-Prix
- <https://opmrmartinique.fr/>
