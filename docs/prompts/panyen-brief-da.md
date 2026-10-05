# panyen — Brief de direction artistique

> **AVENANT 5b (2026-10-05, décisions de Mathis) — il l'emporte sur tout ce qui suit.**
> 1. **Thème clair seul.** Aucun thème sombre, aucune bascule, aucune règle `prefers-color-scheme: dark`. Les valeurs « sombre » ci-dessous sont abandonnées.
> 2. **Typographie « étiquette de prix »** (voir § 3 remplacé) : Archivo (largeur étendue) pour les titres, Literata pour le texte. Plus de Schibsted Grotesk, d'Atkinson ni d'IBM Plex Mono, plus d'étiquettes en majuscules espacées.
> 3. **Signature : la ligne de ticket** (étiquette, points de conduite, valeur) en plus de la règle du panier.
> 4. **« Lecture » devient « Analyse »** pour le troisième registre du récit (Mesuré / Contexte / Analyse).
> 5. **Écart 2022 alimentaire = 40,2 %** partout (Insee Première n° 1958), pas 40,0.
> 6. **Un lecteur qui découvre doit tout comprendre** : chaque section a une question en langage simple, un « À retenir », un « Comment lire », sa source ; aucun terme technique sans définition (voir `SPEC.txt` § textes).

---

> Destiné à l'implémentation avec le skill `frontend-design` (github.com/anthropics/skills).
> Inspiration principale : Reuters Graphics, « How the US economy can look pretty good but feel pretty bad » (27 août 2026).
> Inspiration secondaire : Our World in Data, « Population with UN projections ».
> Premier écran : Apple, page « Environment ».

---

## 1. Sujet, public, job unique

