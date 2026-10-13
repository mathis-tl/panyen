/**
 * Point d'entrée de la page. Le premier script est volontairement minuscule :
 * il monte l'en-tête et le bandeau, puis charge le reste (données, graphiques).
 */
import "./polices.css";
import "./style.css";
import { monterCoque } from "./coque.ts";

function lancer(): void {
  const app = document.querySelector<HTMLElement>("#app");
  if (!app) return;
  monterCoque(app);
  void import("./demarrage.ts").then(({ demarrerApplication }) => demarrerApplication(app));
}

lancer();
