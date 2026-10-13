import { chargerDonnees } from "./chargement.ts";
import { afficherChargement, afficherErreur } from "./rendu.ts";
import type { LigneDifferentiel } from "./types.ts";
import { chargerDonneesCarburants } from "./chargement-carburants.ts";
import type { LigneCarburant } from "./types-carburants.ts";
import { chargerContexte, type ContexteCharge } from "./chargement-contexte.ts";
import { afficherPage } from "./page.ts";

export interface OptionsDemarrage {
  charger?: () => Promise<LigneDifferentiel[]>;
  chargerCarburants?: () => Promise<LigneCarburant[]>;
  chargerContexte?: () => Promise<ContexteCharge>;
}

/** Charge les données et affiche la page : une page, tous les écrans. */
export async function demarrerApplication(
  conteneur: HTMLElement,
  options: OptionsDemarrage = {},
): Promise<void> {
  if (!conteneur.querySelector?.(".coque")) afficherChargement(conteneur);
  try {
    const [ipc, carburants, contexte] = await Promise.all([
      (options.charger ?? chargerDonnees)(),
      (options.chargerCarburants ?? chargerDonneesCarburants)(),
      (options.chargerContexte ?? chargerContexte)(),
    ]);
    afficherPage(conteneur, { ipc, carburants, ...contexte });
  } catch (erreur: unknown) {
    afficherErreur(conteneur, erreur);
  }
}
