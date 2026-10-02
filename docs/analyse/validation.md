# Validation du dossier de recherche

Vérification de `recherche-brute.md` (SHA-256 `04dc2221…09373ea7`), le 2026-09-29.

Statuts : **vérifié** (lu sur la source ou recalculé depuis nos Parquet), **nuancé**
(exact mais à reformuler), **corrigé** (le dossier se trompe), **rejeté** (non
vérifiable), **ajouté** (absent du dossier). Les pages ont été lues via un outil de
résumé : toute citation doit être recopiée depuis la page avant publication.

## 1. Nos chiffres, recalculés depuis le pipeline

Source : `web/public/data/differentiel_ipc.parquet`, collecte
`data/raw/insee/ipc_postes_2026-09-06T143628Z.xml`, séries base 2025.

| Élément du dossier | Statut | Détail |
|---|---|---|
| Quatre différentiels avril 2022 → juillet 2026 | vérifié | Alimentation 19,64 / 19,40 ; énergie 6,79 / 15,33 ; manufacturés 4,82 / 1,23 ; services 8,52 / 13,20. |
| Tableau des sous-périodes (10/2024, 12/2025, 07/2026) | vérifié | Les 24 valeurs sont identiques au dixième. |
| « Raccord IPC-2015 → IPC-2025 en décembre 2025 » | nuancé | C'est la méthode de l'IA. Notre pipeline lit directement les séries base 2025 depuis avril 2022 : aucun raccord de notre côté. |
| Écart estimé « culmine vers 42 % fin 2024 » | corrigé | Maximum : **42,5 % en décembre 2024** (42,2 % en octobre 2024), puis 40,3 % en juillet 2026. Estimation. |
| « L'écart s'est creusé jusqu'à octobre 2024 » (En bref) | nuancé | Le creusement continue jusqu'en décembre 2024. Garder « jusqu'à fin 2024 ». |
| Énergie « −4,8 % en 2025 (IEDOM) » | vérifié | Moyenne annuelle 2025 / 2024 (IEDOM). Coïncide avec notre −4,8 % d'octobre 2024 à décembre 2025, mais ce sont deux mesures différentes. |

## 2. Sources externes

