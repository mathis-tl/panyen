/**
 * États de chargement et d'erreur. La page elle-même est dans page.ts.
 */
import { creerRegistreNettoyage } from "./cycle-ecran.ts";

/**
 * Nettoyages de l'écran actuellement monté. Tout rendu remplace l'écran
 * précédent : il le débranche d'abord.
 */
const registreEcran = creerRegistreNettoyage();

/** Débranche l'écran monté. */
export function nettoyerEcranCourant(): void {
  registreEcran.nettoyer();
}

function squelette(annonce: string): string {
  return `
    <div class="squelette" role="status" aria-live="polite">
      <p class="sr-only">${annonce}</p>
      <div class="squelette-bloc squelette-titre"></div>
      <div class="squelette-bloc squelette-ligne"></div>
      <div class="squelette-bloc squelette-barre"></div>
      <div class="squelette-bloc squelette-barre court"></div>
    </div>`;
}

/** Affiche l'état de chargement. */
export function afficherChargement(conteneur: HTMLElement): void {
  nettoyerEcranCourant();
  conteneur.innerHTML = squelette("Chargement des données.");
}

function echapperTexte(texte: string): string {
  return texte
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** HTML d'erreur — testable sans DOM. */
export function contenuErreur(erreur: unknown): string {
  const message = erreur instanceof Error ? erreur.message : String(erreur);
  return `
    <div class="erreur" role="alert">
      <h1>Données indisponibles</h1>
      <p>${echapperTexte(message)}</p>
      <p class="erreur-aide">La page n'affiche pas de données tant que la source
      n'est pas saine. Vérifiez que <code>make publier</code> a été exécuté.</p>
    </div>`;
}

/** Affiche l'état d'erreur — aucun rendu partiel, aucune donnée de repli. */
export function afficherErreur(conteneur: HTMLElement, erreur: unknown): void {
  nettoyerEcranCourant();
  conteneur.innerHTML = contenuErreur(erreur);
}
