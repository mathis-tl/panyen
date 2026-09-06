# Contexte — pourquoi ce projet, et ce qu'il ne fait pas

Ce document existe pour que le raisonnement du projet reste dans le dépôt, et pas
seulement dans la tête de celui qui l'a écrit.

## La question

En Martinique, les produits alimentaires coûtent **40 % plus cher** qu'en France
hexagonale. Ce n'est pas une impression : l'Insee l'a mesuré en envoyant des
enquêteurs relever les mêmes produits des deux côtés, en mars-avril 2022. L'écart
tous produits confondus est de **14 %**.

La question que personne ne traite publiquement : **et depuis ?**

## Pourquoi on ne peut pas y répondre directement

Aucune source publique ne donne le prix d'un produit en rayon en Martinique, mois
après mois. Ce que l'Insee publie chaque mois n'est pas un prix, c'est un
**indice** : un nombre qui dit de combien les prix ont bougé depuis une date de
référence, **dans ce territoire-là**.

L'image à garder : deux personnes dans un escalier. En 2022, quelqu'un les a
photographiées et a mesuré les marches qui les séparaient. Depuis, on ne reçoit
plus que le nombre de marches que chacun a montées ce mois-ci — jamais l'étage où
il est arrivé. On peut donc dire si l'écart grandit ou rétrécit ; l'écart
d'aujourd'hui, lui, reste une estimation jusqu'à la prochaine enquête.

## Ce que le site répond, du coup

> L'écart mesuré en 2022 s'est-il creusé ou resserré depuis ?

Cette question a une réponse, mois par mois, et elle est vérifiable. Le site
raconte la trajectoire complète : l'ancre ECSP de 2022, les deux évolutions
cumulées (Martinique et France métropolitaine) depuis avril 2022, les épisodes
de resserrement et de creusement de l'écart estimé, puis la position au dernier
mois commun. Il compare d'abord les deux évolutions avant d'en tirer une
estimation d'écart ; cette estimation n'est jamais présentée comme une nouvelle
mesure.

L'exemple « 100 € en métropole / montant martiniquais dérivé » est une
**illustration mécanique** à partir des indices et de l'ECSP, jamais le prix
d'un panier réellement relevé en magasin. Un resserrement relatif peut coexister
avec une différence illustrative en euros plus grande qu'en 2022, parce que les
deux paniers ont augmenté.

La fenêtre choisie change la lecture, ce qui est précisément pourquoi le site
montre la série entière plutôt qu'un chiffre choc :

- **Glissement annuel d'avril 2026** : alimentation +1,5 % en Martinique contre
  +1,2 % en France → sur douze mois, l'écart se creuse.
- **Janvier à juillet 2026** : Martinique quasi plate (100,92 → 100,89), France en
  hausse (100,87 → 101,29) → sur ces sept mois, l'écart se resserre d'environ
  0,4 point.

Les deux sont vrais. Ils ne regardent pas la même fenêtre. Le site doit rendre ça
lisible au lieu de trancher arbitrairement.

## L'exception carburant

Pour un seul poste, on a le prix réel et non un indice : le carburant. Et les deux
territoires n'obéissent pas au même régime.

- **Métropole** : toute station vendant plus de 500 m³ par an doit déclarer ses
  prix, qui sont libres. Le fichier national contient des milliers de points,
  rafraîchis toutes les dix minutes.
- **Martinique** : personne ne déclare rien, parce qu'il n'y a rien à déclarer. Le
  préfet fixe un prix maximum, révisé au 1er de chaque mois, identique dans tout
  le département.

Mesuré le 29 août 2026 : **9 915 stations dans le fichier national, dont 0 en code
postal 97**. Ce zéro n'est pas une lacune à combler, c'est le fait à montrer.

## Ce qui a été écarté, et pourquoi

**Le Bouclier Qualité Prix.** Envisagé comme quatrième écran, puis abandonné après
vérification des documents. Les listes sont publiées en `.ods` (2025) et en PDF
(2024), et elles ne contiennent **aucun prix par produit** : seulement un plafond
global par format de magasin (134 produits pour 390 € en 2023, 387 € en 2024,
180 produits en 2025 côté hypermarchés). Il n'y a donc pas de série de prix à en
tirer. Le seul sujet qui reste — la composition du panier officiel au fil des ans —
vaut un billet et un dépôt séparé d'une journée, pas un écran.

**Toute collecte de prix chez des distributeurs.** Scraping, appariement produit,
découverte de prix : hors sujet, lourd, et juridiquement inconfortable.

**Tout code écrit pendant le stage chez Willy Anti-Gaspi.** Ce code ne m'appartient
pas. Les idées et les méthodes voyagent ; les fichiers, non.

## Glossaire

**indice des prix** — Un nombre qui suit l'évolution du prix d'un panier de biens
dans un territoire. Il ne dit pas combien coûte le panier, seulement de combien son
prix a bougé.

**base 100** — L'année de référence à laquelle on donne la valeur 100. L'Insee
utilise 2025 depuis janvier 2026. Un indice à 103 signifie « +3 % depuis 2025 »,
dans ce territoire et nulle part ailleurs.

**glissement annuel** — L'évolution sur douze mois. « +1,5 % sur un an » compare
avril 2026 à avril 2025.

**poste** — Une grande catégorie de dépenses : alimentation, énergie, produits
manufacturés, services.

**ECSP** — L'enquête de comparaison spatiale des prix. Des enquêteurs relèvent les
mêmes produits dans deux territoires au même moment : la seule chose qui donne un
écart de niveau. Lourde, donc rare.

**indice de Fisher** — Comparer deux territoires pose une question : avec quel
panier, celui d'ici ou celui de là-bas ? Les deux calculs donnent deux résultats.
Fisher est leur moyenne géométrique, une façon de ne favoriser ni l'un ni l'autre.

**idbank** — L'identifiant d'une série chez l'Insee, neuf chiffres. Chaque couple
territoire × poste a le sien.

**SDMX** — Le format standard d'échange des statistiques publiques. Concrètement :
une adresse web qui renvoie du XML avec des dates et des valeurs.

**pipeline** — La chaîne automatisée qui va de « la donnée est chez quelqu'un
d'autre » à « la donnée est affichée sur mon site ».

**ingestion** — L'étape de téléchargement. On stocke tel quel, sans corriger, pour
pouvoir tout rejouer plus tard.

**DuckDB** — Une base de données sans serveur, tenant dans un fichier, conçue pour
l'analyse. On écrit du SQL sur des fichiers, très vite.

**dbt** — Un outil où chaque table est un fichier SQL et où l'on déclare les
dépendances. Il construit dans le bon ordre et lance les tests.

**staging / intermediate / marts** — Le rangement dbt. Staging : une table par
source, nettoyée. Intermediate : jointures et calculs de passage. Marts : les
tables finales que le site lit.

**grain** — Ce que représente exactement une ligne. « Une ligne par territoire, par
poste et par mois. » Sans grain explicite, on joint de travers.

**Parquet** — Un format compressé pensé pour l'analyse, bien plus petit et rapide
qu'un CSV.

**DuckDB-WASM** — La même base, compilée pour le navigateur. Le visiteur charge le
Parquet une fois, puis chaque filtre est une requête SQL dans son onglet.
