import "./style.css";
import { chargerDonnees } from "./chargement.ts";
import { calculerResume } from "./calculs.ts";
import { afficherChargement, afficherErreur, afficherEcran } from "./rendu.ts";
import type { LigneDifferentiel } from "./types.ts";

export interface OptionsDemarrage {
  charger?: () => Promise<LigneDifferentiel[]>;
}

/** Point d'entrée testable : injection possible du chargeur. */
export async function demarrer(
  conteneur: HTMLElement,
  options: OptionsDemarrage = {},
): Promise<void> {
  afficherChargement(conteneur);
  try {
    const lignes = await (options.charger ?? chargerDonnees)();
    afficherEcran(conteneur, calculerResume(lignes));
  } catch (erreur: unknown) {
    afficherErreur(conteneur, erreur);
  }
}

function lancerSiNavigateur(): void {
  if (typeof document === "undefined") return;
  const app = document.querySelector<HTMLElement>("#app");
  if (app) void demarrer(app);
}

lancerSiNavigateur();
