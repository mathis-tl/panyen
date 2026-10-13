/**
 * En-tête commun : nom, drapeau, sections toujours visibles.
 * Les ancres sont absolues pour fonctionner depuis /techos.html.
 */

export const NAVIGATION = [
  ["/#reponse", "La réponse"],
  ["/#ecart-2022", "L'écart en 2022"],
  ["/#evolutions", "Les prix depuis 2022"],
  ["/#carburants", "Le gazole"],
  ["/#pourquoi", "Ce qui coïncide"],
  ["/#recit", "Ce qu'on peut en dire"],
  ["/#methode", "Méthode et sources"],
  ["/techos.html", "Pour les techos"],
] as const;

const COULEURS_NAV = [
  "nav-rouge",
  "nav-rouge",
  "nav-rouge",
  "nav-vert",
  "nav-vert",
  "nav-vert",
  "nav-noir",
  "nav-noir",
] as const;

export function creerEntete(): HTMLElement {
  const header = document.createElement("header");
  header.className = "entete";
  const nom = document.createElement("a");
  nom.className = "nom";
  nom.href = "/#reponse";
  const drapeau = document.createElement("img");
  drapeau.className = "drapeau";
  drapeau.src = "/drapeau-martinique.svg";
  drapeau.alt = "Drapeau de la Martinique";
  drapeau.width = 900;
  drapeau.height = 600;
  const mot = document.createElement("span");
  mot.className = "nom-mot";
  mot.textContent = "Panye";
  nom.append(drapeau, mot);
  const nav = document.createElement("nav");
  nav.className = "nav-ecrans";
  nav.id = "nav-sections";
  nav.setAttribute("aria-label", "Sections");
  if (COULEURS_NAV.length !== NAVIGATION.length) {
    throw new Error("Chaque section doit avoir une couleur du drapeau.");
  }
  NAVIGATION.forEach(([href, libelle], index) => {
    const lien = document.createElement("a");
    lien.className = `nav-lien ${COULEURS_NAV[index]}`;
    lien.href = href;
    lien.textContent = libelle;
    nav.append(lien);
  });
  header.append(nom, nav);
  return header;
}
