# Le panier martiniquais depuis 2022 — projet de récit

*Brouillon rédigé par IA le 2026-09-29, relu le 2026-10-08 contre le Parquet
publié. Chaque paragraphe porte un seul registre : **[Mesuré]** = calculé par le
pipeline (colonne citée), **[Contexte]** = fait sourcé (lien vérifié dans
`validation.md`), **[Analyse]** = interprétation assumée. Chiffres IPC au dernier
mois commun, août 2026. `validation.md` a été établi sur juillet 2026 : l'Insee a
révisé certaines valeurs depuis, et le mois d'août est arrivé. Les phrases
[Mesuré] ci-dessous suivent le Parquet du 2026-10-08.*

---

**[Mesuré]** En mars-avril 2022, l'Insee a mesuré que les produits alimentaires
coûtaient 40,2 % de plus en Martinique que dans l'Hexagone. C'est la seule mesure
de l'écart de niveau dont on dispose pour ce poste.
*`differentiel_ipc.parquet` · `ecart_ecsp_2022_pct` (seed `ecsp_alimentation_2022.csv`).*

**[Contexte]** Ce chiffre dépend du panier retenu : 31 % avec les habitudes de
consommation martiniquaises, 50 % avec celles de l'Hexagone. Tous produits
confondus, l'écart est de 13,8 % (Analyses Martinique n° 63 arrondit le même
chiffre à 14 %).
*[Insee Analyses Martinique n° 63](https://www.insee.fr/fr/statistiques/7649202).*

**[Mesuré]** D'avril 2022 à août 2026, les prix alimentaires ont augmenté de
20,0 % en Martinique et de 19,9 % dans l'Hexagone. Presque autant, mais en deux
temps : d'avril 2022 à octobre 2024, +18,4 % contre +16,6 % ; d'octobre 2024 à
août 2026, +1,3 % contre +2,8 %.
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

**[Analyse]** Le ralentissement coïncide nettement avec le protocole. Mais le
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

**[Mesuré]** Hors alimentation, les trajectoires divergent. D'avril 2022 à août
2026, l'énergie a augmenté de 7,5 % en Martinique contre 19,4 % dans l'Hexagone,
et les services de 10,1 % contre 13,0 %. Les produits manufacturés vont en sens
inverse : +5,5 % contre +2,9 %. Après octobre 2024 : +0,8 % contre −1,5 %. Pour
l'énergie, de décembre 2025 à août 2026 : +6,4 % contre +17,8 %.
*`differentiel_evolution_points` et évolutions par poste.*

**[Contexte]** En Martinique, les carburants ne supportent ni TVA ni taxe
intérieure sur les produits énergétiques ; leur fiscalité est fixée localement et
leur prix maximal est arrêté chaque mois par le préfet. En 2022, l'Insee
attribuait déjà « en grande partie » à cette différence de taxation l'écart de
hausse des produits pétroliers : +17,8 % contre +29 %.
*[Préfecture, 1er juillet 2026](https://www.martinique.gouv.fr/Actualites/Revision-des-prix-maximum-des-produits-petroliers-au-1er-juillet-2026-a-zero-heure) ·
[Insee, bilan 2022](https://www.insee.fr/fr/statistiques/7621705?sommaire=7343444).*

**[Analyse]** L'écart sur l'énergie tient d'abord à des règles différentes : la
fiscalité et les prix administrés. Il ne dit pas que l'énergie coûte moins cher
en Martinique : il dit seulement que son prix y a moins augmenté.

**[Mesuré]** Si l'on prolonge la mesure de 2022 avec les évolutions de l'indice,
l'écart alimentaire a culminé à 42,7 % en décembre 2024, avant de revenir à
40,4 % en août 2026. C'est une estimation, pas une mesure.
*`ecart_prix_estime_pct`, `nature_ecart = estimation_a_partir_ecsp_2022`.*

**[Contexte]** Cet écart pèse sur une population plus exposée : en 2021, 30 % des
ménages martiniquais vivaient sous le seuil de pauvreté, contre 15 % dans
l'Hexagone.
*[Insee Analyses Martinique n° 80](https://www.insee.fr/fr/statistiques/8674292).*

**[Analyse]** Plus de quatre ans après la mesure de 2022 (août 2026 est à quatre
ans et quatre mois d'avril 2022), rien n'indique que l'écart alimentaire se soit
refermé. Il s'est creusé jusqu'à la crise, puis la hausse s'est ralentie :
l'écart estimé est revenu à peu près à son niveau de 2022, pas en dessous. Seule
une nouvelle enquête de comparaison spatiale de l'Insee pourra dire où en est
vraiment le panier martiniquais.

---

## Conclusion — brouillon IA du 2026-10-02, à relire et réécrire par Mathis

*Chiffres vérifiés dans `validation.md` § 6. Les sources de ces paragraphes ne sont
pas encore recopiées mot pour mot.*

**[Mesuré]** « Les prix ont moins augmenté » et « la vie est plus chère » répondent à
deux questions différentes. La première compare des évolutions depuis 2022 ; la seconde
porte sur un niveau. Sur le niveau, l'Insee a mesuré un écart alimentaire de 29,5 % en
2010, 38,2 % en 2015 et 40,2 % en 2022, et un écart tous produits de 9,7 %, 12,3 % puis
13,8 %. L'écart de niveau s'est donc creusé entre 2010 et 2022.
*Insee Analyses Martinique n° 9, Insee Première n° 1958, Analyses Martinique n° 63.*

**[Contexte]** Ces trois enquêtes ne sont pas strictement comparables : l'Insee juge la
comparaison 2010-2015 « délicate », les paniers et les modes de consommation ayant
changé. Aucune étude ne décompose ce qui a creusé l'écart. Pour l'expliquer, les sources
désignent des facteurs structurels : frais d'approche passés de 28 % à 33,3 % du coût
d'achat des importations, octroi de mer, étroitesse du marché, concentration de
l'import. Pour la grande distribution, l'Autorité de la concurrence ne relève pas de
marges nettes anormales ; elle note des marges plus élevées chez les grossistes-
importateurs et une opacité des facturations intra-groupe.
*Avis 26-A-01, Analyses Martinique n° 9 et 63.*

**[Mesuré]** Depuis 2022, l'alimentation a augmenté de 20,0 % en Martinique et de
19,9 % dans l'Hexagone. Appliqués à un niveau de départ supérieur de 40,2 %,
des pourcentages proches creusent l'écart en euros : un panier à 100 € dans
l'Hexagone et 140 € en Martinique en 2022 vaudrait 120 € et 168 €, soit 48 €
d'écart au lieu de 40 € (illustration arithmétique, pas une mesure, euros
arrondis à l'unité comme sur la page). Mesuré en pourcentage, l'écart estimé est
de 40,4 % en août 2026.
*`differentiel_ipc.parquet` ; Insee Première n° 1958.*

**[Contexte]** Le poids de ces prix dépend des revenus. En 2021, le niveau de vie
médian de la Martinique (19 770 €) est inférieur de 14 % à la médiane nationale ; 30 %
des ménages sont pauvres contre 15 % dans l'Hexagone, et 12 % des ménages vivant de
revenus d'activité sont pauvres contre 9 %. En 2025, le chômage est de 13 % contre 8 %,
et 61 % des 15-64 ans ont un emploi contre 70 % en métropole.
*Insee, niveau de vie et pauvreté 2021 ; Analyses Martinique n° 80 et n° 83.*

**[Contexte]** Les revenus sont duaux. En 2024, le salaire net moyen est inférieur de
10,7 % à la moyenne nationale dans le privé, et supérieur de 19,7 % dans la fonction
publique, « du fait du dispositif de majoration des traitements » (la moyenne nationale
inclut l'Île-de-France). Le revenu d'activité des non-salariés est inférieur de 13,6 %.
La moyenne masque donc un écart entre salariés du public et ménages du privé, des
indépendants ou des personnes sans emploi.
*Insee, disparités territoriales de salaires et de revenus d'activité.*

**[Analyse]** Ces éléments coïncident avec le sentiment d'une vie plus chère et plus
difficile : un niveau de prix alimentaire supérieur de 40 %, qui ne s'est pas refermé
depuis 2022, supporté par des revenus médians plus bas, davantage de pauvreté et de
chômage. Cette coïncidence n'est pas une démonstration. Aucune enquête de perception n'a
été trouvée, et rien n'établit aujourd'hui que les ménages modestes subissent une
inflation plus forte. Seule la prochaine enquête de comparaison spatiale, annoncée pour
2028 avec un « probable » recours aux données de caisse, dira où en est l'écart de niveau.
