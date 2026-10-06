/**
 * Cycle de vie de l'écran — pur, sans DOM ni réseau.
 *
 * Ce qui a été branché en dehors du DOM (observateurs, frames en attente)
 * doit être débranché avant le rendu suivant, sinon il survit à un arbre
 * détaché et fuit.
 */

export type Nettoyage = () => void;

export interface RegistreNettoyage {
  enregistrer: (nettoyage: Nettoyage) => void;
  nettoyer: () => void;
  /** Nombre de nettoyages en attente — sert aux tests de non-fuite. */
  enAttente: () => number;
}

/**
 * Crée un registre. `nettoyer` exécute tout, vide la liste, et n'abandonne pas
 * au premier nettoyage qui échoue : un débranchement raté ne doit pas empêcher
 * les suivants.
 */
export function creerRegistreNettoyage(): RegistreNettoyage {
  let nettoyages: Nettoyage[] = [];

  return {
    enregistrer: (nettoyage: Nettoyage) => {
      nettoyages.push(nettoyage);
    },
    nettoyer: () => {
      const aExecuter = nettoyages;
      nettoyages = [];
      for (const nettoyage of aExecuter) {
        try {
          nettoyage();
        } catch {
          // Un nettoyage ne doit jamais bloquer les autres ni le rendu suivant.
        }
      }
    },
    enAttente: () => nettoyages.length,
  };
}
