/**
 * Rendu DOM — récit dans l'ordre de lecture de la spec 1.6c
 * (mise en page graphe corrigée en 1.6d).
 */
import {
  formaterEuros,
  formaterPct,
  formaterPointsSignes,
  type ResumeEcran,
} from "./calculs.ts";
import type { LigneDifferentiel } from "./types.ts";
import { grapheEvolutions } from "./graphe.ts";
import { creerPlanificateurRedessin } from "./planifier-redessin.ts";
import { formaterMoisUtc } from "./validation.ts";

/** Affiche l'état de chargement. */
export function afficherChargement(conteneur: HTMLElement): void {
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
  conteneur.innerHTML = contenuErreur(erreur);
}

/** Affiche l'écran principal dans l'ordre de lecture. */
export function afficherEcran(
  conteneur: HTMLElement,
  resume: ResumeEcran,
): void {
  conteneur.innerHTML = "";
  conteneur.appendChild(creerReponse(resume));
  conteneur.appendChild(creerAncre(resume));
  conteneur.appendChild(creerGraphe(resume));
  conteneur.appendChild(creerJalons(resume));
  conteneur.appendChild(creerExplication(resume));
  conteneur.appendChild(creerLimiteMethodologique());
  conteneur.appendChild(creerProvenance(resume.actuelle, resume.ancre));
}

function creerReponse(resume: ResumeEcran): HTMLElement {
  const section = creerElement("section", "reponse");
  section.innerHTML = `<h1>${echapperTexte(resume.phrase)}</h1>`;
  return section;
}

function creerAncre(resume: ResumeEcran): HTMLElement {
  const { ancre, panierAncre } = resume;
  const section = creerElement("section", "ancre");
  section.innerHTML = `
    <h2>Point de départ — mesure ECSP mars-avril 2022</h2>
    <p>En mars-avril 2022, l'enquête de comparaison spatiale de l'Insee a
    <strong>mesuré</strong> un écart alimentaire d'environ
    <strong>${formaterPct(ancre.ecart_ecsp_2022_pct)} %</strong>
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
  titre.textContent = "Évolution cumulée des prix alimentaires depuis avril 2022";
  section.appendChild(titre);

  const sousTitre = document.createElement("p");
  sousTitre.className = "graphe-sous-titre";
  sousTitre.textContent =
    `${resume.seriesEvolution.premierMois} → ${resume.seriesEvolution.dernierMois}` +
    " · deux évolutions intra-territoire, pas des niveaux d'indice";
  section.appendChild(sousTitre);

  const intro = document.createElement("p");
  intro.textContent =
    "Chaque courbe est une évolution cumulée des prix alimentaires depuis avril 2022, " +
    "calculée à l'intérieur de son territoire. Ce ne sont pas des niveaux d'indice comparés.";
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
  // Premier dessin via le même mécanisme sûr (hors callback observer).
  planificateur.signaler();

  return section;
}

function creerJalons(resume: ResumeEcran): HTMLElement {
  const section = creerElement("section", "jalons");
  section.innerHTML = `<h2>Trois moments à retenir</h2>`;
  section.appendChild(
    creerCarteJalon(
      "Minimum estimé",
      resume.minimumEstime,
      resume.panierMinimum,
      "estimation",
    ),
  );
  section.appendChild(
    creerCarteJalon(
      "Maximum estimé",
      resume.maximumEstime,
      resume.panierMaximum,
      "estimation",
    ),
  );
  section.appendChild(
    creerCarteJalon(
      "Dernier mois commun",
      resume.actuelle,
      resume.panierActuelle,
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
      <strong>${formaterPct(ligne.ecart_prix_estime_pct)} %</strong>
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
  section.innerHTML = `
    <h2>Comment lire ces chiffres</h2>
    <p>${echapperTexte(resume.explicationPourcentageVsPoints)}</p>
    <ul>
      <li><strong>Mesure</strong> : uniquement l'ECSP de mars-avril 2022.</li>
      <li><strong>Estimation</strong> : tout prolongement après l'ancre, obtenu
      en appliquant le rapport exact des facteurs d'évolution à la mesure ECSP.</li>
      <li><strong>Resserrement / creusement</strong> : décrivent l'écart relatif
      entre territoires, pas une différence absolue en euros par rapport à 2022.</li>
    </ul>`;
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
    l'enquête de comparaison spatiale (ECSP) de mars-avril 2022. Son prolongement
    mois par mois, via le rapport des facteurs d'évolution, est une
    <strong>estimation</strong>, pas une mesure. Les 40 % concernent l'alimentation,
    pas l'ensemble du coût de la vie ni le pouvoir d'achat.</p>`;
  return section;
}

function creerProvenance(
  derniere: LigneDifferentiel,
  ancre: LigneDifferentiel,
): HTMLElement {
  const section = creerElement("section", "provenance");
  section.innerHTML = `
    <h2>Provenance</h2>
    <dl>
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
      <dd><a href="${echapperTexte(ancre.source_ecsp)}">${echapperTexte(ancre.source_ecsp)}</a></dd>
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
