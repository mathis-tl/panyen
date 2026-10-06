# Série « ensemble » — vérifications avant estimation (incrément 5c)

Lecture du 2026-10-06. Décision : continuer. Les phases 0.1 et 0.2 n'échouent pas.
Aucun chiffre de ce contrôle n'est affiché sur le site.

## 0.1 Champ de l'écart « ensemble » 2022 (13,8 %)

Source : Insee Première n° 1958, page
<https://www.insee.fr/fr/statistiques/7648939>, lue le 2026-10-06.
La série IPC de comparaison est `011814618` (Martinique, Coicop 00, base 2025),
titre Insee : « Nomenclature Coicop : 00 - Ensemble ».

L'enquête et l'indice ne sont pas le même objet, mais ils ne sont pas des champs
très différents : la Première écrit que les pondérations de l'enquête « sont
cohérentes avec celles de l'indice des prix à la consommation », et que la
comparaison martiniquaise porte sur environ 90 % de la consommation (les 83 %
cités à côté valent pour Mayotte seulement). Les loyers, la santé et les
services figurent dans l'écart d'ensemble martiniquais (figure 3 : loyers
+2,5 %, santé +13,4 %, ensemble +13,8 %). On continue, en disant les différences.

Une phrase par différence de champ :

- L'enquête mesure la consommation des ménages hors fioul, gaz de ville et
  transports ferroviaires ; l'IPC Coicop 00 est l'indice d'ensemble de chaque
  territoire, qui suit aussi ces dépenses dans son panier.
  Source : note de champ des figures 1 à 3, Insee Première n° 1958 ; titre de
  la série `011814618`.
- L'enquête ne compare que les biens et services marchands consommés de manière
  significative des deux côtés, et laisse de côté des produits quasi exclusifs
  d'un territoire ; l'IPC suit le panier propre à chaque territoire.
  Source : section Sources, Insee Première n° 1958.
- L'enquête retient le prix brut, avant remboursement, pour les soins, les
  médicaments et les loyers subventionnés.
  Source : section Sources, Insee Première n° 1958.
  La page de série de l'IPC lue le même jour ne dit pas si l'indice retient le
  prix net : cette différence de concept n'est pas affirmée comme un fait sur
  l'IPC.

La Première ajoute que l'évolution de l'écart entre deux enquêtes ne résulte
pas seulement des IPC, parce que les structures de consommation changent
(texte sous la figure 1).

Phrase retenue pour la page, près des barres :

« L'indice des prix et l'enquête ne couvrent pas exactement les mêmes dépenses : l'enquête de 2022 laisse de côté le fioul, le gaz de ville et les transports ferroviaires, et des produits peu consommés d'un côté ou de l'autre. »

## 0.2 Observations `011814618` et `011814612`

Appel du 2026-10-06 :
`SERIES_BDM/011814618+011814612?startPeriod=2022-03`.
Aucun mois manquant de 2022-04 à 2026-08 (53 mois), aucun statut `ND`,
toutes les observations lues sont `OBS_STATUS=A`. Mars 2022 est présent en plus.

Contrôle, identique à la spec : Martinique 2022-04 = 92,71 et 2026-08 = 102,03 ;
France métropolitaine 2022-04 = 91,73 et 2026-08 = 103,38.
Les deux séries ont aussi août 2026 (Martinique 2026-07 = 101,08 ;
France métropolitaine 2026-07 = 102,70). Le dernier mois commun du lot à dix
séries sera fixé à la collecte, pas par ces deux séries seules.

## 0.3 Contrôle rétrospectif 2015 → 2022

Flux `IPC-2015`, clé mensuelle, séries arrêtées, couverture lue
2015-01 → 2025-12, aucun trou ni `ND` sur les séries ouvertes ci-dessous.
Réserve de `docs/analyse/validation.md` § 6 : de 2015 à 2022, la source de
collecte change (données de caisse en 2022). Ce contrôle n'entre pas sur le site.

**Ensemble : non faisable.** Le flux n'a une série Coicop 00 « Ensemble » que
pour la France entière et la France métropolitaine
(`001763866`, France métropolitaine, 2015-04 = 100,29, 2022-04 = 111,04).
La Martinique n'a pas de série « Ensemble » dans ce flux : ses 25 séries
utilisent d'anciens regroupements (`PRIX_CONSO`), dont « Ensemble hors tabac »
(`001769735`, code 4018) et « Ensemble hors énergie » (`001769734`, code 4017).
Aucun n'est le champ de l'écart ECSP d'ensemble. Aucun écart d'ensemble n'est
calculé.

**Alimentation : calcul possible, nomenclatures différentes.** France
métropolitaine : Coicop 01 « Produits alimentaires et boissons non alcoolisées »,
`001763867` (2015-03 = 99,98 ; 2015-04 = 99,98 ; 2022-03 = 111,87 ;
2022-04 = 113,63). Martinique : regroupement « Alimentation », `001769717`,
code 4000 (2015-03 = 99,12 ; 2015-04 = 99,38 ; 2022-03 = 108,58 ;
2022-04 = 109,13). Le titre martiniquais ne dit pas « boissons non alcoolisées ».

Même formule que le pipeline, ancre ECSP 2015 = 38,2 %
(`validation.md` § 6, Analyses Martinique n° 9) :

- avril 2015 → avril 2022 :
  (1,382 × 109,13/99,38 ÷ 113,63/99,98) − 1 = 33,5 %,
  contre 40,2 % mesurés en 2022, soit 6,7 points de moins ;
- mars 2015 → mars 2022 : 35,3 %, soit 4,9 points de moins.

C'est un écart d'estimation observé sur l'alimentation seulement, avec les
réserves de nomenclature et de source de collecte. Il n'est pas versé dans un
seed ni un Parquet, donc il ne s'affiche pas.
