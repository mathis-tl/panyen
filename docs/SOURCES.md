# Sources — état vérifié au 29 août 2026

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

### idbanks confirmés (base 2025, ensemble des ménages)

| idbank | territoire | poste | nature |
|---|---|---|---|
| `011813726` | Martinique (`D972`) | Alimentation | indice |
| `011813727` | Martinique | Alimentation | variation mensuelle |
| `011813728` | Martinique | Alimentation | glissement annuel |
| `011813720` | France métropolitaine (`FM`) | Alimentation | indice — **référence active** |
| `011813717` | France entière (`FE`) | Alimentation | indice — lot historique, plus collecté |
| `011813718` | France entière | Alimentation | variation mensuelle |
| `011813719` | France entière | Alimentation | glissement annuel |
| `011813873` | Martinique | Énergie | indice |
| `011813874` | Martinique | Énergie | variation mensuelle |
| `011813875` | Martinique | Énergie | glissement annuel |

La collecte active de l'IPC alimentaire demande exactement
`011813726+011813720` depuis `2022-04`, pour rester alignée sur l'ECSP 2022
(Martinique contre France métropolitaine). Le brut
`ipc_alimentation_2026-09-02T163321Z.xml` conserve la paire historique
`{011813726, 011813717}` ; le parseur l'étiquette `france_entiere_historique`
et n'accepte, par fichier, que cette paire ou `{011813726, 011813720}`.

### Comment trouver les autres

Il n'existe pas de moteur de recherche pratique pour les idbanks. La méthode :
balayer une plage d'identifiants en un appel, avec `lastNObservations=1` pour que
la réponse reste minuscule, et lire les titres.

```
GET …/SERIES_BDM/011813725+011813726+011813727+011813728?lastNObservations=1
```

**Règle des neuf rangs** (vérifiée sur alimentation et énergie) : dans un poste
donné, les territoires se suivent — France, France métropolitaine, Guadeloupe,
Martinique, Guyane, La Réunion — avec trois séries chacun, dans l'ordre indice,
variation mensuelle, glissement annuel. L'indice martiniquais tombe donc **neuf
rangs après** l'indice France. Restent à trouver : produits manufacturés, services.

### Ce que cette source ne donne pas

Aucun niveau de prix. Aucune comparaison entre territoires. Voir `CONTEXTE.md`.

---

## 2. Insee — enquête de comparaison spatiale des prix (ECSP)

**Statut** : vérifié. Quelques valeurs publiées, pas un jeu de données — à saisir
en `seed` dbt avec leur source.

Enquête de mars-avril 2022, indice de Fisher, ~5 000 relevés en Martinique et
~55 000 en métropole, environ 500 familles de biens et services.

| mesure | Fisher | panier métropolitain | panier martiniquais |
|---|---|---|---|
| Ensemble | +14 % | +17 % | +11 % |
| Alimentaire | +40 % | +50 % | +31 % |

Source : Insee Analyses Martinique n° 63 — <https://www.insee.fr/fr/statistiques/7649202>

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
https://donnees.roulez-eco.fr/opendata/annee/AAAA        (2007 → 2025)
```

XML compressé en ZIP. Champs : identifiant du point de vente, latitude et
longitude (**à diviser par 100 000**), code postal, ville, horaires, services,
et par carburant le prix avec son horodatage de mise à jour. Les enseignes ne sont
pas fournies.

### Couverture : métropole seulement — mesuré

Comptage du 29 août 2026 sur le flux quotidien : **9 915 stations, dont 0 en code
postal 97**.

Ce n'est pas un défaut du jeu de données. L'obligation de déclarer vise les
stations vendant au moins 500 m³ par an, un dispositif métropolitain. Outre-mer,
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

**Statut** : vérifié, publication mensuelle, format rédigé (pas de flux).

Arrêtés préfectoraux révisant le prix maximum au 1er de chaque mois. Relevés pour
mars, avril, mai et juillet 2026.

- <https://www.martinique.gouv.fr/> — rubrique Actualités
- <https://martinique.deets.gouv.fr/>

Une valeur par mois et par carburant, avec la référence de l'arrêté pour que
chaque ligne reste vérifiable.

---

## 6. Écarté — Bouclier Qualité Prix

**Statut** : vérifié, puis écarté. Listes en `.ods` (2025) et PDF (2024). Prix
**plafond global** par format de magasin, aucun prix par produit : 134 produits
pour 390 € en 2023, 387 € en 2024, 180 produits en 2025 côté hypermarchés. Aucune
série de prix exploitable. Détail dans `CONTEXTE.md`.

- <https://www.martinique.gouv.fr/> — rubrique Bouclier Qualité-Prix
- <https://opmrmartinique.fr/>
