export type SyringeKind = "insulin-u100" | "insulin-u40" | "tuberculin-1ml";

export const SYRINGES: Record<SyringeKind, { label: string; capacityMl: number; unitsPerMl: number; deadSpaceMl: number }> = {
  "insulin-u100": { label: "Insulin U-100 (1 mL)", capacityMl: 1.0, unitsPerMl: 100, deadSpaceMl: 0.07 },
  "insulin-u40": { label: "Insulin U-40 (1 mL)", capacityMl: 1.0, unitsPerMl: 40, deadSpaceMl: 0.07 },
  "tuberculin-1ml": { label: "Tuberculin (1 mL)", capacityMl: 1.0, unitsPerMl: 100, deadSpaceMl: 0.05 },
};

export type DrawCalc = {
  concentrationMcgPerMl: number;
  volumeMl: number;
  units: number;
  withinCapacity: boolean;
  wastePerShotMl: number;
};

export function calcDraw(args: {
  vialStrengthMg: number;
  bacWaterMl: number;
  doseMcg: number;
  syringe: SyringeKind;
}): DrawCalc | null {
  const { vialStrengthMg, bacWaterMl, doseMcg } = args;
  const syr = SYRINGES[args.syringe];
  if (!vialStrengthMg || !bacWaterMl || !doseMcg) return null;
  const concentrationMcgPerMl = (vialStrengthMg * 1000) / bacWaterMl;
  const volumeMl = doseMcg / concentrationMcgPerMl;
  return {
    concentrationMcgPerMl,
    volumeMl,
    units: volumeMl * syr.unitsPerMl,
    withinCapacity: volumeMl <= syr.capacityMl,
    wastePerShotMl: syr.deadSpaceMl,
  };
}

export const fmt = (n: number, d = 2) =>
  Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: d }) : "—";
