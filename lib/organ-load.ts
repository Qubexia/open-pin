import { COMPOUND_MAP, ORGAN_KEYS, ORGAN_LABELS, type Organ, type OrganLoad, type SafetyFlag } from "@/data/compounds";

export type CumulativeLoad = Record<Organ, number>;

const EMPTY: CumulativeLoad = {
  bloodVessels: 0, giTract: 0, mast: 0, neurons: 0, pituitary: 0,
  thyroid: 0, liver: 0, kidneys: 0, heart: 0,
};

export function cumulativeOrganLoad(compoundIds: string[]): CumulativeLoad {
  const total: CumulativeLoad = { ...EMPTY };
  for (const id of compoundIds) {
    const c = COMPOUND_MAP[id];
    if (!c?.organLoad) continue;
    for (const k of ORGAN_KEYS) {
      total[k] += c.organLoad[k] ?? 0;
    }
  }
  return total;
}

export function organLoadEntries(load: CumulativeLoad) {
  return ORGAN_KEYS.map((k) => ({
    organ: k,
    label: ORGAN_LABELS[k],
    score: load[k],
  })).sort((a, b) => b.score - a.score);
}

export type FlagShare = { flag: SafetyFlag; compoundIds: string[] };

export function sharedSafetyFlags(compoundIds: string[]): FlagShare[] {
  const map = new Map<SafetyFlag, string[]>();
  for (const id of compoundIds) {
    const c = COMPOUND_MAP[id];
    if (!c?.safetyFlags) continue;
    for (const f of c.safetyFlags) {
      if (!map.has(f)) map.set(f, []);
      map.get(f)!.push(id);
    }
  }
  return Array.from(map.entries())
    .filter(([, ids]) => ids.length >= 2)
    .map(([flag, compoundIds]) => ({ flag, compoundIds }))
    .sort((a, b) => b.compoundIds.length - a.compoundIds.length);
}

export function loadColor(score: number): string {
  if (score >= 15) return "var(--danger)";
  if (score >= 8) return "var(--warning)";
  if (score >= 3) return "var(--accent)";
  return "var(--muted)";
}
