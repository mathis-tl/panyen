/**
 * Planifie un redessin hors du callback ResizeObserver.
 * Les signalements rapprochés sont fusionnés en un seul frame.
 */

export type PlanificateurRedessin = {
  signaler: () => void;
  annuler: () => void;
};

/** Crée un planificateur qui coalesce les signalements via un frame injectable. */
export function creerPlanificateurRedessin(
  redessiner: () => void,
  programmerFrame: (cb: () => void) => number,
  annulerFrame: (id: number) => void,
): PlanificateurRedessin {
  let frameEnAttente: number | null = null;

  return {
    signaler: () => {
      if (frameEnAttente !== null) return;
      frameEnAttente = programmerFrame(() => {
        frameEnAttente = null;
        redessiner();
      });
    },
    annuler: () => {
      if (frameEnAttente === null) return;
      annulerFrame(frameEnAttente);
      frameEnAttente = null;
    },
  };
}
