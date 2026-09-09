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

export interface OptionsDemarrage {
  charger?: () => Promise<LigneDifferentiel[]>;
  posteInitial?: CodePoste;
  /** Injecté par les tests ; par défaut, focus DOM sur le bouton du poste. */
  focaliserPoste?: (poste: CodePoste) => void;
  /** Injecté par les tests ; par défaut, écrit document.title. */
  titrer?: (titre: string) => void;
  /** Injecté par les tests ; par défaut, le rendu DOM réel. */
  afficher?: (
    conteneur: HTMLElement,
    resume: ResumeEcran,
    options: OptionsEcran,
  ) => void;
}

/**
 * Le changement de poste reconstruit l'écran : le bouton cliqué est détruit.
 * Sans cette restauration, le focus retombe sur le body et l'utilisateur au
 * clavier doit retabuler depuis le haut de page.
 */
function focaliserBoutonPoste(poste: CodePoste): void {
  if (typeof document === "undefined") return;
  document.getElementById(identifiantBoutonPoste(poste))?.focus();
}

/** Le titre d'onglet doit suivre le poste, sinon il décrit une autre page. */
function definirTitre(titre: string): void {
  if (typeof document === "undefined") return;
  document.title = titre;
}

/** Point d'entrée testable : injection possible du chargeur, du rendu et du focus. */
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
      // Au premier rendu personne n'a encore le focus : ne pas le voler.
      if (rendreLeFocus) focaliser(poste);
    };

    redessiner(false);
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