- **Sujet :** l'écart de prix entre la Martinique et l'Hexagone, mesuré une fois en 2022, s'est-il creusé ou resserré depuis ?
- **Public :** des non-spécialistes qui ne savent pas ce qu'est un indice des prix.
- **Job unique :** donner la réponse, sa période et sa limite (« c'est une estimation ») en moins d'une minute.

---

## 2. Couleurs

| Rôle | Nom | Valeur (thème clair seul) |
|---|---|---|
| Fond | Ardoise pâle | `#F4F6F8` |
| Texte | Encre | `#14202B` (15,3:1) |
| Texte secondaire, axes | Gris schiste | `#4A5866` (6,7:1) |
| **Martinique** | Bleu profond | `#1D5FA6` (6,0:1) |
| **Hexagone** | Ambre | `#A35F00` (4,6:1) |
| Grille, filets | Brume | `#C9D2DB` |

Contrastes calculés selon la méthode WCAG. Les deux couleurs de territoire passent le niveau AA pour du texte normal, donc elles servent aussi aux libellés directs.

**Daltonisme.** Écart perceptuel (ΔE) entre bleu et ambre, par simulation. Au-delà d'environ 20, les couleurs sont nettement distinctes. Il n'y a ni rouge ni vert.

| Vision | Écart perceptuel |
|---|---|
| Normale | 101 |
| Deutéranopie | 103 |
| Protanopie | 91 |
| Tritanopie | 72 |

**Redondance.** La couleur n'est jamais seule. Chaque série porte son nom, et la Martinique a un trait de 2,5 px contre 1,5 px pour l'Hexagone. Les deux couleurs ont une luminosité proche : sans ces libellés et ces épaisseurs, on les confondrait en niveaux de gris.

**Estimations.** Même couleur que le territoire, en hachures à 45° (trait de 1,5 px, pas de 6 px). La forme a un contour plein de 1,5 px de la même couleur, pour que le bord reste lisible, et elle porte toujours le mot « estimé ». Le hachuré ne sert à rien d'autre sur le site.

---

## 3. Typographie — « étiquette de prix » (remplace la version initiale)

Objectif : sortir du look « site généré » (grotesque + police mono + petites étiquettes en majuscules espacées). Le site doit évoquer une enseigne et un ticket de caisse, pas un tableau de bord.

- **Titres :** Archivo variable (OFL, `@fontsource-variable/archivo`), axe de largeur étendu (`wdth` d'environ 112 à 125 si l'axe est livré), graisse 800, interlettrage serré, interligne 0,95 à 1,05. Un titre ressemble à un panneau de rayon : large, lourd, court.
- **Texte :** Literata (OFL, `@fontsource-variable/literata`), 400, corps 18 px, interligne 1,6, serif conçue pour la lecture à l'écran. Italique pour les définitions.
- **Chiffres :** Archivo avec `font-variant-numeric: tabular-nums` (à vérifier à l'intégration ; sinon, chiffres de Literata). Aucune police à chasse fixe.
- **Étiquettes (navigation, légendes, badges) :** casse normale, graisse 700 ou 600, taille 14 à 15 px. **Interdit : majuscules espacées**, texte à chasse fixe, pastilles à bordure fine.
- **Hébergement :** servi par le site (Fontsource 5.3.0, OFL-1.1), aucun appel à Google Fonts ni à un CDN.

## 4. Mise en page

**Concept :** un relevé de caisse. Chaque ligne est un constat suivi de sa preuve. **Ligne de ticket** : étiquette, points de conduite (ligne pointillée discrète en fond), valeur à droite ; les listes chiffrées (postes, années, revenus) l'utilisent, le total en ligne forte. Les points de conduite ne signifient pas « estimé » : seul le hachuré le signifie.

```
MOBILE 375 px
┌─────────────────────────────┐
│ panyen                 ◐    │  ← nom + bascule thème
│                             │
│ Depuis 2022, l'écart        │  ← titre-réponse
│ [état : voir § 8].          │    Archivo 30/34
│ Estimation, fin [mois] 2026 │  ← ligne gris schiste
│                             │
│ Pour 100 € dans l'Hexagone… │
│ Hexagone     ██████████ 100 │  ← ambre, plein
│ Martinique   ██████████████ │
│  2022 mesuré           1XX  │  ← bleu, plein
│ Martinique   ██████████████▒│
│  2026 estimé           1XX  │  ← bleu, hachuré au-delà
│                             │
│ ¹ Insee, mars-avril 2022    │  ← renvois en exposant
│ ² prolongé par les indices  │
│ ↓ Comment on le sait        │
└─────────────────────────────┘

ORDINATEUR 1440 px (contenu 1120 px)
┌─────────────────────────────────────────────────────────────────┐
│ panyen                                          Méthode   ◐     │
│                                                                 │
│  Depuis 2022, l'écart           Pour 100 € dans l'Hexagone…     │
│  s'est [creusé/resserré].       Hexagone    ███████████████ 100 │
│                                 Martinique  ████████████████████│
│  Estimation, fin [mois] 2026.     2022 mesuré¹             1XX  │
│  Seul l'écart de 2022 est       Martinique  ████████████████████▒▒
│  mesuré ; la suite est            2026 estimé²             1XX  │
│  calculée.                                                      │
│  ↓ Comment on le sait           ¹ Insee ECSP 2022  ² IPC Insee  │
│  (5 colonnes)                   (7 colonnes)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Signature

**La règle du panier.** Trois barres horizontales :

1. « 100 € dans l'Hexagone » ;
2. « 1XX € en Martinique en 2022 », en plein ;
3. « 1XX € en Martinique aujourd'hui », qui prolonge la barre de 2022 par un segment hachuré.

**Même date, toujours.** Les barres 2 et 3 sont chacune exprimées « pour 100 € dans l'Hexagone **à la même date** » : la barre 3 est l'écart estimé d'aujourd'hui, pas le prix 2026 comparé au prix 2022 de l'Hexagone. Le libellé le dit, sans quoi on lirait l'inflation comme un creusement. Aucune barre n'affiche un niveau d'indice.

Elle traduit le nom *panyen* (« panier ») en une image que tout le monde lit sans savoir ce qu'est un indice. Elle porte à elle seule la règle « mesuré plein / estimé hachuré ».

---

## 6. Graphiques

| Écran | Type | Détails |
|---|---|---|
| **1. Écart 2022** | Barres horizontales « pour 100 € dans l'Hexagone » | Le total en haut, puis les quatre postes. Tout est plein, car tout est mesuré. La valeur est au bout de chaque barre (chiffres tabulaires). |
| **2. Évolutions IPC** | 4 petits graphiques (alimentation, énergie, manufacturés, services), deux courbes chacun | Chaque indice est ramené à 100 en mars-avril 2022, sur son propre territoire. Même échelle pour les quatre, libellés « Martinique » et « Hexagone » en bout de courbe. Toutes les courbes sont pleines (mesures). Chaque graphique a un intertitre-constat, par paires, à la Reuters. En dessous : l'écart estimé année par année, 2022 en barre pleine, années suivantes hachurées. |
| **3. Carburants** | Série mensuelle du gazole : ruban q10–q90 des stations métropolitaines, médiane, et plafond martiniquais en escalier | Même construction que l'écran livré après le correctif 4b (périodes d'effet du plafond). Ruban et médiane en ambre (Hexagone), plafond en **bleu** (Martinique) : plus aucun rouge. Libellés directs en bout de courbe, plafond nommé « prix maximal fixé par arrêté préfectoral ». Pas de hachure : les deux sont des données observées, mais de nature différente, et une phrase le dit. Dernière période incomplète signalée en toutes lettres. |
| **4. Pourquoi c'est ressenti plus cher** (sous la réponse) | Deux blocs : (a) série longue des écarts de niveau mesurés par l'Insee, 2010 / 2015 / 2022 (ensemble 9,7 / 12,3 / 13,8 % ; alimentation 29,5 / 38,2 / 40,2 %), barres pleines ; (b) revenus 2024 : salaire net moyen privé −10,7 %, fonction publique +19,7 %, non-salariés −13,6 %, par rapport à la moyenne nationale | Tout est mesuré, donc plein. Mention « 2010-2015 : comparaison délicate » (Insee) sous (a), « moyenne nationale, Île-de-France incluse » sous (b). Aucune barre ne dit que la vie est chère à cause de ces chiffres : l'intertitre dit « coïncide avec ». Cette section vient après la réponse principale, jamais avant. |

Règles communes :

- Jamais de double axe ni de légende séparée.
- Grille horizontale seulement, trait plein couleur « brume ».
- Le pointillé est réservé à un repère unique : le trait « mars-avril 2022 ».

---

## 7. Mouvement

**Où il y en a :**

- Les barres de la règle du panier s'allongent à l'entrée dans l'écran (250 ms). Le segment hachuré apparaît ensuite (150 ms), pour montrer que l'estimation prolonge la mesure.
- Survol ou focus d'une courbe : l'autre série passe en gris (120 ms).

**Où il n'y en a pas :**

- Ni défilement imposé ni blocs figés pendant le défilement.
- Pas de compteur de chiffres qui défile.

**« Réduire les animations » :** tout s'affiche dans son état final, sans aucun mouvement. Le contenu ne dépend jamais d'une animation pour exister.

---

## 8. Ton des textes

**Titre-réponse, trois états** (choisi par le calcul, jamais à la main) :

- Le titre nomme son sujet (courses alimentaires, Martinique, Hexagone) : voir `SPEC.txt` pour les trois phrases. Creusé : variation estimée > +2 points ;
- « Depuis 2022, l'écart s'est resserré. » : variation estimée < −2 points ;
- « Depuis 2022, l'écart est resté à peu près le même. » : entre les deux. On ajoute la ligne « Il a atteint environ 42,5 % fin 2024 (estimation), avant de revenir vers 40,3 % en juillet 2026. »

Le seuil de 2 points est un choix provisoire : l'enquête de 2022 ne fournit pas d'intervalle de confiance. À valider par Mathis.

- « En 2022, un panier payé 100 € dans l'Hexagone coûtait X € en Martinique. »
- « Depuis, l'alimentation a augmenté de X % en Martinique, contre X % dans l'Hexagone. »
- « Le prix a moins augmenté ne veut pas dire que la vie est devenue moins chère : l'écart de niveau de 2022 est resté. »
- « L'écart d'aujourd'hui n'a pas été mesuré : il est estimé à X %, en prolongeant celui de 2022. »

---

## 9. Ce qu'il ne faut pas faire

1. Afficher deux niveaux d'indice côte à côte comme s'ils disaient qui est plus cher. « 1XX contre 1XX » est interdit hors de l'écran de 2022.
2. Utiliser le hachuré ou le pointillé pour autre chose que l'estimation et le repère 2022.
3. Mettre une légende séparée, un double axe, ou distinguer les séries par la seule couleur.
4. Utiliser des drapeaux, des palmiers, du madras, des couchers de soleil, des mascottes ou des bulles de bande dessinée.
5. Imposer le défilement, faire des animations de plus de 300 ms, ou afficher un contenu invisible tant qu'il n'a pas été animé.

---

## Annexe A — Sources d'inspiration

| Page | Ce qu'on en retient |
|---|---|
| [Reuters — How the US economy can look pretty good but feel pretty bad](https://www.reuters.com/business/how-us-economy-can-look-pretty-good-feel-pretty-bad-2026-08-27/) | Intertitre-constat par graphique, paires « …mais », deux évolutions sur un axe, libellés directs, annotations sur le graphique. |
| [Our World in Data — Population with UN projections](https://ourworldindata.org/grapher/population-with-un-projections?country=~FRA) | Une seule marque qui change de texture quand la mesure s'arrête ; sous-titre qui nomme l'hypothèse ; libellé en bout de courbe. |
| [Our World in Data — Consumer price index](https://ourworldindata.org/grapher/consumer-price-index?country=FRA~DEU) | Définition d'un indice en une phrase. Contre-exemple : niveaux d'indice superposés. |
| [Apple — Environment](https://www.apple.com/environment/) | Réponse en deux phrases courtes, un chiffre par bloc, renvois en exposant. |
| [Insee Première n° 1958](https://www.insee.fr/fr/statistiques/7648939) | Source de l'écart 2022 ; titre = réponse. |
| [Insee Flash Martinique n° 235](https://www.insee.fr/fr/statistiques/8995280) | Format « titre = résultat » ; avertissement base 2025. |
| [Le Monde — Carburant : la carte des prix](https://www.lemonde.fr/les-decodeurs/article/2026/09/24/carburant-la-carte-des-prix-de-l-essence-et-du-gasoil-autour-de-chez-vous_6670140_4355771.html) | Histogramme de répartition des stations par tranche de prix. |
| [Datawrapper Academy — Range highlights and lines](https://www.datawrapper.de/academy/range-highlights-and-lines) | Convention : hachuré diagonal = donnée prévue, projetée ou provisoire. |

## Annexe B — Points à vérifier avant l'implémentation

- **Base des indices :** depuis janvier 2026, les IPC Insee sont publiés en base 2025 avec la nomenclature eCoicop. Vérifier le raccord avec les séries antérieures et la correspondance exacte des quatre postes.
- **Polices :** Archivo et Literata, OFL-1.1 (paquets variables Fontsource 5.3.0). À vérifier à l'intégration : axes réellement livrés (`wdth`, `wght`), poids du bundle, rendu à 375 px, chiffres tabulaires.
- **Choix tranchés sans information :** mois de fin de l'estimation ; échelle commune aux quatre petits graphiques (à revoir si l'énergie écrase les autres postes) ; libellé « prix maximal » pour les carburants (le prix payé en Martinique n'est pas forcément égal au plafond) ; attribution bleu = Martinique, ambre = Hexagone (arbitraire).
