/**
 * Page « Pour les techos » : comment le site est fait, de la collecte Insee au
 * dessin, avec le calcul de l'écart estimé et les contrôles qui le gardent.
 * Les valeurs de l'exemple chiffré sont lues dans le Parquet publié (août 2026).
 */
import "./polices.css";
import "./style.css";
import { creerEntete } from "./entete.ts";
import { creerBlocQualite } from "./qualite.ts";
import { type BlocTechos, SECTIONS_TECHOS, texteVisibleTechos } from "./contenu-techos.ts";

export { SECTIONS_TECHOS, texteVisibleTechos };

function creer<K extends keyof HTMLElementTagNameMap>(
  balise: K,
  classe = "",
  texte?: string,
): HTMLElementTagNameMap[K] {
  const noeud = document.createElement(balise);
  if (classe) noeud.className = classe;
  if (texte !== undefined) noeud.textContent = texte;
  return noeud;
}

function afficherBloc(bloc: BlocTechos): HTMLElement {
  if (bloc.type === "texte") return creer("p", "", bloc.texte);
  if (bloc.type === "formule") {
    const pre = creer("pre", "formule");
    pre.append(creer("code", "", bloc.lignes.join("\n")));
    return pre;
  }
  if (bloc.type === "liste") {
    const liste = creer("ul", "liste-techos");
    for (const item of bloc.items) liste.append(creer("li", "", item));
    return liste;
  }
  const etapes = creer("ol", "etapes");
  for (const etape of bloc.items) {
    const li = creer("li", "etape");
    li.append(
      creer("h3", "etape-titre", etape.titre),
      creer("p", "etape-outil", etape.outil),
      creer("p", "", etape.texte),
    );
    etapes.append(li);
  }
  return etapes;
}

function afficher(): void {
  const racine = document.querySelector<HTMLElement>("#app");
  if (!racine) throw new Error("Conteneur #app absent.");
  racine.replaceChildren();
  const page = creer("main", "page-techos");
  page.append(creer("h1", "", "Pour les techos"));
  for (const section of SECTIONS_TECHOS) {
    const inter = creer("h2", "", section.titre);
    inter.id = section.id;
    page.append(inter);
    for (const bloc of section.blocs) page.append(afficherBloc(bloc));
  }
  const retour = creer("a", "retour", "Retour aux prix");
  retour.href = "/#reponse";
  page.append(retour);
  racine.append(creerEntete(), page, creerPiedTechos());
  document.title = "Panye — Pour les techos";
}

function creerPiedTechos(): HTMLElement {
  const pied = creer("footer", "pied");
  pied.append(creerBlocQualite());
  return pied;
}

try {
  afficher();
} catch (erreur: unknown) {
  const message = erreur instanceof Error ? erreur.message : "La page n'a pas pu s'afficher.";
  const racine = document.querySelector<HTMLElement>("#app");
  if (racine) racine.textContent = message;
  throw erreur;
}
