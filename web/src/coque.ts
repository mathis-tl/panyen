/**
 * Coque de la page : en-tête, bandeau et squelette, montés avant le chargement
 * des données et du reste du code. Le premier affichage (le bandeau est le plus
 * grand élément de la page) ne dépend ainsi ni de DuckDB-Parquet, ni de Plot.
 */
import { creerEntete } from "./entete.ts";
import { squelette } from "./rendu.ts";

export const TEXTE_INTRO =
  "Panye compare les prix des courses en Martinique et dans l'Hexagone. En 2022, l'Insee a mesuré l'écart. Depuis, a-t-il changé ?";

/** Bandeau : vidéo muette en boucle (sauf mouvement réduit ou économie de données). */
export function creerBandeau(intro: HTMLElement): HTMLElement {
  const bande = document.createElement("div");
  bande.className = "bandeau";
  const video = document.createElement("video");
  video.className = "bandeau-video";
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.poster = "/media/martinique-poster.jpg";
  video.setAttribute("aria-hidden", "true");
  video.tabIndex = -1;
  const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const economieDonnees =
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData ===
    true;
  if (!reduit && !economieDonnees) {
    video.autoplay = true;
    video.loop = true;
    const source = document.createElement("source");
    const petit = window.matchMedia("(max-width: 700px)").matches;
    source.src = petit ? "/media/martinique-640.mp4" : "/media/martinique.mp4";
    source.type = "video/mp4";
    video.append(source);
  }
  const voile = document.createElement("div");
  voile.className = "bandeau-voile";
  voile.setAttribute("aria-hidden", "true");
  const texte = document.createElement("div");
  texte.className = "bandeau-texte";
  texte.append(intro);
  bande.append(video, voile, texte);
  return bande;
}

/** Monte l'en-tête, le bandeau et l'annonce de chargement. */
export function monterCoque(conteneur: HTMLElement): void {
  const principal = document.createElement("main");
  principal.className = "coque";
  const intro = document.createElement("p");
  intro.className = "intro";
  intro.textContent = TEXTE_INTRO;
  const etat = document.createElement("div");
  etat.innerHTML = squelette("Chargement des données.");
  principal.append(creerBandeau(intro), etat);
  conteneur.replaceChildren(creerEntete(), principal);
}
