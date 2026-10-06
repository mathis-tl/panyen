/**
 * Rendu DOM — écran carburants.
 */
import {
  calculerResumeCarburants,
  formaterEurosLitre,
  type ResumeCarburants,
} from "./calculs-carburants.ts";
import {
  calculerDispositionGrapheCarburants,
  grapheCarburants,
} from "./graphe-carburants.ts";
import type { LigneCarburant } from "./types-carburants.ts";
import { listerCarburantsComparables } from "./calculs-carburants.ts";
import { creerPlanificateurRedessin } from "./planifier-redessin.ts";
import { creerRegistreNettoyage } from "./cycle-ecran.ts";
import { formaterMoisUtc } from "./validation-carburants.ts";
import { contenuErreur } from "./rendu.ts";

const registreEcran = creerRegistreNettoyage();

export function nettoyerEcranCarburantsCourant(): void {
  registreEcran.nettoyer();
}

export interface OptionsEcranCarburants {
  carburantSelectionne: string;
  onChangerCarburant: (carburant: string) => void;
}

export function afficherChargementCarburants(conteneur: HTMLElement): void {
  nettoyerEcranCarburantsCourant();
  conteneur.innerHTML = `<div class="squelette" role="status"><p class="sr-only">Chargement des données carburants.</p><div class="squelette-bloc squelette-titre"></div><div class="squelette-bloc squelette-ligne"></div></div>`;
}

export function afficherErreurCarburants(
  conteneur: HTMLElement,
  erreur: unknown,
): void {
  nettoyerEcranCarburantsCourant();
  conteneur.innerHTML = contenuErreur(erreur);
}

export function afficherEcranCarburants(
  conteneur: HTMLElement,
  lignes: LigneCarburant[],
  options: OptionsEcranCarburants,
): void {
  nettoyerEcranCarburantsCourant();
  conteneur.innerHTML = "";

  const carburants = listerCarburantsComparables(lignes);
  const resume = calculerResumeCarburants(lignes, options.carburantSelectionne);

  conteneur.appendChild(
    creerSelecteurCarburant(
      carburants,
      options.carburantSelectionne,
      options.onChangerCarburant,
    ),
  );
  conteneur.appendChild(creerReponse(resume));
  conteneur.appendChild(creerGraphe(resume));
  conteneur.appendChild(creerLegende());
  if (resume.dernierMoisIncomplet) {
    conteneur.appendChild(creerNoteMoisIncomplet(resume));
  }
  conteneur.appendChild(creerProduitsNonComparables(resume));
  conteneur.appendChild(creerExplication());
  conteneur.appendChild(creerProvenance(resume));
}

function creerElement(tag: string, className: string): HTMLElement {
  const el = document.createElement(tag);
  el.className = className;
  return el;
}