| Élément | Statut | Source lue | Note |
|---|---|---|---|
| ECSP 2022 : alimentation Fisher 40 %, Laspeyres 50 %, Paasche 31 % ; ensemble 14 % (17 / 11) | vérifié | [Insee Analyses Martinique n° 63](https://www.insee.fr/fr/statistiques/7649202) | Afficher la fourchette 31–50 %. |
| AdlC « 40,2 % », marges nettes +1,2 % (hyper) / −1,4 % (super), frais d'approche 28 → 33,3 % (2019 → 2024), protocole « utile mais insuffisant » | vérifié | [Avis 26-A-01, 10 février 2026](https://www.autoritedelaconcurrence.fr/fr/avis/relatif-aux-marges-des-grossistes-importateurs-et-des-distributeurs-de-produits-alimentaires) | 40,2 % et 40 % : même mesure, arrondi différent ; idem 13,8 % et 14 %. |
| IEDOM : inflation 2025 de +1,1 % (France +0,9 %), services +2,6 %, énergie −4,8 %, alimentation +0,7 % d'octobre 2024 à décembre 2025 contre +2,4 % en Guadeloupe | vérifié | [IEDOM, synthèse Martinique](https://www.iedom.fr/IMG/pdf/synthese_mq.pdf) | Ajouté : « 92 % des références » des 54 familles ont baissé. |
| Bilans Insee 2022 (+4,0 % contre +5,2 % ; produits pétroliers +17,8 % contre +29 %, « différence de taxation ») | vérifié | [Insee, bilan 2022](https://www.insee.fr/fr/statistiques/7621705?sommaire=7343444) | |
| Bilan Insee 2024 (+2,8 % contre +2,0 % ; alimentation +3,6 % après +9,8 % ; électricité +13,9 %, « fin progressive du bouclier tarifaire » ; transports −1,3 %) | vérifié | [Insee, bilan 2024](https://www.insee.fr/fr/statistiques/8570905?sommaire=8354931) | |
| Pondérations de l'IPC 2024 (16 / 43 / 32 / 9 %) | vérifié | Bilan 2024 | Valeurs exactes : 1 574 / 4 334 / 3 174 / 866 pour 10 000. |
| Protocole du 16 octobre 2024 : −20 % visés, 54 familles (octroi de mer), 69 (TVA), environ 6 000 références | vérifié | [Préfecture](https://www.martinique.gouv.fr/Actualites/Signature-du-protocole-d-objectifs-et-de-moyens-de-lutte-contre-la-vie-chere) | Corrigé : ce ne sont pas « 54 portées à 69 » mais deux périmètres (54 sans octroi de mer ni TVA, 15 de plus sans TVA seulement). |
| RPPRAC non signataire, ultimatum vers juillet 2024, mobilisation publique en septembre | vérifié | [The Conversation, Fred Constant](https://theconversation.com/martinique-contre-la-vie-chere-un-collectif-atypique-242869) | |
| Bilan fin octobre 2025 : −10,5 % (54 familles), −6,6 % (15 familles) ; octroi de mer et gel des marges au 1er janvier 2025, TVA au 1er mars 2025 ; données CréO, GBH, Parfait, SAFO ; contrôles DEETS | vérifié | [Préfecture, bilan](https://www.martinique.gouv.fr/Actions-de-l-Etat/Consommation-et-commerce/Lutte-contre-la-vie-chere/Bilan-general-a-fin-octobre-2025-Protocole-de-lutte-contre-la-vie-chere-signe-le-16-octobre-2024) | **Ajouté, essentiel :** les produits suivis représentent environ **11 % des références et 15 % du chiffre d'affaires** des distributeurs concernés. 55 contrôles en magasin. |
| « −10,8 % » annoncé par l'État à mars 2025 | vérifié | [La 1ère, 12 juillet 2025](https://la1ere.franceinfo.fr/martinique/vie-chere-en-martinique-une-baisse-contestee-entre-statistiques-et-realite-du-panier-1603968.html) | |
| 5e bilan (août 2026) : chiffres derrière paywall | **ajouté** | [La 1ère, 2 septembre 2026](https://la1ere.franceinfo.fr/vie-chere-en-martinique-deux-ans-apres-les-mobilisations-les-prix-sont-toujours-plus-eleves-que-dans-l-hexagone-1734269.html) | Chiffre de l'État relayé : **−11,3 %** en moyenne sur les 54 familles (juillet 2026). |
| Couvre-feu du 10 octobre au 5 novembre 2024, levée partielle le 28 octobre (5 communes) | vérifié | [La 1ère](https://la1ere.franceinfo.fr/martinique/violences-urbaines-en-martinique-le-couvre-feu-leve-des-ce-mardi-5-novembre-a-5-heures-1534132.html) | |
| « Au moins un mort et des policiers blessés par balle » (Wikipédia) | corrigé | [RCI, 10 octobre 2024](https://rci.fm/martinique/infos/Faits-divers/Emeutes-en-Martinique-une-nuit-denfer-un-mort-par-balle-au-Robert-de-nombreux) | Un jeune homme tué par arme à feu au Robert, dans la nuit du 9 au 10 octobre, lors d'un différend entre pilleurs ; 12 gendarmes légèrement blessés, dont 1 par balle (bilan provisoire). Wikipédia retirée comme source. |
| Commission d'enquête de l'Assemblée, 20 juillet 2023, « plan de déchoquage » | vérifié | [La 1ère](https://la1ere.franceinfo.fr/vie-chere-dans-les-outre-mer-ce-qu-il-faut-retenir-de-la-commission-d-enquete-de-l-assemblee-nationale-1415357.html) | Johnny Hajjar rapporteur, Guillaume Vuilletet président. Formule exacte : « plan de déchoquage économique et social ». |
| Cour des comptes, 5 mars 2024 : l'octroi de mer « amplifie mécaniquement les effets de l'inflation » | vérifié | [Cour des comptes](https://www.ccomptes.fr/fr/publications/loctroi-de-mer-une-taxe-la-croisee-des-chemins) | |
| Octroi de mer : effet de 4 à 10 % sur le niveau des prix | **rejeté** | Même page | Absent de la synthèse de la Cour, qui dit « ni le seul ni le principal facteur ». À ne pas publier sans le rapport intégral. |
| Projet de loi Valls : déposé le 30 juillet 2025, adopté au Sénat le 28 octobre 2025, transmis le 29 octobre | vérifié | [Sénat](https://www.senat.fr/dossier-legislatif/pjl24-870.html) | Promulgation : **non trouvée** (page du Sénat mise à jour le 8 juin 2026 ; Assemblée toujours en erreur 503). Écrire « en cours d'examen à l'Assemblée au 8 juin 2026 ». |
| Rapport du Sénat du 19 mai 2026 : 80 % du marché pour les 4 distributeurs | vérifié | [La 1ère, résumé](https://la1ere.franceinfo.fr/martinique/fort-france/vie-chere-on-vous-resume-le-rapport-du-senat-sur-les-marges-de-la-grande-distribution-en-outre-mer-1703482.html) | Rapport non ouvert. Ajouté : marge nette consolidée de GBH « environ 4 % ». Corrigé : « 36,7 à 41,8 % » sont les écarts alimentaires ECSP 2022 (La Réunion → Guadeloupe) cités par le rapport, pas un résultat du Sénat. |
| Bouclier Qualité Prix automobile : signé le 23 juin 2026, en vigueur le 15 juillet 2026 | vérifié | [OPMR](https://opmrmartinique.fr/bouclier-qualite-prix-automobile-2026/) | |
| Juillet 2026 : +1,0 % sur un an en Martinique contre +2,1 % en France | vérifié | [Resca](https://resca.fr/article/2026/08/27/baisse-de-07-des-prix-a-la-consommation-en-juillet-2026/) (d'après l'Insee) | Source secondaire : remplacer par la publication Insee quand elle sera retrouvée. |
| Avril 2025 : manufacturés +0,5 % contre −0,2 % ; services +1,5 % contre +2,4 % ; services de transport −12 % | vérifié | [La 1ère, 29 mai 2025](https://la1ere.franceinfo.fr/martinique/inflation-en-martinique-des-ecarts-persistants-avec-l-hexagone-et-des-tensions-dans-certains-secteurs-1590888.html) | |
| Pauvreté 30 % (2021, seuil 1 150 €/mois/UC) ; actifs pauvres 12 % contre 9 % | vérifié | [Insee Analyses Martinique n° 80](https://www.insee.fr/fr/statistiques/8674292) | Ajouté : **15 % dans l'Hexagone** pour l'ensemble des ménages. |
| « 27 % en 2020, 12 points de plus » | **rejeté** | Page non ouverte | Remplacé par 30 % contre 15 % (2021). |
| Budget 2017 : alimentation 16,0 % contre 16,1 % ; 23 090 € contre 27 590 € ; transport premier poste (environ 1/5) | vérifié | [Insee Focus n° 180](https://www.insee.fr/fr/statistiques/4293957) | |
| Énergie : « pas de gaz de réseau en Martinique » | **rejeté pour l'instant** | Aucune | Plausible (la préfecture fixe un prix du « gaz domestique » en bouteille), mais la composition du poste Énergie n'est pas vérifiée. Ne pas publier. |

## 3. Carburants : ce que notre pipeline apporte, et un défaut détecté

- **Ajouté :** plafond du gazole en Martinique en avril 2022 = **1,81 €/L**
  ([communiqué préfecture](https://www.martinique.gouv.fr/contenu/telechargement/19272/131070/file/20220331_CP%20Carburant.pdf),
  dans `carburants.parquet`). Le dossier le marquait « non trouvé ».
- **Vérifié :** 1,90 €/L gazole et 1,91 €/L sans plomb au 1er juillet 2026 ; 2,09 €/L au
  1er mai 2026. La préfecture confirme : ni TVA ni TICPE, fiscalité fixée par la CTM ; la
  baisse de juillet est attribuée au cessez-le-feu et aux négociations États-Unis / Iran.
- **Vérifié :** les moyennes Insee Hexagone de juillet 2026 (gazole 2,04 €, SP95 2,00 €,
  E10 1,97 €), relues via l'API SDMX.
- **Défaut du pipeline, à traiter comme un sujet séparé.** Notre « médiane Hexagone »
  prend la **dernière déclaration du mois** de chaque station
  (`dbt/models/intermediate/int_carburant_station_mois.sql`), alors que le plafond
  martiniquais s'applique **dès le 1er du mois** et que l'Insee publie une **moyenne du
  mois**. Pour le gazole en 2026 :

  | Mois | Insee, moyenne | Notre médiane, fin de mois |
  |---|---|---|
  | Janvier | 1,65 | 1,66 |
  | Mars | 2,06 | 2,25 |
  | Juin | 1,96 | 1,87 |
  | Juillet | 2,04 | 2,22 |
  | Août | 2,21 | 2,21 |

  Les mois calmes concordent. Les mois de choc divergent jusqu'à 0,19 €/L, ce qui compare
  un plafond de début de mois à un prix de fin de mois. Le récit ne doit pas citer notre
  médiane mensuelle tant que ce point n'est pas tranché.

## 4. Corrections à apporter au projet de récit

| § | Correction |
|---|---|
| 2 | « jusqu'à l'automne 2024 » → « jusqu'à fin 2024 ». |
| 3 | Ajouter : RPPRAC non signataire ; un mort au Robert lors d'un différend entre pilleurs (RCI). Ne pas écrire « violences » sans précision. |
| 4 | Le −10,5 % et la comparaison avec la Guadeloupe sont des sources extérieures : **[Contexte]**, pas [Mesuré]. Préciser que le protocole couvre environ 11 % des références et 15 % du chiffre d'affaires. Notre comparaison [Mesuré] est l'Hexagone : +0,7 % contre +1,5 % d'octobre 2024 à décembre 2025. Ajouter −11,3 % à juillet 2026. |
| 5 | Ajouter la marge nette consolidée de GBH d'environ 4 % (Sénat) face aux marges de 1,2 % / −1,4 % de l'AdlC : sources en désaccord, à présenter comme tel. |
| 6 | Retirer « absence de gaz de réseau ». Mécanisme publiable : fiscalité sans TVA ni TICPE, donc une hausse du pétrole pèse moins en pourcentage (Insee 2022, préfecture 2026). L'essentiel de l'écart énergie date du choc de 2026 : +13,8 % dans l'Hexagone contre +5,7 % en Martinique de décembre 2025 à juillet 2026. |
| 7 | « culminé vers 42 % fin 2024 » → « culminé à environ 42,5 % en décembre 2024 (estimation) ». Pauvreté : « 30 % des ménages, contre 15 % dans l'Hexagone (2021) ». |

## 5. Encore ouvert

- Statut final du projet de loi Valls (le site de l'Assemblée répond en 503).
- Rapport du Sénat du 19 mai 2026 lu uniquement via La 1ère.
- Composition du poste Énergie de l'IPC Martinique.
- Évaluation indépendante de l'effet du protocole sur l'indice global : aucune trouvée.
- Recopie mot pour mot des citations (Bellemare, Desplanques, Bermont, Petitot,
  Conconne) depuis les pages.
- Méthode mensuelle des carburants Hexagone (voir § 3).

## 6. Dernier axe « vie chère » — validation ciblée (2026-10-02)

Vérification de `recherche-vie-chere.md` (sortie brute de `prompt-recherche-vie-chere.md`).
Les pages ont été lues via un outil de résumé : recopier mot pour mot avant publication.
Seuls les chiffres destinés à la conclusion ont été vérifiés ; le reste du dossier reste
non validé.

| Élément du dossier | Statut | Détail |
|---|---|---|
| Écarts de niveau Martinique 2010 / 2015 / 2022 : ensemble 9,7 / 12,3 / 13,8 % | vérifié | [Insee Première 1958](https://www.insee.fr/fr/statistiques/7648939) pour les trois ; [Analyses Martinique 9](https://www.insee.fr/fr/statistiques/1908423) pour 9,7 et 12,3. |
| Alimentation 29,5 % (2010) → 38,2 % (2015) | vérifié | Analyses Martinique 9. |
| Alimentation 2022 : 40,2 % | vérifié | Insee Première 1958 ; [Analyses 63](https://www.insee.fr/fr/statistiques/7649202) donne 40 % (arrondi). Notre seed `ecsp_alimentation_2022.csv` utilise 40,0 : même mesure arrondie. |
| Comparabilité des enquêtes | nuancé | Analyses 9 : « la comparaison entre les deux années reste délicate » (champs de consommation différents). Analyses 63 : paniers « suffisamment proches » pour comparer. À citer des deux côtés. 2015 → 2022 : source de collecte différente (données de caisse), non lu sur la page. |
| Postes 2022 (communications +37, meubles +25, alcool-tabac +23, santé +13, logement +7, transports −5) | vérifié | Analyses 63. |
| Poids de l'alimentation 14 % | vérifié | Analyses 63 : 14,0 % Martinique, 15,0 % métropole (périmètre de l'enquête de prix, pas du budget total). |
| Production locale (viande 17, boissons 28, laitiers 64 %) | vérifié | Analyses 63. |
| Niveau de vie médian 19 770 € / 23 000 € ; pauvreté 26,8 / 15,3 % (2021) | nuancé | [Insee 7752770](https://www.insee.fr/fr/statistiques/7752770) : exact, mais le comparateur est « France métropolitaine + Martinique + La Réunion », pas l'Hexagone seul. Déciles D1/D9 : absents de la page, **non vérifiés**. |
| Ménages pauvres 30 / 15 % ; travailleurs pauvres 12 / 9 % | vérifié | [Analyses 80](https://www.insee.fr/fr/statistiques/8674292), seuil 60 % du médian (1 150 €/mois). Unité = ménages, pas personnes. |
| Chômage 13 % contre 8 % (2025) | vérifié | [Analyses 83](https://www.insee.fr/fr/statistiques/8994356). |
| Taux d'emploi « −15 points » | **corrigé** | Analyses 83 : 61 % contre 70 %, soit **−9 points**. |
| Salaires : privé −11,6 %, fonction publique +27,2 %, revenu salarial +1,9 % | **corrigé** | [Insee 8733103](https://www.insee.fr/fr/statistiques/8733103?sommaire=8733125), valeurs actuelles : privé **−10,7 %** (2024), fonction publique **+19,7 %** (2024), revenu salarial **+2,1 %** (2023), non-salariés **−13,6 %** (2024). Le +27,2 % du dossier date d'un millésime antérieur et ne doit pas être repris. Référence = moyenne nationale, pas l'Hexagone. |
| Majoration de 40 % du traitement (25 % + 15 %) | non vérifié | Seul le principe est confirmé (Insee : « dispositif de majoration des traitements »). Taux et composition : extrait de recherche, à lire sur une page officielle. |
| « 40 % contre 13,8 % » attribué à la Cour des comptes | non vérifié | Extrait La 1ère, non remonté à la source. À ne pas publier tel quel. |
| Prochaine enquête de comparaison spatiale en 2028 | vérifié (réserve) | [Cnis, compte-rendu Commission Territoires du 16 juin 2026](https://www.cnis.fr/app/uploads/2026/04/cr-2026-1-com-terr.pdf) : enquête « en 2028, avec un probable recours aux données de caisse ». Formulation conditionnelle ; la page Cnis de l'enquête, elle, n'est pas à jour (collecte 2022). |
| Enquête Budget de famille « prévue en 2026 » | **corrigé** | Même compte-rendu : Budget de famille **en 2030**. |
| Frais d'approche 28 → 33,3 %, marges nettes, octroi de mer 9,6 % | vérifié en § 2 / non rouvert | Avis 26-A-01 déjà validé (voir ci-dessus). Les chiffres de la Cour (4 à 10 %) et de la CTM (1,8 % / 8,6 %) : non vérifiés, source partie prenante pour la CTM. |
| Budget des ménages modestes (20 % / 14 % ; 22,8 %) | non vérifié | Extraits de recherche. À ne pas publier sans lecture des Analyses 36 et 60. |
| Inflation par revenu | non trouvé | Étude 1998-2013 seulement. Ne rien affirmer pour aujourd'hui. |

### Corrections de fond pour la conclusion

1. « Niveau élevé **et croissant** » ne vaut que pour 2010 → 2022 (9,7 → 13,8 % ; 29,5 → 40,2 %).
   Pour 2022 → 2026, notre écart estimé est stable (40,3 % en juillet 2026 pour 40,0 %
   mesurés, après un pic estimé de 42,5 % en décembre 2024).
2. « Les gens ressentent… » : aucune enquête de perception trouvée. Écrire « coïncide avec ».
3. Salaires : utiliser les valeurs 2024 (§ ci-dessus), jamais +27,2 %.
4. Pauvreté : choisir une définition. Proposition : « 30 % des ménages (Analyses 80, 2021) »,
   déjà utilisée dans `recit.md`.
5. Ne jamais comparer au « niveau d'indice » : seules les enquêtes ECSP donnent des niveaux.
