# Le panier martiniquais depuis 2022 — projet de récit

*Brouillon rédigé par IA le 2026-09-29, à relire et réécrire par Mathis. Chaque
paragraphe porte un seul registre : **[Mesuré]** = calculé par le pipeline (colonne
citée), **[Contexte]** = fait sourcé (lien vérifié dans `validation.md`),
**[Lecture]** = interprétation assumée. Chiffres IPC au dernier mois commun,
juillet 2026. Aucune citation de presse tant qu'elle n'a pas été recopiée depuis
la page.*

---

**[Mesuré]** En mars-avril 2022, l'Insee a mesuré que les produits alimentaires
coûtaient 40 % de plus en Martinique que dans l'Hexagone. C'est la seule mesure
de l'écart de niveau dont on dispose.
*`differentiel_ipc.parquet` · `ecart_ecsp_2022_pct` (seed `ecsp_alimentation_2022.csv`).*

**[Contexte]** Ce chiffre dépend du panier retenu : 31 % avec les habitudes de
consommation martiniquaises, 50 % avec celles de l'Hexagone. Tous produits
confondus, l'écart est de 14 %.
*[Insee Analyses Martinique n° 63](https://www.insee.fr/fr/statistiques/7649202).*

**[Mesuré]** D'avril 2022 à juillet 2026, les prix alimentaires ont augmenté de
19,6 % en Martinique et de 19,4 % dans l'Hexagone. Presque autant, mais en deux
temps : d'avril 2022 à octobre 2024, +18,4 % contre +16,6 % ; d'octobre 2024 à
juillet 2026, +1,0 % contre +2,4 %.
*`evolution_martinique_pct`, `evolution_france_metropolitaine_pct`, poste
`alimentation`.*

**[Contexte]** À l'été 2024, le RPPRAC lance un ultimatum aux distributeurs pour
aligner les prix sur ceux de l'Hexagone, puis mobilise à partir de septembre. Dans
la nuit du 9 au 10 octobre, des émeutes éclatent ; un jeune homme est tué par
arme à feu au Robert, lors d'un différend entre pilleurs, et douze gendarmes sont
blessés, dont un par balle. Un couvre-feu s'applique du 10 octobre au 5 novembre.
*[The Conversation](https://theconversation.com/martinique-contre-la-vie-chere-un-collectif-atypique-242869) ·
[RCI](https://rci.fm/martinique/infos/Faits-divers/Emeutes-en-Martinique-une-nuit-denfer-un-mort-par-balle-au-Robert-de-nombreux) ·
[La 1ère](https://la1ere.franceinfo.fr/martinique/violences-urbaines-en-martinique-le-couvre-feu-leve-des-ce-mardi-5-novembre-a-5-heures-1534132.html).*

**[Contexte]** Le 16 octobre 2024, l'État, la Collectivité territoriale et les
acteurs économiques signent un protocole contre la vie chère, sans le RPPRAC.
Objectif : −20 % en moyenne sur les produits visés. Au 1er janvier 2025, l'octroi
de mer est supprimé sur 54 familles de produits et les marges sont gelées ; au
1er mars, la TVA est supprimée sur 69 familles. Environ 6 000 références sont
concernées, soit à peu près 11 % des références et 15 % du chiffre d'affaires des
quatre grands distributeurs.
*[Préfecture, signature](https://www.martinique.gouv.fr/Actualites/Signature-du-protocole-d-objectifs-et-de-moyens-de-lutte-contre-la-vie-chere) ·
[Préfecture, bilan à fin octobre 2025](https://www.martinique.gouv.fr/Actions-de-l-Etat/Consommation-et-commerce/Lutte-contre-la-vie-chere/Bilan-general-a-fin-octobre-2025-Protocole-de-lutte-contre-la-vie-chere-signe-le-16-octobre-2024).*

**[Contexte]** Sur ces produits, l'État annonce une baisse de 10,5 % à fin octobre
2025, puis de 11,3 % en juillet 2026. Ces chiffres viennent des données de caisse
fournies par les distributeurs, contrôlées par sondage. Selon l'IEDOM, l'indice
alimentaire martiniquais n'a pris que 0,7 % entre octobre 2024 et décembre 2025,
contre 2,4 % en Guadeloupe, qui n'a pas eu de protocole.
*[Préfecture, bilan](https://www.martinique.gouv.fr/Actions-de-l-Etat/Consommation-et-commerce/Lutte-contre-la-vie-chere/Bilan-general-a-fin-octobre-2025-Protocole-de-lutte-contre-la-vie-chere-signe-le-16-octobre-2024) ·
[La 1ère, 2 septembre 2026](https://la1ere.franceinfo.fr/vie-chere-en-martinique-deux-ans-apres-les-mobilisations-les-prix-sont-toujours-plus-eleves-que-dans-l-hexagone-1734269.html) ·
[IEDOM](https://www.iedom.fr/IMG/pdf/synthese_mq.pdf).*

**[Mesuré]** Sur la même période, d'octobre 2024 à décembre 2025, les prix
alimentaires ont augmenté de 0,7 % en Martinique et de 1,5 % dans l'Hexagone.
*`evolution_martinique_pct`, `evolution_france_metropolitaine_pct`, rapport des
facteurs entre 2024-10 et 2025-12.*

**[Lecture]** Le ralentissement coïncide nettement avec le protocole. Mais le
protocole ne couvre qu'une petite part du panier, et aucune étude indépendante
n'a encore mesuré son effet sur l'indice global. On peut constater la
coïncidence ; on ne peut pas encore parler de cause.

**[Contexte]** Sur l'origine de la vie chère, les sources ne s'accordent pas. Les
associations de consommateurs disent que les ménages ne sentent pas la baisse.
L'Autorité de la concurrence trouve des marges nettes faibles (1,2 % en
hypermarché, −1,4 % en supermarché), mais des frais d'approche passés de 28 % à
33,3 % du coût d'achat entre 2019 et 2024, et juge les mesures actuelles
insuffisantes. Le Sénat relève que quatre groupes tiennent 80 % du marché et
évalue la marge nette consolidée de GBH à environ 4 %.
*[La 1ère, 12 juillet 2025](https://la1ere.franceinfo.fr/martinique/vie-chere-en-martinique-une-baisse-contestee-entre-statistiques-et-realite-du-panier-1603968.html) ·
[Autorité de la concurrence, avis 26-A-01](https://www.autoritedelaconcurrence.fr/fr/avis/relatif-aux-marges-des-grossistes-importateurs-et-des-distributeurs-de-produits-alimentaires) ·
[La 1ère, rapport du Sénat](https://la1ere.franceinfo.fr/martinique/fort-france/vie-chere-on-vous-resume-le-rapport-du-senat-sur-les-marges-de-la-grande-distribution-en-outre-mer-1703482.html).*

**[Mesuré]** Hors alimentation, les trajectoires divergent. D'avril 2022 à juillet
2026, l'énergie a augmenté de 6,8 % en Martinique contre 15,3 % dans l'Hexagone,
et les services de 8,5 % contre 13,2 %. Les produits manufacturés vont en sens
inverse : +4,8 % contre +1,2 %, un écart apparu surtout après octobre 2024
(+0,1 % contre −3,1 %). Pour l'énergie, l'essentiel de l'écart date du choc
pétrolier de 2026 : +5,7 % contre +13,8 % de décembre 2025 à juillet 2026.
*`differentiel_evolution_points` et évolutions par poste.*

**[Contexte]** En Martinique, les carburants ne supportent ni TVA ni taxe
intérieure sur les produits énergétiques ; leur fiscalité est fixée localement et
leur prix maximal est arrêté chaque mois par le préfet. En 2022, l'Insee
attribuait déjà « en grande partie » à cette différence de taxation l'écart de
hausse des produits pétroliers : +17,8 % contre +29 %.
*[Préfecture, 1er juillet 2026](https://www.martinique.gouv.fr/Actualites/Revision-des-prix-maximum-des-produits-petroliers-au-1er-juillet-2026-a-zero-heure) ·
[Insee, bilan 2022](https://www.insee.fr/fr/statistiques/7621705?sommaire=7343444).*

**[Lecture]** L'écart sur l'énergie tient d'abord à des règles différentes —
fiscalité, prix administrés — plus qu'à un rattrapage. Il ne dit pas que
l'énergie coûte moins cher en Martinique : il dit seulement que son prix y a
moins augmenté.

**[Mesuré]** Si l'on prolonge la mesure de 2022 avec les évolutions de l'indice,
l'écart alimentaire aurait culminé à environ 42,5 % en décembre 2024, avant de
revenir vers 40,3 % en juillet 2026. C'est une estimation, pas une mesure.
*`ecart_prix_estime_pct`, `nature_ecart = estimation_a_partir_ecsp_2022`.*

**[Contexte]** Cet écart pèse sur une population plus exposée : en 2021, 30 % des
ménages martiniquais vivaient sous le seuil de pauvreté, contre 15 % dans
l'Hexagone.
*[Insee Analyses Martinique n° 80](https://www.insee.fr/fr/statistiques/8674292).*

**[Lecture]** Quatre ans après la mesure de 2022, rien n'indique que l'écart
alimentaire se soit refermé. Il s'est creusé jusqu'à la crise, puis la hausse
s'est ralentie : l'écart estimé est revenu à peu près à son niveau de 2022, pas
en dessous. Seule une nouvelle enquête de
comparaison spatiale de l'Insee pourra dire où en est vraiment le panier
martiniquais.
