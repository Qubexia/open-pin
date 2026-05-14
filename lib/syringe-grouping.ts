import { COMPOUND_MAP } from "@/data/compounds";
import { lookupCompat } from "@/data/interactions";
import type { Protocol } from "./db";

export type SyringeGroup = {
  id: string;
  protocols: Protocol[];
  totalDoseMcg: number;
  pinAlone: boolean; // any member is pinAlone → whole syringe is solo
  warnings: string[];
};

/**
 * Group protocols into "syringes" based on:
 *   • same timing slot (or no timing)
 *   • same route
 *   • pairwise compatible (no `incompatible` verdict)
 *   • none of them is `pinAlone`
 *
 * Returns groups in stable order: largest first, then by first protocol name.
 */
export function groupProtocolsIntoSyringes(protocols: Protocol[]): SyringeGroup[] {
  const groups: SyringeGroup[] = [];

  for (const p of protocols) {
    const compound = COMPOUND_MAP[p.compoundId];
    const route = compound?.route ?? "subq";
    const timing = p.timing ?? "any";

    let placed = false;
    if (!compound?.pinAlone) {
      for (const g of groups) {
        if (g.pinAlone) continue;
        const head = g.protocols[0];
        const headCompound = COMPOUND_MAP[head.compoundId];
        const headRoute = headCompound?.route ?? "subq";
        const headTiming = head.timing ?? "any";
        if (route !== headRoute) continue;
        if (timing !== headTiming) continue;
        const allCompatible = g.protocols.every((m) => {
          if (m.compoundId === p.compoundId) return true;
          const compat = lookupCompat(m.compoundId, p.compoundId);
          return !compat || compat.verdict !== "incompatible";
        });
        if (!allCompatible) continue;
        g.protocols.push(p);
        g.totalDoseMcg += getDoseMcg(p);
        if (compound?.pinAlone) g.pinAlone = true;
        const warns = collectWarnings(g.protocols);
        g.warnings = warns;
        placed = true;
        break;
      }
    }
    if (!placed) {
      groups.push({
        id: `syringe-${groups.length + 1}`,
        protocols: [p],
        totalDoseMcg: getDoseMcg(p),
        pinAlone: !!compound?.pinAlone,
        warnings: [],
      });
    }
  }

  // Stable sort: bigger groups first, then alpha
  groups.sort((a, b) => {
    if (b.protocols.length !== a.protocols.length) return b.protocols.length - a.protocols.length;
    return (a.protocols[0]?.name ?? "").localeCompare(b.protocols[0]?.name ?? "");
  });

  // Re-id after sort
  return groups.map((g, i) => ({ ...g, id: `syringe-${i + 1}` }));
}

function getDoseMcg(p: Protocol): number {
  if (!p.steps?.length) return p.doseMcg;
  // Use first step as a default — caller can use effectiveDose if they need current step
  return p.steps[0]?.doseMcg ?? p.doseMcg;
}

function collectWarnings(members: Protocol[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const compat = lookupCompat(members[i].compoundId, members[j].compoundId);
      if (compat?.verdict === "caution") {
        out.push(`${COMPOUND_MAP[members[i].compoundId]?.name} + ${COMPOUND_MAP[members[j].compoundId]?.name}: ${compat.rationale}`);
      }
    }
  }
  return out;
}
