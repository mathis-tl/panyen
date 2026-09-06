/**
 * Rendu DOM — récit par poste, sélecteur sans requête réseau.
 */
import {
  formaterEuros,
  formaterPct,
  formaterPointsSignes,
  type ResumeEcran,
} from "./calculs.ts";
import type { CodePoste, LigneDifferentiel } from "./types.ts";
import { POSTES_ATTENDUS } from "./types.ts";
import { grapheEvolutions } from "./graphe.ts";
import { creerPlanificateurRedessin } from "./planifier-redessin.ts";
import { creerRegistreNettoyage, identifiantBoutonPoste } from "./cycle-ecran.ts";
import { formaterMoisUtc } from "./validation.ts";

const LIBELLES_SELECTEUR: Record<CodePoste, string> = {
  alimentation: "Alimentation",
  energie: "Énergie",
  produits_manufactures: "Produits manufacturés",
  services: "Services",
};

/**
 * Nettoyages de l'écran actuellement monté. Tout rendu remplace l'écran
 * précédent : il le débranche d'abord.
 */
const registreEcran = creerRegistreNettoyage();

/** Débranche l'écran monté. Exporté pour que les tests constatent l'absence de fuite. */
export function nettoyerEcranCourant(): void {
  registreEcran.nettoyer();
}

/** Nettoyages encore en attente — sonde de test, jamais utilisée par le rendu. */
export function nettoyagesEnAttente(): number {
  return registreEcran.enAttente();
}

