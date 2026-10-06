/**
 * En-tête commun : nom, drapeau, panier, sections toujours visibles.
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
  const panier = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  panier.setAttribute("class", "logo-panier");
  panier.setAttribute("viewBox", "0 0 24 24");
  panier.setAttribute("aria-hidden", "true");
  panier.innerHTML = `<path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M8.2 9.4V7.6a3.8 3.8 0 0 1 7.6 0v1.8"/><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" d="M4.4 9.6h15.2l-1.5 9.4H5.9L4.4 9.6z"/><path fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" d="M8.6 9.8v8.2M12 9.8v8.2M15.4 9.8v8.2"/>`;
  const mot = document.createElement("span");
  mot.className = "nom-mot";
  mot.textContent = "Panye";
  nom.append(drapeau, panier, mot);
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
