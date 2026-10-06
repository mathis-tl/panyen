import "./polices.css";
import "./style.css";
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

/** Point d'entrée navigateur : une page, tous les écrans. */
export async function demarrerApplication(
  conteneur: HTMLElement,
  options: OptionsDemarrage = {},
): Promise<void> {
  afficherChargement(conteneur);
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

function lancerSiNavigateur(): void {
  if (typeof document === "undefined") return;
  const app = document.querySelector<HTMLElement>("#app");
  if (app) void demarrerApplication(app);
}

lancerSiNavigateur();
