export type AvoidClass = {
  id: string;
  label: string;
  reason: string;
};

export const AVOID_LIST: AvoidClass[] = [
  { id: "ssri-snri", label: "SSRIs and SNRIs", reason: "Serotonergic interaction risk with some peptides (e.g. Selank, Semax)." },
  { id: "maoi", label: "MAOIs", reason: "Serotonin syndrome risk." },
  { id: "tramadol", label: "Tramadol", reason: "Serotonergic + seizure risk." },
  { id: "ketamine", label: "Ketamine", reason: "CNS depressant interaction." },
];

export type CompatVerdict = "compatible" | "incompatible" | "synergistic" | "caution";

export type CompatRule = {
  compound1: string;
  compound2: string;
  verdict: CompatVerdict;
  rationale: string;
};

export const COMPAT_RULES: CompatRule[] = [
  { compound1: "bpc-157", compound2: "tb-500", verdict: "synergistic", rationale: "Common healing stack; both neutral, aqueous-compatible." },
  { compound1: "cjc-1295-no-dac", compound2: "ipamorelin", verdict: "synergistic", rationale: "Classic GHRH + GHRP pulse stack." },
  { compound1: "cjc-1295-no-dac", compound2: "ghrp-2", verdict: "synergistic", rationale: "GHRH + GHRP." },
  { compound1: "cjc-1295-no-dac", compound2: "ghrp-6", verdict: "synergistic", rationale: "GHRH + GHRP." },
  { compound1: "cjc-1295-no-dac", compound2: "hexarelin", verdict: "synergistic", rationale: "GHRH + GHRP." },
  { compound1: "ghk-cu", compound2: "bpc-157", verdict: "incompatible", rationale: "Free thiol on BPC-157 reduces Cu²⁺ in GHK-Cu — pin alone." },
  { compound1: "ghk-cu", compound2: "tb-500", verdict: "caution", rationale: "Copper conjugation may be affected by reducing peptides; prefer separate sites." },
];

export function lookupCompat(a: string, b: string): CompatRule | undefined {
  return COMPAT_RULES.find(
    r => (r.compound1 === a && r.compound2 === b) || (r.compound1 === b && r.compound2 === a),
  );
}
