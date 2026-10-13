/**
 * Observable Plot pose `aria-label="rule"` ou `"line"` sur des groupes `<g>` sans
 * rôle : attribut interdit par ARIA, et bruit pour un lecteur d'écran. Le nom du
 * graphique vient du résumé `sr-only` du cadre.
 */
export interface NoeudEtiquete {
  hasAttribute(nom: string): boolean;
  removeAttribute(nom: string): void;
}

export function retirerEtiquettesDecoratives(racine: {
  querySelectorAll(selecteur: string): Iterable<NoeudEtiquete>;
}): void {
  for (const groupe of racine.querySelectorAll("g[aria-label]")) {
    if (!groupe.hasAttribute("role")) groupe.removeAttribute("aria-label");
  }
}
