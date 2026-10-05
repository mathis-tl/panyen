import "@fontsource/schibsted-grotesk/600.css";
import "@fontsource/schibsted-grotesk/700.css";
import "@fontsource/atkinson-hyperlegible-next/400.css";
import "@fontsource/atkinson-hyperlegible-next/700.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./style.css";
import { chargerDonnees } from "./chargement.ts";
import { calculerResume, titreDuPoste } from "./calculs.ts";
import {
  afficherChargement,
  afficherErreur,
  afficherEcran,
  type OptionsEcran,
} from "./rendu.ts";
import type { ResumeEcran } from "./calculs.ts";
import type { CodePoste, LigneDifferentiel } from "./types.ts";
import { identifiantBoutonPoste } from "./cycle-ecran.ts";
import { chargerDonneesCarburants } from "./chargement-carburants.ts";
import { type OptionsEcranCarburants } from "./rendu-carburants.ts";
import type { LigneCarburant } from "./types-carburants.ts";
import { chargerContexte } from "./chargement-contexte.ts";
import { afficherPage } from "./page.ts";

export type VueApplication = "ipc" | "carburants";

export interface OptionsDemarrage {
  charger?: () => Promise<LigneDifferentiel[]>;
  posteInitial?: CodePoste;
  vueInitiale?: VueApplication;
  chargerCarburants?: () => Promise<LigneCarburant[]>;
  focaliserPoste?: (poste: CodePoste) => void;
  titrer?: (titre: string) => void;
  afficher?: (
    conteneur: HTMLElement,
    resume: ResumeEcran,
    options: OptionsEcran,
  ) => void;
  afficherCarburants?: (
    conteneur: HTMLElement,
    lignes: LigneCarburant[],
    options: OptionsEcranCarburants,
  ) => void;
}

function focaliserBoutonPoste(poste: CodePoste): void {
  if (typeof document === "undefined") return;
  document.getElementById(identifiantBoutonPoste(poste))?.focus();
}

function definirTitre(titre: string): void {
  if (typeof document === "undefined") return;
  document.title = titre;
}

/** Point d'entrée IPC — inchangé pour les tests et le rendu direct. */
export async function demarrer(
  conteneur: HTMLElement,
  options: OptionsDemarrage = {},
): Promise<void> {
  afficherChargement(conteneur);
  try {
    const lignes = await (options.charger ?? chargerDonnees)();
    let poste: CodePoste = options.posteInitial ?? "alimentation";
    const focaliser = options.focaliserPoste ?? focaliserBoutonPoste;
    const afficher = options.afficher ?? afficherEcran;
    const titrer = options.titrer ?? definirTitre;

    const redessiner = (rendreLeFocus: boolean): void => {
      const resume = calculerResume(lignes, poste);
      afficher(conteneur, resume, {
        posteSelectionne: poste,
        onChangerPoste: (suivant) => {
          poste = suivant;
          redessiner(true);
        },
      });
      titrer(titreDuPoste(poste, resume.ancreEcspDisponible));
      if (rendreLeFocus) focaliser(poste);
    };

    redessiner(false);
  } catch (erreur: unknown) {
    afficherErreur(conteneur, erreur);
  }
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
      chargerContexte(),
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
