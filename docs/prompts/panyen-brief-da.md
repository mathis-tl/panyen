# panyen — Brief de direction artistique

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

| Rôle | Nom | Thème clair | Thème sombre |
|---|---|---|---|
| Fond | Ardoise pâle / Nuit d'encre | `#F4F6F8` | `#121C27` |
| Texte | Encre | `#14202B` (15,3:1) | `#E8EDF2` (14,6:1) |
| Texte secondaire, axes | Gris schiste | `#4A5866` (6,7:1) | `#A3B1BF` (7,9:1) |
| **Martinique** | Bleu profond | `#1D5FA6` (6,0:1) | `#7DB3F0` (7,8:1) |
| **Hexagone** | Ambre | `#A35F00` (4,6:1) | `#F0B259` (9,2:1) |
| Grille, filets | Brume | `#C9D2DB` | `#2E3C4A` |

Contrastes calculés selon la méthode WCAG. Les deux couleurs de territoire passent le niveau AA pour du texte normal dans les deux thèmes, donc elles servent aussi aux libellés directs.

**Daltonisme.** Écart perceptuel (ΔE) entre bleu et ambre, par simulation. Au-delà d'environ 20, les couleurs sont nettement distinctes. Il n'y a ni rouge ni vert.

| Vision | Clair | Sombre |
|---|---|---|
| Normale | 101 | 91 |
| Deutéranopie | 103 | 93 |
| Protanopie | 91 | 87 |
| Tritanopie | 72 | 71 |

**Redondance.** La couleur n'est jamais seule. Chaque série porte son nom, et la Martinique a un trait de 2,5 px contre 1,5 px pour l'Hexagone. Les deux couleurs ont une luminosité proche : sans ces libellés et ces épaisseurs, on les confondrait en niveaux de gris.

**Estimations.** Même couleur que le territoire, en hachures à 45° (trait de 1,5 px, pas de 6 px). La forme a un contour plein de 1,5 px de la même couleur, pour que le bord reste lisible, et elle porte toujours le mot « estimé ». Le hachuré ne sert à rien d'autre sur le site.

---

## 3. Typographie

- **Titres :** Schibsted Grotesk (Google Fonts, OFL), graisses 600 à 700. Grotesque d'origine presse, sobre, sans le contraste d'un serif « magazine ».
- **Texte :** Atkinson Hyperlegible Next (Google Fonts, OFL). Dessinée pour la lisibilité en basse vision.
- **Chiffres :** IBM Plex Mono (OFL), graisse 500. Toutes les valeurs, axes et libellés numériques l'utilisent. Chiffres tabulaires par construction, donc alignés sans réglage.

---

## 4. Mise en page

**Concept :** un relevé de caisse. Un ticket étroit en colonne, où chaque ligne est un constat suivi de sa preuve.

```
MOBILE 375 px
┌─────────────────────────────┐
│ panyen                 ◐    │  ← nom + bascule thème
│                             │
│ Depuis 2022, l'écart        │  ← titre-réponse
│ s'est [creusé/resserré].    │    Schibsted 30/34
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

Elle traduit le nom *panyen* (« panier ») en une image que tout le monde lit sans savoir ce qu'est un indice. Elle porte à elle seule la règle « mesuré plein / estimé hachuré ».

---

## 6. Graphiques

| Écran | Type | Détails |
|---|---|---|
| **1. Écart 2022** | Barres horizontales « pour 100 € dans l'Hexagone » | Le total en haut, puis les quatre postes. Tout est plein, car tout est mesuré. La valeur est au bout de chaque barre (Plex Mono). |
| **2. Évolutions IPC** | 4 petits graphiques (alimentation, énergie, manufacturés, services), deux courbes chacun | Chaque indice est ramené à 100 en mars-avril 2022, sur son propre territoire. Même échelle pour les quatre, libellés « Martinique » et « Hexagone » en bout de courbe. Toutes les courbes sont pleines (mesures). Chaque graphique a un intertitre-constat, par paires, à la Reuters. En dessous : l'écart estimé année par année, 2022 en barre pleine, années suivantes hachurées. |
| **3. Carburants** | Histogramme de la répartition des prix en métropole + trait vertical pour le plafond martiniquais | Barres ambre pleines. Trait bleu libellé « prix maximal fixé par arrêté préfectoral ». Pas de hachure : les deux sont des données observées, mais de nature différente, et une phrase le dit. |

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
- Pas de transition lors du changement de thème.

**« Réduire les animations » :** tout s'affiche dans son état final, sans aucun mouvement. Le contenu ne dépend jamais d'une animation pour exister.

---

## 8. Ton des textes

- « En 2022, un panier payé 100 € dans l'Hexagone coûtait X € en Martinique. »
- « Depuis, l'alimentation a augmenté de X % en Martinique, contre X % dans l'Hexagone. »
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
- **Polices :** confirmer la licence OFL de Schibsted Grotesk et d'Atkinson Hyperlegible Next sur leur fiche Google Fonts. Les chiffres tabulaires de ces deux polices n'ont pas été vérifiés, d'où IBM Plex Mono pour tous les chiffres.
- **Choix tranchés sans information :** mois de fin de l'estimation ; échelle commune aux quatre petits graphiques (à revoir si l'énergie écrase les autres postes) ; libellé « prix maximal » pour les carburants (le prix payé en Martinique n'est pas forcément égal au plafond) ; attribution bleu = Martinique, ambre = Hexagone (arbitraire).