/** Affiche l'état de chargement. */
export function afficherChargement(conteneur: HTMLElement): void {
  nettoyerEcranCourant();
  conteneur.innerHTML = `<p class="chargement">Chargement des données…</p>`;
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

export interface OptionsEcran {
  posteSelectionne: CodePoste;
  onChangerPoste: (poste: CodePoste) => void;
}

/** Affiche l'écran principal pour un résumé déjà calculé. */
export function afficherEcran(
  conteneur: HTMLElement,
  resume: ResumeEcran,
  options: OptionsEcran,
): void {
  nettoyerEcranCourant();
  conteneur.innerHTML = "";
  conteneur.appendChild(
    creerSelecteurPoste(options.posteSelectionne, options.onChangerPoste),
  );
  conteneur.appendChild(creerReponse(resume));
  if (resume.ancreEcspDisponible && resume.ancre && resume.panierAncre) {
    conteneur.appendChild(creerAncre(resume));
  } else if (resume.noteSansAncre) {
    conteneur.appendChild(creerNoteSansAncre(resume.noteSansAncre));
  }
  conteneur.appendChild(creerGraphe(resume));
  if (resume.ancreEcspDisponible) {
    conteneur.appendChild(creerJalons(resume));
  } else {
    conteneur.appendChild(creerJalonsEvolution(resume));
  }
  conteneur.appendChild(creerExplication(resume));
  conteneur.appendChild(creerLimiteMethodologique());
  conteneur.appendChild(creerProvenance(resume));
}

function creerSelecteurPoste(
  posteSelectionne: CodePoste,
  onChangerPoste: (poste: CodePoste) => void,
): HTMLElement {
  const section = creerElement("section", "selecteur-poste");
  const titre = document.createElement("h2");
  titre.id = "titre-selecteur-poste";
  titre.textContent = "Poste de dépense";
  section.appendChild(titre);

  // Pas de role="tablist" : le contenu en dessous est reconstruit en entier,
  // ce n'est pas un tabpanel, et annoncer « onglet » sans navigation aux
  // flèches promettrait une interaction qui n'existe pas. Des boutons natifs
  // sont focusables et activables par défaut ; aria-pressed dit l'état.
  const groupe = document.createElement("div");
  groupe.className = "selecteur-poste-groupe";
  groupe.setAttribute("role", "group");
  groupe.setAttribute("aria-labelledby", "titre-selecteur-poste");

  for (const poste of POSTES_ATTENDUS) {
    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.className = "selecteur-poste-bouton";
    bouton.id = identifiantBoutonPoste(poste);
    bouton.setAttribute(
      "aria-pressed",
      poste === posteSelectionne ? "true" : "false",
    );
    bouton.textContent = LIBELLES_SELECTEUR[poste];
    bouton.addEventListener("click", () => {
      if (poste !== posteSelectionne) {
        onChangerPoste(poste);
      }
    });
    groupe.appendChild(bouton);
  }

  section.appendChild(groupe);
  return section;
}

function creerReponse(resume: ResumeEcran): HTMLElement {
  const section = creerElement("section", "reponse");
  section.innerHTML = `<h1>${echapperTexte(resume.phrase)}</h1>`;
  return section;
}

function creerNoteSansAncre(note: string): HTMLElement {
  const section = creerElement("section", "note-sans-ancre");
  section.innerHTML = `
    <h2>Pas d'écart de niveau pour ce poste</h2>
    <p>${echapperTexte(note)}</p>`;
  return section;
}

function creerAncre(resume: ResumeEcran): HTMLElement {
  const ancre = resume.ancre!;
  const panierAncre = resume.panierAncre!;
  const section = creerElement("section", "ancre");
  section.innerHTML = `
    <h2>Point de départ — mesure ECSP mars-avril 2022</h2>
    <p>En mars-avril 2022, l'enquête de comparaison spatiale de l'Insee a
    <strong>mesuré</strong> un écart alimentaire d'environ
    <strong>${formaterPct(ancre.ecart_ecsp_2022_pct as number)} %</strong>
    entre la Martinique et la France métropolitaine.</p>
    <p>Si un panier comparable coûtait
    <strong>${formaterEuros(panierAncre.metropole)}</strong> en métropole
    en avril 2022, l'écart ECSP correspondrait, de façon simplifiée, à
    <strong>${formaterEuros(panierAncre.martinique)}</strong> en Martinique.</p>
    <p class="mention-illustration">Illustration mécanique à partir des indices
    et de l'ECSP, pas prix d'un panier réellement relevé en magasin.</p>`;
  return section;
}

function creerGraphe(resume: ResumeEcran): HTMLElement {
  const section = creerElement("section", "graphe-principal");
  const titre = document.createElement("h2");
  titre.textContent =
    `Évolution cumulée des prix (${resume.libellePoste.toLowerCase()}) depuis avril 2022`;
  section.appendChild(titre);

  const sousTitre = document.createElement("p");
  sousTitre.className = "graphe-sous-titre";
  sousTitre.textContent =
    `${resume.seriesEvolution.premierMois} → ${resume.seriesEvolution.dernierMois}` +
    " · deux évolutions intra-territoire, pas des niveaux d'indice";
  section.appendChild(sousTitre);

  const intro = document.createElement("p");
  intro.textContent =
    `Chaque courbe est une évolution cumulée des prix (${resume.libellePoste.toLowerCase()}) ` +
    "depuis avril 2022, calculée à l'intérieur de son territoire. " +
    "Ce ne sont pas des niveaux d'indice comparés.";
  section.appendChild(intro);

  const cadre = document.createElement("div");
  cadre.className = "graphe-cadre";
  const montage = document.createElement("div");
  montage.className = "graphe-montage";
  cadre.appendChild(montage);
  section.appendChild(cadre);

  let largeurPrecedente = 0;
  const redessiner = (): void => {
    const largeur = Math.floor(montage.clientWidth);
    if (largeur <= 0 || largeur === largeurPrecedente) return;
    largeurPrecedente = largeur;
    montage.replaceChildren(grapheEvolutions(resume, largeur));
  };

  const planificateur = creerPlanificateurRedessin(
    redessiner,
    (cb) => requestAnimationFrame(cb),
    (id) => cancelAnimationFrame(id),
  );

  const observateur = new ResizeObserver(() => {
    planificateur.signaler();
  });
  observateur.observe(montage);
  planificateur.signaler();

  // Sans ce débranchement, chaque changement de poste laisserait un
  // observateur vivant sur un montage détaché, qui retient tout le graphe.
  registreEcran.enregistrer(() => {
    observateur.disconnect();
    planificateur.annuler();
  });

  return section;
}

function creerJalons(resume: ResumeEcran): HTMLElement {
  const section = creerElement("section", "jalons");
  section.innerHTML = `<h2>Trois moments à retenir</h2>`;
  section.appendChild(
    creerCarteJalon(
      "Minimum estimé",
      resume.minimumEstime!,
      resume.panierMinimum!,
      "estimation",
    ),
  );
  section.appendChild(
    creerCarteJalon(
      "Maximum estimé",
      resume.maximumEstime!,
      resume.panierMaximum!,
      "estimation",
    ),
  );
  section.appendChild(
    creerCarteJalon(
      "Dernier mois commun",
      resume.actuelle,
      resume.panierActuelle!,
      resume.actuelle.nature_ecart === "mesure_ecsp_2022" ? "mesure" : "estimation",
    ),
  );
  const note = document.createElement("p");
  note.className = "mention-illustration";
  note.textContent =
    "Illustration mécanique à partir des indices et de l'ECSP, pas prix d'un panier " +
    "réellement relevé en magasin. Un resserrement relatif peut coexister avec une " +
    "différence illustrative en euros plus grande qu'en 2022, parce que les deux paniers " +
    "ont augmenté.";
  section.appendChild(note);
  return section;
}

function creerJalonsEvolution(resume: ResumeEcran): HTMLElement {
  const section = creerElement("section", "jalons");
  section.innerHTML = `<h2>Trois moments du différentiel d'évolution</h2>`;
  section.appendChild(
    creerCarteDifferentiel("Minimum du différentiel", resume.extremumDifferentielMin),
  );
  section.appendChild(
    creerCarteDifferentiel("Maximum du différentiel", resume.extremumDifferentielMax),
  );
  section.appendChild(
    creerCarteDifferentiel("Dernier mois commun", resume.actuelle),
  );
  return section;
}

function creerCarteDifferentiel(
  titre: string,
  ligne: LigneDifferentiel,
): HTMLElement {
  const article = creerElement("article", "jalon jalon-estimation");
  article.innerHTML = `
    <h3>${echapperTexte(titre)} · ${echapperTexte(formaterMoisUtc(ligne.periode))}</h3>
    <p class="jalon-ecart">
      Différentiel d'évolution :
      <strong>${formaterPointsSignes(ligne.differentiel_evolution_points)} point</strong>
    </p>
    <p>Évolutions cumulées depuis avril 2022 :
      Martinique <strong>${formaterPct(ligne.evolution_martinique_pct)} %</strong>,
      France métropolitaine
      <strong>${formaterPct(ligne.evolution_france_metropolitaine_pct)} %</strong>.
    </p>`;
  return article;
}

function creerCarteJalon(
  titre: string,
  ligne: LigneDifferentiel,
  panier: { metropole: number; martinique: number },
  nature: "mesure" | "estimation",
): HTMLElement {
  const article = creerElement("article", `jalon jalon-${nature}`);
  const natureLibelle = nature === "mesure" ? "mesure" : "estimation";
  article.innerHTML = `
    <h3>${echapperTexte(titre)} · ${echapperTexte(formaterMoisUtc(ligne.periode))}</h3>
    <p class="jalon-ecart">
      Écart de prix :
      <strong>${formaterPct(ligne.ecart_prix_estime_pct as number)} %</strong>
      <span class="badge-${nature}">${natureLibelle}</span>
    </p>
    <p>Évolutions cumulées depuis avril 2022 :
      Martinique <strong>${formaterPct(ligne.evolution_martinique_pct)} %</strong>,
      France métropolitaine
      <strong>${formaterPct(ligne.evolution_france_metropolitaine_pct)} %</strong>
      (différentiel :
      <strong>${formaterPointsSignes(ligne.differentiel_evolution_points)} point</strong>).
    </p>
    <p>Panier illustratif :
      ${formaterEuros(panier.metropole)} en métropole /
      ${formaterEuros(panier.martinique)} en Martinique.</p>`;
  return article;
}

function creerExplication(resume: ResumeEcran): HTMLElement {
  const section = creerElement("section", "explication");
  const itemsAncre = resume.ancreEcspDisponible
    ? `
      <li><strong>Mesure</strong> : uniquement l'ECSP de mars-avril 2022.</li>
      <li><strong>Estimation</strong> : tout prolongement après l'ancre, obtenu
      en appliquant le rapport exact des facteurs d'évolution à la mesure ECSP.</li>
      <li><strong>Resserrement / creusement</strong> : décrivent l'écart relatif
      entre territoires, pas une différence absolue en euros par rapport à 2022.</li>`
    : `
      <li><strong>Évolution</strong> : variation des prix à l'intérieur d'un
      territoire depuis avril 2022.</li>
      <li><strong>Différentiel en points</strong> : différence des deux évolutions,
      jamais un écart de niveau de prix.</li>
      <li><strong>Pas d'ancre ECSP</strong> : ce poste IPC ne correspond pas à une
      fonction de consommation publiée par l'enquête 2022.</li>`;
  section.innerHTML = `
    <h2>Comment lire ces chiffres</h2>
    <p>${echapperTexte(resume.explicationPourcentageVsPoints)}</p>
    <ul>${itemsAncre}</ul>`;
  return section;
}

function creerLimiteMethodologique(): HTMLElement {
  const section = creerElement("section", "limite");
  section.innerHTML = `
    <h2>Limite méthodologique</h2>
    <p>Les indices des prix martiniquais et français sont chacun en base 100
    <strong>sur leur propre territoire</strong>. Leurs niveaux ne sont pas
    comparables ; seules leurs <em>évolutions</em> le sont.</p>
    <p>L'écart de niveau entre les deux territoires provient uniquement de
    l'enquête de comparaison spatiale (ECSP) de mars-avril 2022, et seulement
    pour l'alimentation. Son prolongement mois par mois, via le rapport des
    facteurs d'évolution, est une <strong>estimation</strong>, pas une mesure.
    Les 40 % concernent l'alimentation, pas l'ensemble du coût de la vie ni le
    pouvoir d'achat.</p>`;
  return section;
}

function creerProvenance(resume: ResumeEcran): HTMLElement {
  const derniere = resume.actuelle;
  const sourceEcsp =
    resume.ancre?.source_ecsp ??
    "Aucune ancre ECSP pour ce poste";
  const section = creerElement("section", "provenance");
  section.innerHTML = `
    <h2>Provenance</h2>
    <dl>
      <dt>Poste</dt>
      <dd>${echapperTexte(resume.libellePoste)}</dd>
      <dt>Dernier mois commun</dt>
      <dd>${echapperTexte(formaterMoisUtc(derniere.dernier_mois_commun))}</dd>
      <dt>Collecte</dt>
      <dd>${echapperTexte(derniere.collecte_utc.toISOString())}</dd>
      <dt>Fichier source</dt>
      <dd><code>${echapperTexte(derniere.fichier_source)}</code></dd>
      <dt>Série Martinique</dt>
      <dd>${echapperTexte(derniere.idbank_martinique)}</dd>
      <dt>Série France métropolitaine</dt>
      <dd>${echapperTexte(derniere.idbank_france_metropolitaine)}</dd>
      <dt>Source ECSP</dt>
      <dd>${
        resume.ancre?.source_ecsp
          ? `<a href="${echapperTexte(resume.ancre.source_ecsp)}">${echapperTexte(resume.ancre.source_ecsp)}</a>`
          : echapperTexte(sourceEcsp)
      }</dd>
    </dl>`;
  return section;
}

function creerElement(tag: string, className: string): HTMLElement {
  const el = document.createElement(tag);
  el.className = className;
  return el;
}

function echapperTexte(texte: string): string {
  return texte
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
