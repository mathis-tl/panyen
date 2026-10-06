import graine from "../../dbt/seeds/ecsp_alimentation_2022.csv?raw";
import { describe, expect, it } from "vitest";

describe("ancre alimentaire 2022", () => {
  it("lit 40,2 % et la page Insee Première n° 1958", () => {
    const ligne = graine.trim().split("\n")[1] ?? "";
    const colonnes = ligne.split(",");
    expect(colonnes[4]).toBe("40.2");
    expect(colonnes[7]).toBe("https://www.insee.fr/fr/statistiques/7648939");
  });
});
