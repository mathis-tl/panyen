/**
 * Page « Pour les techos » : comment le site est fait.
 * Aucun chiffre qui ne soit déjà une règle du projet. Pas de Parquet.
 */
import "./polices.css";
import "./style.css";
import { creerEntete } from "./entete.ts";

const PARAGRAPHES: Array<{ titre: string; textes: string[] }> = [
  {
    titre: "La question",
    textes: [
      "Panye répond à une seule question : l'écart de prix mesuré en 2022 entre la Martinique et l'Hexagone s'est-il creusé ou resserré depuis ?",
      "L'Hexagone, ici, c'est la France métropolitaine.",
    ],
  },
  {
    titre: "Les données",
    textes: [
      "La collecte écrit le brut horodaté, sans le modifier. Le nettoyage et les calculs viennent ensuite, avec dbt, jusqu'à des fichiers Parquet.",
      "La page n'a pas de serveur. Le navigateur lit ces Parquet. Si un contrôle échoue, le fichier publié n'est pas remplacé.",
    ],
  },
  {
    titre: "Ce qu'on compare",
    textes: [
      "Un indice des prix est en base 100 sur son propre territoire. L'indice martiniquais et l'indice de l'Hexagone ne se comparent pas en niveau : chacun mesure une évolution depuis son propre point de départ.",
      "Comparer deux évolutions est le cœur du site. Comparer deux niveaux d'indice serait faux.",
      "Le seul écart de niveau connu vient de l'enquête de comparaison spatiale des prix de mars-avril 2022. Tout ce qui prolonge cet écart est une estimation, et la page le dit.",
    ],
  },
  {
    titre: "Mesuré, contexte, analyse",
    textes: [
      "Mesuré : un chiffre publié, ou calculé à partir de sources citées. Contexte : un fait extérieur aux chiffres, avec sa source. Analyse : une interprétation. Elle peut être discutée et ne prouve rien.",
      "Le dernier mois affiché est le dernier mois commun aux deux territoires. Un mois publié d'un seul côté n'entre pas.",
    ],
  },
  {
    titre: "Le gazole",
    textes: [
      "Dans l'Hexagone, chaque station déclare son prix. La ligne bleue est la médiane ; la bande claire couvre huit stations sur dix ; les petites barres, la moitié centrale.",
      "En Martinique, le préfet fixe un prix maximal par arrêté, le même dans tout le département. C'est la ligne rouge. Ce n'est pas le prix payé pompe par pompe.",
    ],
  },
  {
    titre: "La page",
    textes: [
      "Le rouge est la Martinique, le bleu est l'Hexagone. Une barre pleine est mesurée. Une barre hachurée est estimée.",
      "Panye veut dire panier, en créole martiniquais. Le bandeau est une vidéo muette, en boucle, passée en noir et blanc.",
    ],
  },
];

function paragraphe(texte: string): HTMLParagraphElement {
  const p = document.createElement("p");
  p.textContent = texte;
  return p;
}

function afficher(): void {
  const racine = document.querySelector<HTMLElement>("#app");
  if (!racine) throw new Error("Conteneur #app absent.");
  racine.replaceChildren();
  const page = document.createElement("article");
  page.className = "page-techos";
  const titre = document.createElement("h1");
  titre.textContent = "Pour les techos";
  page.append(titre);
  for (const bloc of PARAGRAPHES) {
    const inter = document.createElement("h2");
    inter.textContent = bloc.titre;
    page.append(inter);
    for (const texte of bloc.textes) page.append(paragraphe(texte));
  }
  const retour = document.createElement("a");
  retour.className = "retour";
  retour.href = "/#reponse";
  retour.textContent = "Retour aux prix";
  page.append(retour);
  racine.append(creerEntete(), page);
  document.title = "Panye — Pour les techos";
}

try {
  afficher();
} catch (erreur: unknown) {
  const message = erreur instanceof Error ? erreur.message : "La page n'a pas pu s'afficher.";
  const racine = document.querySelector<HTMLElement>("#app");
  if (racine) racine.textContent = message;
  throw erreur;
}
