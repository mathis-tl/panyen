# panyen : vérification, contexte et projet de récit

*Martinique, avril 2022 → juillet 2026. Dossier établi le 29 septembre 2026.*

## En bref

- **Les quatre différentiels sont exacts.** Ils ont été recalculés à l'identique à partir des séries brutes de l'Insee. L'IEDOM confirme aussi, de façon indépendante, le chiffre alimentaire de la période du protocole.
- **Le +0,2 pt de l'alimentation cache deux phases.** L'écart s'est creusé jusqu'à octobre 2024, puis s'est resserré après le protocole.
- **L'écart de niveau reste une estimation.** Aucune mesure officielle n'a remplacé celle de 2022. L'Autorité de la concurrence, en 2026, cite encore le chiffre de 2022.

## Limites de la recherche

- Pages non ouvertes : zinfos974 (erreur 403), dossier législatif de l'Assemblée nationale (erreur 503).
- L'article du Legis sur le 5ᵉ bilan du protocole est derrière un paywall.
- Les citations de presse sont volontairement limitées à une seule. Pour les autres, le dossier donne l'auteur, la source et le sens : le texte exact est à recopier depuis la page.
- Plusieurs pages ont été lues via un outil de résumé : relire chaque chiffre et chaque phrase sur la source avant publication.

---

## 1. Validation des chiffres

**Méthode de contrôle.** Recalcul à partir de l'API Insee (BDM, séries mensuelles « ensemble des ménages », Martinique = D972, France métropolitaine = FM) :

- l'ancienne base (IPC-2015) est prolongée par la nouvelle (IPC-2025) en décembre 2025 ;
- le résultat ne varie que de ±0,02 pt selon le mois de raccord choisi.

C'est un **recalcul, pas une source indépendante**. Les confirmations indépendantes figurent dans la colonne « Chiffre publié ».

