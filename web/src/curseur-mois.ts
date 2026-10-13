/**
 * Curseur des mois du graphique des carburants : une seule commande au clavier
 * (flèches, début, fin) à la place d'une rangée de petits boutons, trop étroits
 * pour être touchés. L'infobulle suit le mois choisi, au curseur ou à la souris.
 */

/** Indice du mois sous la position `x` (en pixels depuis le bord gauche). */
export function indexDepuisPosition(x: number, largeur: number, total: number): number {
  if (total <= 0) throw new Error("Aucun mois à parcourir.");
  if (largeur <= 0) return total - 1;
  const rang = Math.floor((x / largeur) * total);
  return Math.min(total - 1, Math.max(0, rang));
}

export function creerCurseurMois(textes: string[]): HTMLElement {
  if (textes.length === 0) throw new Error("Aucun mois à parcourir.");
  const conteneur = document.createElement("div");
  conteneur.className = "mois-clavier";

  const infobulle = document.createElement("span");
  infobulle.className = "infobulle";
  infobulle.setAttribute("aria-hidden", "true");

  const curseur = document.createElement("input");
  curseur.type = "range";
  curseur.className = "mois-curseur";
  curseur.min = "0";
  curseur.max = String(textes.length - 1);
  curseur.step = "1";
  curseur.value = String(textes.length - 1);
  curseur.setAttribute("aria-label", "Mois du graphique");

  const afficher = (index: number): void => {
    const texte = textes[index] ?? "";
    infobulle.textContent = texte;
    curseur.setAttribute("aria-valuetext", texte.replaceAll("\n", ", "));
  };
  const activer = (actif: boolean): void => {
    if (actif) conteneur.dataset.actif = "";
    else delete conteneur.dataset.actif;
  };

  afficher(textes.length - 1);
  curseur.addEventListener("input", () => {
    afficher(Number(curseur.value));
    activer(true);
  });
  curseur.addEventListener("focus", () => activer(true));
  curseur.addEventListener("blur", () => activer(false));
  curseur.addEventListener("pointermove", (evenement) => {
    const boite = curseur.getBoundingClientRect();
    const index = indexDepuisPosition(
      evenement.clientX - boite.left,
      boite.width,
      textes.length,
    );
    curseur.value = String(index);
    afficher(index);
    activer(true);
  });
  curseur.addEventListener("pointerleave", () => {
    if (document.activeElement !== curseur) activer(false);
  });

  conteneur.append(infobulle, curseur);
  return conteneur;
}
