/** Graduations en français pour Plot : mois abrégés, virgule décimale. */
const MOIS_COURTS = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

/** « avr. 2022 » en janvier et sur le premier repère, « juil. » sinon. */
export function formaterMoisAxe(date: Date, avecAnnee: boolean): string {
  const mois = MOIS_COURTS[date.getUTCMonth()];
  return avecAnnee || date.getUTCMonth() === 0 ? `${mois} ${date.getUTCFullYear()}` : mois;
}

export function formaterDecimaleFr(n: number | string): string {
  return String(n).replace(".", ",");
}