function echapperTexte(texte: string): string {
  return texte
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function creerSelecteurCarburant(
  carburants: string[],
  selectionne: string,
  onChanger: (carburant: string) => void,
): HTMLElement {
  const section = creerElement("section", "selecteur-carburant");
  const titre = document.createElement("h2");
  titre.id = "titre-selecteur-carburant";
  titre.textContent = "Produit comparable";
  section.appendChild(titre);

  const groupe = document.createElement("div");
  groupe.className = "selecteur-poste-groupe";
  groupe.setAttribute("role", "group");
  groupe.setAttribute("aria-labelledby", "titre-selecteur-carburant");

  for (const carburant of carburants) {
    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.className = "selecteur-poste-bouton";
    bouton.id = `bouton-carburant-${carburant}`;
    bouton.setAttribute(
      "aria-pressed",
      carburant === selectionne ? "true" : "false",
    );
    bouton.textContent = carburant;
    bouton.addEventListener("click", () => {
      if (carburant !== selectionne) onChanger(carburant);
    });
    groupe.appendChild(bouton);
  }

  section.appendChild(groupe);
  return section;
}

function creerReponse(resume: ResumeCarburants): HTMLElement {
  const section = creerElement("section", "reponse");
  section.innerHTML = `<h1>${echapperTexte(resume.phrase)}</h1>`;
  return section;
}

function creerGraphe(resume: ResumeCarburants): HTMLElement {
  const section = creerElement("section", "graphe-principal graphe-carburants");
  const titre = document.createElement("h2");
  titre.textContent = "Distribution des stations de l'Hexagone et plafond martiniquais";
  section.appendChild(titre);

  const conteneur = document.createElement("div");
  conteneur.className = "graphe-conteneur";
  section.appendChild(conteneur);

  const dessiner = (): void => {
    const largeur = conteneur.clientWidth;
    if (largeur <= 0) return;
    const disposition = calculerDispositionGrapheCarburants(largeur);
    conteneur.replaceChildren(grapheCarburants(resume, disposition));
  };

  const planificateur = creerPlanificateurRedessin(
    dessiner,
    (cb) => requestAnimationFrame(cb),
    (id) => cancelAnimationFrame(id),
  );

  const observer = new ResizeObserver(() => planificateur.signaler());
  observer.observe(conteneur);
  registreEcran.enregistrer(() => {
    observer.disconnect();
    planificateur.annuler();
  });
  planificateur.signaler();

  return section;
}

function creerLegende(): HTMLElement {
  const section = creerElement("section", "legende-carburants");
  section.innerHTML = `
    <ul class="legende-liste">
      <li><span class="legende-echantillon legende-ruban"></span> Ruban q10–q90 (stations de l'Hexagone déclarées)</li>
      <li><span class="legende-echantillon legende-iqr"></span> Repère q25–q75</li>
      <li><span class="legende-echantillon legende-mediane"></span> Médiane</li>
      <li><span class="legende-echantillon legende-plafond"></span> Plafond réglementaire Martinique (dates d'effet exactes)</li>
    </ul>`;
  return section;
}

function creerNoteMoisIncomplet(resume: ResumeCarburants): HTMLElement {
  const section = creerElement("section", "note-mois-incomplet");
  section.innerHTML = `
    <h2>Mois incomplet</h2>
    <p>Le mois de <strong>${formaterMoisUtc(resume.periodeFin)}</strong> n'est pas clos :
    les observations nationales disponibles ne couvrent pas un mois civil entier.
    Les quantiles affichés pour ce mois ne doivent pas être interprétés comme une
    distribution mensuelle complète.</p>`;
  return section;
}

function creerProduitsNonComparables(resume: ResumeCarburants): HTMLElement {
  const section = creerElement("section", "produits-non-comparables");
  const items = resume.produitsNonComparables
    .map(
      (p) =>
        `<li><strong>${echapperTexte(p.libelleMq)}</strong> — ${echapperTexte(p.raison)}</li>`,
    )
    .join("");
  section.innerHTML = `
    <h2>Produits non comparés</h2>
    <ul>${items}</ul>`;
  return section;
}

function creerExplication(): HTMLElement {
  const section = creerElement("section", "explication-carburants");
  section.innerHTML = `
    <h2>Deux régimes de prix</h2>
    <p>Le flux national couvre uniquement l'<strong>Hexagone</strong> :
    chaque point est le prix déclaré par une station, agrégé en distribution mensuelle.
    En Martinique, le prix affiché est un <strong>maximum réglementaire uniforme</strong>
    fixé par arrêté préfectoral — pas une moyenne ni une observation des prix
    effectivement payés sur l'île.</p>
    <p>Ce graphique ne dit pas si les automobilistes martiniquais paient plus ou
    moins que le plafond ; il situe la distribution des stations de l'Hexagone par rapport à
    la règle administrative martiniquaise.</p>`;
  return section;
}

function creerProvenance(resume: ResumeCarburants): HTMLElement {
  const dernierPlafond = resume.plafonds[resume.plafonds.length - 1];
  const section = creerElement("section", "provenance");
  const dernierDist = resume.distributions[resume.distributions.length - 1];
  section.innerHTML = `
    <h2>Provenance</h2>
    <ul>
      <li>Période : ${formaterMoisUtc(resume.periodeDebut)} → ${formaterMoisUtc(resume.periodeFin)}</li>
      <li>Stations de l'Hexagone (dernier mois) : ${dernierDist.nombreStations.toLocaleString("fr-FR")}</li>
      <li>Médiane des stations de l'Hexagone (dernier mois) : ${formaterEurosLitre(dernierDist.mediane)}</li>
      <li>Plafond martiniquais actuel : ${formaterEurosLitre(dernierPlafond.prixMax)} (${echapperTexte(dernierPlafond.referenceActe)})</li>
      <li>Collecte nationale : ${resume.collecteUtc.toISOString().slice(0, 10)}</li>
      <li><a href="${echapperTexte(dernierPlafond.urlSource)}" rel="noopener">Acte martiniquais de référence</a></li>
      <li><a href="https://www.prix-carburants.gouv.fr/rubrique/opendata/" rel="noopener">Source nationale (prix-carburants.gouv.fr)</a></li>
    </ul>`;
  return section;
}