| Notre chiffre | Chiffre publié | Période | Source | Écart et explication |
|---|---|---|---|---|
| Alimentation +40 % (Fisher) | Fisher +40 %. Avec le panier hexagonal (Laspeyres) +50 %, avec le panier martiniquais (Paasche) +31 %. Ensemble des produits +14 % (13,8 %). | Mars-avril 2022 | [Insee Analyses Martinique n° 63](https://www.insee.fr/fr/statistiques/7649202), juillet 2023 | Aucun écart. À afficher avec sa **fourchette de 31 à 50 %**. L'Autorité de la concurrence reprend « 40,2 % » ([avis 26-A-01](https://www.autoritedelaconcurrence.fr/fr/avis/relatif-aux-marges-des-grossistes-importateurs-et-des-distributeurs-de-produits-alimentaires)). |
| Alimentation +19,6 % contre +19,4 % | Recalcul identique : +19,63 % contre +19,41 %. **IEDOM : +0,7 % d'octobre 2024 à décembre 2025 en Martinique**, exactement notre série, contre +2,4 % en Guadeloupe. | Avril 2022 → juillet 2026 | [IEDOM, synthèse 2025](https://www.iedom.fr/IMG/pdf/synthese_mq.pdf) (avril 2026). Moyennes annuelles Insee : +5,4 % en 2022 ([bilan 2022](https://www.insee.fr/fr/statistiques/7621705?sommaire=7343444)), +9,8 % en 2023 et +3,6 % en 2024 ([bilan 2024](https://www.insee.fr/fr/statistiques/8570905?sommaire=8354931)) | Confirmé. Les bilans Insee donnent des **moyennes annuelles**, pas des évolutions entre deux mois : pas directement comparables. |
| Énergie +6,8 % contre +15,3 % | Recalcul identique. Martinique : +15,0 % en moyenne 2022, +6,1 % en 2024 (électricité +13,9 %, « fin progressive du bouclier tarifaire »), −4,8 % en 2025 (IEDOM). | Idem | Bilans Insee 2022 et 2024, IEDOM | Confirmé. **Nuance :** l'essentiel de l'écart date de décembre 2025 → juillet 2026 : +13,8 % dans l'Hexagone, +5,7 % en Martinique (calcul propre). |
| Manufacturés +4,8 % contre +1,2 % | Recalcul identique. Martinique : +2,5 % en 2022, +1,4 % en 2024. Avril 2025 sur un an : +0,5 % en Martinique contre −0,2 % en France. | Idem | Bilans Insee ; [La 1ère, 29 mai 2025](https://la1ere.franceinfo.fr/martinique/inflation-en-martinique-des-ecarts-persistants-avec-l-hexagone-et-des-tensions-dans-certains-secteurs-1590888.html) | Confirmé. L'écart apparaît surtout **après octobre 2024**, quand les prix baissent dans l'Hexagone. |
| Services +8,5 % contre +13,2 % | Recalcul identique. Martinique : +2,6 % en 2022, +2,8 % en 2024, +2,6 % en 2025 (IEDOM). Avril 2025 : +1,5 % contre +2,4 %. | Idem | Insee, IEDOM, La 1ère | Confirmé. |
| Carburants à prix maximum mensuel | Prix fixés par le préfet chaque mois. Ni TVA ni accise nationale, mais une fiscalité locale fixée par la CTM. Au 1ᵉʳ juillet 2026 : sans plomb 1,91 €/L, gazole 1,90 €/L. | Juillet 2026 | [Préfecture, 1ᵉʳ juillet 2026](https://www.martinique.gouv.fr/Actualites/Revision-des-prix-maximum-des-produits-petroliers-au-1er-juillet-2026-a-zero-heure) | Confirmé. Moyenne Hexagone en juillet 2026 (Insee) : gazole 2,04 €, SP95 2,00 €, E10 1,97 € ([série 000442588](https://www.insee.fr/fr/statistiques/serie/000442588), [série 000849411](https://www.insee.fr/fr/statistiques/serie/000849411), [série 010596132](https://www.insee.fr/fr/statistiques/serie/010596132)). **Attention :** on compare un plafond et une moyenne. Prix de la Martinique en avril 2022 : **non trouvé**. |
| L'écart alimentaire reste d'environ 40 % | Aucune nouvelle mesure officielle. L'Autorité de la concurrence (février 2026) et La 1ère (septembre 2026) citent toujours 2022. | — | [La 1ère, 2 septembre 2026](https://la1ere.franceinfo.fr/vie-chere-en-martinique-deux-ans-apres-les-mobilisations-les-prix-sont-toujours-plus-eleves-que-dans-l-hexagone-1734269.html) | **Estimation.** Prolongement : environ 42 % en octobre 2024, environ 40 % en juillet 2026. La fourchette de 31 à 50 % s'applique toujours. |

### Évolutions par sous-période (calcul propre, séries Insee)

| Poste | Martinique 04/2022 → 10/2024 | Hexagone 04/2022 → 10/2024 | Martinique 10/2024 → 12/2025 | Hexagone 10/2024 → 12/2025 | Martinique 12/2025 → 07/2026 | Hexagone 12/2025 → 07/2026 |
|---|---|---|---|---|---|---|
| Alimentation | +18,4 % | +16,6 % | +0,7 % | +1,5 % | +0,3 % | +0,9 % |
| Énergie | +6,2 % | +7,8 % | −4,8 % | −6,0 % | +5,7 % | +13,8 % |
| Manufacturés | +4,7 % | +4,5 % | +0,3 % | −0,9 % | −0,2 % | −2,2 % |
| Services | +4,1 % | +6,5 % | +4,0 % | +2,3 % | +0,3 % | +3,9 % |

---

## 2. Chronologie sourcée

Types de source : **O** = officielle, **P** = presse, **E** = étude ou institution, **S** = partie prenante.

| Date | Fait | Source |
|---|---|---|
| Mars-avril 2022 | L'Insee mesure les prix en Martinique et en métropole : +14 % sur l'ensemble, +40 % sur l'alimentation. | [Insee](https://www.insee.fr/fr/statistiques/7649202) (O) |
| 2022 | Inflation de 4,0 % en Martinique contre 5,2 % en France. Produits pétroliers : +17,8 % contre +29 %, écart que l'Insee attribue à une fiscalité différente. Contexte : guerre en Ukraine et baisse de l'euro. | [Insee, bilan 2022](https://www.insee.fr/fr/statistiques/7621705?sommaire=7343444) (O) |
| 20 juillet 2023 | Rapport de la commission d'enquête de l'Assemblée sur la vie chère (Johnny Hajjar, Guillaume Vuilletet). Il demande un « plan de déchoquage » et la transparence des marges. | [La 1ère](https://la1ere.franceinfo.fr/vie-chere-dans-les-outre-mer-ce-qu-il-faut-retenir-de-la-commission-d-enquete-de-l-assemblee-nationale-1415357.html) (P) |
| 5 mars 2024 | La Cour des comptes juge que l'octroi de mer « amplifie mécaniquement » l'inflation et appelle à le réformer. | [Cour des comptes](https://www.ccomptes.fr/fr/publications/loctroi-de-mer-une-taxe-la-croisee-des-chemins) (O) |
| 2024 | Inflation de 2,8 % en Martinique contre 2,0 % en France. Alimentation +3,6 % (après +9,8 % en 2023), électricité +13,9 %. | [Insee, bilan 2024](https://www.insee.fr/fr/statistiques/8570905?sommaire=8354931) (O) |
| Juillet → septembre 2024 | Le RPPRAC lance un ultimatum aux distributeurs pour aligner les prix sur l'Hexagone, puis se mobilise à partir de septembre. | [The Conversation, Fred Constant](https://theconversation.com/martinique-contre-la-vie-chere-un-collectif-atypique-242869) (E) |
| 10 octobre → 5 novembre 2024 | Couvre-feu, levé partiellement le 28 octobre (maintenu à Case-Pilote, Fort-de-France, Lamentin, Saint-Joseph et Schœlcher) puis totalement le 5 novembre. | [La 1ère](https://la1ere.franceinfo.fr/martinique/violences-urbaines-en-martinique-le-couvre-feu-leve-des-ce-mardi-5-novembre-a-5-heures-1534132.html) (P) |
| 10 octobre 2024 | Au moins un mort et des policiers blessés par balle (**source tertiaire, à vérifier**). | [Wikipédia](https://en.wikipedia.org/wiki/2024_Martinique_social_unrest) |
| 16 octobre 2024 | Signature du protocole, sans le RPPRAC. Objectif : −20 % en moyenne sur 54 familles de produits (portées ensuite à 69, soit environ 6 000 références). | [Préfecture](https://www.martinique.gouv.fr/Actualites/Signature-du-protocole-d-objectifs-et-de-moyens-de-lutte-contre-la-vie-chere) (O) ; The Conversation (E) |
| 1ᵉʳ janvier 2025 | Octroi de mer supprimé sur les produits du protocole et gel des taux de marge des distributeurs. | [Préfecture, bilan à fin octobre 2025](https://www.martinique.gouv.fr/Actions-de-l-Etat/Consommation-et-commerce/Lutte-contre-la-vie-chere/Bilan-general-a-fin-octobre-2025-Protocole-de-lutte-contre-la-vie-chere-signe-le-16-octobre-2024) (O) |
| 1ᵉʳ mars 2025 | TVA supprimée sur les produits du protocole. | Idem (O) |
| Mars → juillet 2025 | L'État annonce −10,8 % sur 54 familles d'après les données de caisse. Les associations de consommateurs contestent ce chiffre. | [La 1ère, 12 juillet 2025](https://la1ere.franceinfo.fr/martinique/vie-chere-en-martinique-une-baisse-contestee-entre-statistiques-et-realite-du-panier-1603968.html) (P) |
| 30 juillet → 28 octobre 2025 | Projet de loi Valls sur la vie chère : déposé au Sénat, adopté en première lecture, transmis à l'Assemblée. **Promulgation : non trouvée.** | [Sénat](https://www.senat.fr/dossier-legislatif/pjl24-870.html) (O) |
| Fin octobre 2025 | Bilan du protocole : −10,5 % (54 familles sans octroi de mer ni TVA), −6,6 % (15 familles sans TVA seulement). Données fournies par 4 distributeurs (CréO, GBH, Parfait, SAFO), contrôlées par sondage par la DEETS. | Préfecture (O) |
| 2025 | Inflation de 1,1 % en Martinique contre 0,9 % en France. Alimentation +0,7 % d'octobre 2024 à décembre 2025. | [IEDOM](https://www.iedom.fr/IMG/pdf/synthese_mq.pdf) (E) |
| 10 février 2026 | Avis 26-A-01 de l'Autorité de la concurrence : marges nettes de 1,2 % en hypermarché et −1,4 % en supermarché ; frais d'approche passés de 28 % à 33,3 % du coût d'achat depuis 2019 ; mesures jugées insuffisantes. | [Autorité de la concurrence](https://www.autoritedelaconcurrence.fr/fr/avis/relatif-aux-marges-des-grossistes-importateurs-et-des-distributeurs-de-produits-alimentaires) (O) |
| Fin février → juin 2026 | Conflit en Iran et flambée du pétrole. Au 1ᵉʳ mai 2026, le gazole atteint 2,09 € en Martinique ; baisse en juillet avec le cessez-le-feu. | IEDOM ; [Préfecture](https://www.martinique.gouv.fr/Actualites/Revision-des-prix-maximum-des-produits-petroliers-au-1er-juillet-2026-a-zero-heure) (O) |
| 19 mai 2026 | Rapport du Sénat sur les marges de la grande distribution : GBH, Parfait, CréO et SAFO détiennent 80 % du marché en Martinique. | [La 1ère, résumé](https://la1ere.franceinfo.fr/martinique/fort-france/vie-chere-on-vous-resume-le-rapport-du-senat-sur-les-marges-de-la-grande-distribution-en-outre-mer-1703482.html) (P, rapport lui-même non ouvert) |
| 15 juillet 2026 | Entrée en vigueur du Bouclier Qualité Prix automobile (signé le 23 juin 2026). | Résultat de recherche, page non ouverte : [OPMR](https://opmrmartinique.fr/bouclier-qualite-prix-automobile-2026/) |
| Juillet 2026 | Inflation sur un an : 1,0 % en Martinique contre 2,1 % en France. | [Resca](https://resca.fr/article/2026/08/27/baisse-de-07-des-prix-a-la-consommation-en-juillet-2026/) (P, d'après l'Insee) |
| Août 2026 | 5ᵉ bilan du protocole : la préfecture dit que la baisse « persiste ». Chiffres derrière paywall. | [Le Legis](https://www.lelegis.fr/2026/08/07/protocole-de-lutte-contre-la-vie-chere-la-baisse-des-prix-se-maintient-assurent-les-services-de-letat/) (P, paywall) |

---

## 3. Les mécanismes, poste par poste

Niveaux de preuve : **D** = démontré (étude chiffrée), **P** = plausible (argument documenté), **C** = contesté (sources en désaccord).

### Alimentation : l'écart s'est creusé puis resserré

- **[Mesuré]**
  - D'avril 2022 à octobre 2024 : +18,4 % en Martinique contre +16,6 % dans l'Hexagone.
  - D'octobre 2024 à juillet 2026 : +1,0 % en Martinique contre +2,4 % dans l'Hexagone.
- **Suppression de l'octroi de mer et de la TVA, gel des marges.** Soutenu par l'État (−10,5 % sur le périmètre du protocole). **D** pour ce périmètre, qui ne représente qu'une partie du panier. Le lien avec l'indice global : **« coïncide avec »**, aucune étude ne le démontre.
  - Point de vue opposé : l'AFOC (association de consommateurs, partie prenante) dit que les ménages ne sentent pas la baisse.
  - Point de vue opposé : l'Autorité de la concurrence craint des hausses sur les produits hors protocole. **C**
- **Coûts d'approche et fret** (de 28 % à 33,3 % du coût d'achat). Soutenu par l'Autorité de la concurrence. **D** pour la hausse de ces coûts ; leur effet sur l'inflation est **P**.
- **Marges et concentration.**
  - L'Autorité de la concurrence et GBH (distributeur, partie prenante) disent que les marges des distributeurs ne sont pas excessives.
  - Le Sénat et la commission d'enquête de l'Assemblée pointent l'oligopole, les exclusivités de fait et la multiplication des intermédiaires.
  - Niveau : **C**.
- **Octroi de mer.** La Cour des comptes situe son effet sur le niveau des prix entre 4 et 10 % (fourchette lue via Banque des Territoires, non vérifiée dans le rapport). **P** : cela concerne le niveau des prix, pas leur évolution.

### Énergie

- **Structure du panier.** L'énergie de l'Hexagone inclut le gaz de réseau, qui n'existe pas en Martinique. **P**, synthèse propre : à vérifier dans la composition de l'indice.
- **Fiscalité des carburants.** Sans TVA ni accise nationale, les hausses du pétrole se répercutent moins en pourcentage. L'Insee l'avance pour 2022 (+17,8 % contre +29 %). **P**, argument de l'Insee.
- **Prix plafonnés, révisés chaque mois.** Ils lissent et décalent les chocs de prix. **P**, déduit de la méthode de la préfecture.
- **Électricité.** Hausse de +13,9 % en 2024 à la fin du bouclier tarifaire (Insee). **D** pour l'année 2024.

### Carburants

- Martinique : prix maximaux fixés chaque mois par arrêté préfectoral, calculés à partir des cotations, du dollar et de la fiscalité locale.
- Hexagone : prix libres ; seule une moyenne mensuelle (Insee) permet la comparaison.
- En juillet 2026, les plafonds de la Martinique (1,91 € / 1,90 €) sont inférieurs aux moyennes de l'Hexagone (2,00 € / 2,04 €). Ce n'est qu'un instantané : **pas de conclusion sur la période**.

### Produits manufacturés

- Fret et coûts d'approche, octroi de mer qui amplifie les hausses : **P** (Autorité de la concurrence, Cour des comptes).
- **Aucune étude trouvée** n'explique pourquoi les prix de l'Hexagone baissent depuis fin 2024 alors que ceux de la Martinique stagnent.

### Services

- Les transports reculent en Martinique : −1,3 % en 2024, −12 % pour les services de transport en avril 2025. **D** pour ces mois.
- Qu'ils expliquent la différence avec l'Hexagone sur toute la période reste **P**.
- Autres pistes (poids des loyers, salaires) : **non trouvé**.

---

## 4. La dimension humaine et sociale

### Chiffres sociaux (Insee)

- Taux de pauvreté : 30 % des ménages en 2021, seuil de 1 150 € par mois par unité de consommation ([Insee Analyses Martinique n° 80](https://www.insee.fr/fr/statistiques/8674292), décembre 2025).
- En 2020 : 27 %, soit 12 points de plus qu'en métropole. Chiffre relevé dans un résultat de recherche, page non ouverte.
- Ménages actifs pauvres : 12 % en Martinique contre 9 % en métropole.
- Budget 2017 ([Insee Focus 180](https://www.insee.fr/fr/statistiques/4293957)) :
  - part de l'alimentation : 16,0 % en Martinique contre 16,1 % en métropole ;
  - dépense moyenne : 23 090 € contre 27 590 € ;
  - le transport est le premier poste en Martinique, à 20 %.
- Pondération de l'indice des prix 2024 : alimentation 16 %, services 43 %, manufacturés 32 %, énergie 9 %.

### Citation

> « il a l'impression que rien n'a changé »

Éric Bellemare, président de l'AFOC Martinique (association de consommateurs, **partie prenante**), dans [La 1ère, 12 juillet 2025](https://la1ere.franceinfo.fr/martinique/vie-chere-en-martinique-une-baisse-contestee-entre-statistiques-et-realite-du-panier-1603968.html).

### À recopier depuis les sources

- **La 1ère, 12 juillet 2025 :**
  - le préfet Étienne Desplanques défend la fiabilité des données de caisse ;
  - Christophe Bermont, directeur d'un hypermarché GBH (**partie prenante**), prévient que les prix mondiaux peuvent faire remonter certains produits.
- **[La 1ère, 2 septembre 2026](https://la1ere.franceinfo.fr/vie-chere-en-martinique-deux-ans-apres-les-mobilisations-les-prix-sont-toujours-plus-eleves-que-dans-l-hexagone-1734269.html) :**
  - une manifestante sans enfants décrit une souffrance quotidienne ;
  - Rodrigue Petitot (RPPRAC, **partie prenante**) revendique l'appartenance au territoire.
- **[La 1ère, octobre 2025](https://la1ere.franceinfo.fr/on-marche-sur-la-tete-le-projet-de-loi-contre-la-vie-chere-en-outre-mer-adopte-au-senat-les-elus-ultramarins-decus-1637956.html) :** la sénatrice Catherine Conconne (PS, Martinique) critique l'appel aux contributions volontaires des entreprises.

**Avertissement :** ces extraits ont été restitués par un outil de résumé. Relire chaque phrase sur la page avant de la publier.

---

## 5. Projet de récit

**1. [Mesuré]** En mars-avril 2022, l'Insee a mesuré ce que chacun savait. Les produits alimentaires coûtaient 40 % de plus en Martinique que dans l'Hexagone : entre 31 % et 50 % selon le panier retenu. C'est la seule mesure de niveau dont on dispose.

**2. [Mesuré]** Depuis, les deux territoires ont connu la même inflation alimentaire : +19,6 % en Martinique et +19,4 % dans l'Hexagone entre avril 2022 et juillet 2026. Ce quasi-match cache deux phases. Jusqu'à l'automne 2024, les prix ont monté plus vite en Martinique. Depuis, ils y montent moins vite.

**3. [Contexte]** La rupture coïncide avec la crise de l'automne 2024 : mobilisation lancée par le RPPRAC, couvre-feu du 10 octobre au 5 novembre, violences. Le protocole du 16 octobre a supprimé l'octroi de mer et la TVA sur environ 6 000 références et gelé les marges des distributeurs.

**4. [Mesuré]** Sur les produits visés, l'État mesure une baisse de 10,5 %. Sur tout le panier alimentaire, l'indice n'a pris que 0,7 % entre octobre 2024 et décembre 2025, contre 2,4 % en Guadeloupe. **[Lecture]** La coïncidence est nette. Aucune étude ne prouve encore la causalité.

**5. [Contexte]** Les associations disent que les ménages ne sentent rien. L'Autorité de la concurrence juge les marges des distributeurs normales mais pointe des coûts d'approche en hausse et des exclusivités de fait. Le Sénat, lui, dénonce l'oligopole. Le débat sur la cause de la vie chère reste ouvert.

**6. [Mesuré]** Sur l'énergie et les services, la Martinique a connu moins d'inflation que l'Hexagone : −8,5 et −4,7 points. Sur les produits manufacturés, elle en a connu plus : +3,6 points. **[Lecture]** Des prix de carburant plafonnés et sans TVA, et l'absence de gaz de réseau, rendent cet écart plausible. Il ne dit rien sur le niveau des prix.

**7. [Lecture]** Si l'on prolonge la mesure de 2022, l'écart alimentaire aurait culminé vers 42 % fin 2024 avant de revenir vers 40 %. C'est une estimation. Seule une nouvelle enquête de l'Insee pourra la confirmer, dans une île où 30 % des ménages vivent sous le seuil de pauvreté.

---

## 6. Les manques

- **Écart de niveau :** aucune mesure depuis 2022. Nouvelle enquête Insee prévue : **non trouvé**.
- **Protocole :**
  - bilans fournis par 4 distributeurs, contrôlés par sondage : aucune évaluation indépendante de l'effet sur l'indice global ;
  - chiffres du 5ᵉ bilan (août 2026) et du bilan OPMR (avril 2026) non consultés.
- **Carburants :** prix plafonds de la Martinique en avril 2022 non trouvés ; historique à récupérer sur martinique.gouv.fr ou auprès de la DEETS.
- **Changement de base Insee :** la base 2025 suit une nouvelle nomenclature (COICOP 2018), donc le contour des postes peut bouger. Mentionner le raccord de décembre 2025 sur le site.
- **Énergie :** vérifier la composition du poste Énergie en Martinique (gaz, électricité) pour étayer le mécanisme « pas de gaz de réseau ».
- **Écarts sociaux :** inflation par niveau de revenu en Martinique non trouvée.
- **À recouper :**
  - le 13,8 % de l'Autorité de la concurrence et le 14 % de l'Insee (même chiffre, arrondi différent) ;
  - le mort du 10 octobre 2024 (source tertiaire) ;
  - le statut du projet de loi Valls (Assemblée, commission mixte paritaire) ;
  - les chiffres du rapport du Sénat (36,7 à 41,8 % pour l'alimentation dans les DOM), lus via La 1ère seulement.
