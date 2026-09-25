import "./style.css";
import { chargerDonnees } from "./chargement.ts";
import { calculerResume, titreDuPoste } from "./calculs.ts";
import {
  afficherChargement,
  afficherErreur,
  afficherEcran,
  nettoyerEcranCourant,
  type OptionsEcran,
} from "./rendu.ts";
import type { ResumeEcran } from "./calculs.ts";
import type { CodePoste, LigneDifferentiel } from "./types.ts";
import { identifiantBoutonPoste } from "./cycle-ecran.ts";
import { chargerDonneesCarburants } from "./chargement-carburants.ts";
import {
  afficherChargementCarburants,
  afficherErreurCarburants,
  afficherEcranCarburants,
  nettoyerEcranCarburantsCourant,
  type OptionsEcranCarburants,
} from "./rendu-carburants.ts";
import {
  listerCarburantsComparables,
  titreCarburants,
} from "./calculs-carburants.ts";
import type { LigneCarburant } from "./types-carburants.ts";

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

function creerSelecteurVue(
  vue: VueApplication,
  onChanger: (vue: VueApplication) => void,
): HTMLElement {
  const section = document.createElement("nav");
  section.className = "selecteur-vue";
  section.setAttribute("aria-label", "Choisir la vue");

  for (const [id, label] of [
    ["ipc", "Indices de prix (IPC)"],
    ["carburants", "Carburants"],
  ] as const) {
    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.className = "selecteur-vue-bouton";
    bouton.id = `bouton-vue-${id}`;
    bouton.setAttribute("aria-pressed", vue === id ? "true" : "false");
    bouton.textContent = label;
    bouton.addEventListener("click", () => {
      if (id !== vue) onChanger(id);
    });
    section.appendChild(bouton);
  }

  return section;
}

/** Point d'entrée navigateur avec choix IPC / Carburants. */
export async function demarrerApplication(
  conteneur: HTMLElement,
  options: OptionsDemarrage = {},
): Promise<void> {
  conteneur.innerHTML = "";
  let vue: VueApplication = options.vueInitiale ?? "ipc";

  const zoneContenu = document.createElement("div");
  zoneContenu.className = "zone-contenu";
  conteneur.appendChild(zoneContenu);

  const selecteur = creerSelecteurVue(vue, (suivant) => {
    vue = suivant;
    for (const bouton of selecteur.querySelectorAll("button")) {
      const id = bouton.id.replace("bouton-vue-", "") as VueApplication;
      bouton.setAttribute("aria-pressed", id === vue ? "true" : "false");
    }
    void chargerEtAfficher();
  });
  conteneur.insertBefore(selecteur, zoneContenu);

  const chargerEtAfficher = async (): Promise<void> => {
    nettoyerEcranCourant();
    nettoyerEcranCarburantsCourant();

    if (vue === "ipc") {
      await demarrer(zoneContenu, options);
    } else {
      afficherChargementCarburants(zoneContenu);
      try {
        const lignes = await (options.chargerCarburants ?? chargerDonneesCarburants)();
        const carburants = listerCarburantsComparables(lignes);
        let carburant = carburants[0];
        const afficher = options.afficherCarburants ?? afficherEcranCarburants;
        const titrer = options.titrer ?? definirTitre;

        const redessiner = (): void => {
          afficher(zoneContenu, lignes, {
            carburantSelectionne: carburant,
            onChangerCarburant: (suivant) => {
              carburant = suivant;
              redessiner();
            },
          });
          titrer(titreCarburants(carburant));
        };

        redessiner();
      } catch (erreur: unknown) {
        afficherErreurCarburants(zoneContenu, erreur);
      }
    }
  };

  await chargerEtAfficher();
}

function lancerSiNavigateur(): void {
  if (typeof document === "undefined") return;
  const app = document.querySelector<HTMLElement>("#app");
  if (app) void demarrerApplication(app);
}

lancerSiNavigateur();
