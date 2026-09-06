import { describe, it, expect, vi } from "vitest";
import { creerPlanificateurRedessin } from "./planifier-redessin.ts";

describe("creerPlanificateurRedessin", () => {
  it("coalesce deux signalements avant le frame en un seul redessin", () => {
    const redessiner = vi.fn();
    const frames: Array<() => void> = [];
    let prochainId = 1;
    const programmerFrame = (cb: () => void): number => {
      frames.push(cb);
      return prochainId++;
    };
    const annulerFrame = vi.fn();

    const planificateur = creerPlanificateurRedessin(
      redessiner,
      programmerFrame,
      annulerFrame,
    );

    planificateur.signaler();
    planificateur.signaler();

    expect(frames).toHaveLength(1);
    expect(redessiner).not.toHaveBeenCalled();

    frames[0]();
    expect(redessiner).toHaveBeenCalledTimes(1);

    planificateur.signaler();
    expect(frames).toHaveLength(2);
    expect(redessiner).toHaveBeenCalledTimes(1);

    frames[1]();
    expect(redessiner).toHaveBeenCalledTimes(2);
  });

  it("annule un frame encore en attente", () => {
    const redessiner = vi.fn();
    let appelsProgrammation = 0;
    const programmerFrame = (_cb: () => void): number => {
      appelsProgrammation += 1;
      return 40 + appelsProgrammation;
    };
    const annulerFrame = vi.fn();

    const planificateur = creerPlanificateurRedessin(
      redessiner,
      programmerFrame,
      annulerFrame,
    );

    planificateur.signaler();
    planificateur.annuler();

    expect(annulerFrame).toHaveBeenCalledWith(41);
    expect(redessiner).not.toHaveBeenCalled();
    expect(appelsProgrammation).toBe(1);

    // Après annulation, un nouveau signalement peut reprogrammer.
    planificateur.signaler();
    expect(appelsProgrammation).toBe(2);
  });
});
