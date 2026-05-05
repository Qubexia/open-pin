"use client";

import { useMemo, useState } from "react";
import { COMPOUNDS } from "@/data/compounds";
import { fmt } from "@/lib/syringe";

const PEPTIDE_PRESETS = [2, 5, 10, 15, 20, 25, 30, 50, 60, 100];
const BAC_PRESETS = [1, 2, 3, 5];
const DOSE_PRESETS = [100, 250, 500, 1000];

export function CalcScreen() {
  const [compoundQuery, setCompoundQuery] = useState("");
  const [compoundId, setCompoundId] = useState<string | null>(null);
  const [strengthMg, setStrengthMg] = useState(5);
  const [customStrength, setCustomStrength] = useState("");
  const [bacMl, setBacMl] = useState(2);
  const [customBac, setCustomBac] = useState("");
  const [doseMcg, setDoseMcg] = useState(250);
  const [customDose, setCustomDose] = useState("");
  const [roundToOne, setRoundToOne] = useState(false);

  const filtered = useMemo(() => {
    const q = compoundQuery.toLowerCase();
    if (!q) return [];
    return COMPOUNDS.filter((c) =>
      c.name.toLowerCase().includes(q) || c.aliases?.some((a) => a.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [compoundQuery]);

  const compound = compoundId ? COMPOUNDS.find((c) => c.id === compoundId) : null;
  const concentrationMcgPerMl = (strengthMg * 1000) / bacMl;
  const volumeMl = doseMcg / concentrationMcgPerMl;
  let units = volumeMl * 100; // U-100 syringe
  if (roundToOne) units = Math.round(units);
  const dosesPerVial = Math.floor((strengthMg * 1000) / doseMcg);

  const clear = () => {
    setCompoundId(null);
    setCompoundQuery("");
    setStrengthMg(5);
    setBacMl(2);
    setDoseMcg(250);
    setRoundToOne(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Reconstitution Calculator</h1>
        <button onClick={clear} className="text-xs rounded-md border border-[var(--danger)]/40 px-3 py-1.5 text-[var(--danger)]">
          Clear
        </button>
      </div>

      {/* Circular dial */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase tracking-wider text-[var(--muted)]">Draw</span>
          <label className="flex items-center gap-2 text-[10px] uppercase tracking-wider cursor-pointer">
            <input type="checkbox" checked={roundToOne} onChange={(e) => setRoundToOne(e.target.checked)} className="accent-[var(--accent)]" />
            <span className={roundToOne ? "text-[var(--accent)]" : "text-[var(--muted)]"}>Round to 1u</span>
          </label>
        </div>

        <Dial units={units} maxUnits={100} />

        <div className="grid grid-cols-2 gap-3 mt-4">
          <Stat label="Concentration" value={`${fmt(concentrationMcgPerMl, 0)} mcg/mL`} />
          <Stat label="Doses / vial" value={String(dosesPerVial)} />
        </div>
      </div>

      {/* Compound search */}
      <Section title="Compound">
        <div className="relative">
          <input
            value={compound?.name ?? compoundQuery}
            onChange={(e) => { setCompoundQuery(e.target.value); setCompoundId(null); }}
            placeholder="Search compound…"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm pr-10"
          />
          {compoundId && (
            <button onClick={() => { setCompoundId(null); setCompoundQuery(""); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted)] text-xs">✕</button>
          )}
          {filtered.length > 0 && !compoundId && (
            <ul className="mt-2 rounded-md border border-[var(--border)] bg-[var(--surface-2)] max-h-60 overflow-auto">
              {filtered.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => {
                      setCompoundId(c.id);
                      setCompoundQuery("");
                      if (c.defaultStrengthMg) setStrengthMg(c.defaultStrengthMg);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface)]"
                  >
                    {c.name}
                    <span className="text-xs text-[var(--muted)] ml-2 capitalize">{c.category}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Section>

      {/* Peptide in vial */}
      <Section title="Peptide in vial" accent>
        <div className="grid grid-cols-5 gap-1.5">
          {PEPTIDE_PRESETS.map((mg) => (
            <button
              key={mg}
              onClick={() => { setStrengthMg(mg); setCustomStrength(""); }}
              className={`rounded-md py-2 text-sm font-medium border ${
                strengthMg === mg && !customStrength
                  ? "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--accent)]"
              }`}
            >
              {mg}mg
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3">
          <button onClick={() => { const v = Math.max(0.5, strengthMg - 0.5); setStrengthMg(v); setCustomStrength(""); }}
            className="text-[var(--accent)] text-lg">-</button>
          <input
            inputMode="decimal"
            placeholder="Custom"
            value={customStrength}
            onChange={(e) => { setCustomStrength(e.target.value); const n = Number(e.target.value); if (n > 0) setStrengthMg(n); }}
            className="flex-1 bg-transparent py-2 text-center text-sm focus:outline-none"
          />
          <span className="text-xs text-[var(--muted)]">mg</span>
          <button onClick={() => { const v = strengthMg + 0.5; setStrengthMg(v); setCustomStrength(""); }}
            className="text-[var(--accent)] text-lg">+</button>
        </div>
      </Section>

      {/* BAC water */}
      <Section title="Bac water (mL)">
        <div className="grid grid-cols-4 gap-1.5">
          {BAC_PRESETS.map((ml) => (
            <button
              key={ml}
              onClick={() => { setBacMl(ml); setCustomBac(""); }}
              className={`rounded-md py-2 text-sm font-medium border ${
                bacMl === ml && !customBac
                  ? "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--accent)]"
              }`}
            >
              {ml}mL
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3">
          <button onClick={() => { const v = Math.max(0.1, +(bacMl - 0.1).toFixed(2)); setBacMl(v); setCustomBac(""); }}
            className="text-[var(--accent)] text-lg">-</button>
          <input
            inputMode="decimal"
            placeholder="Custom"
            value={customBac}
            onChange={(e) => { setCustomBac(e.target.value); const n = Number(e.target.value); if (n > 0) setBacMl(n); }}
            className="flex-1 bg-transparent py-2 text-center text-sm focus:outline-none"
          />
          <span className="text-xs text-[var(--muted)]">mL</span>
          <button onClick={() => { const v = +(bacMl + 0.1).toFixed(2); setBacMl(v); setCustomBac(""); }}
            className="text-[var(--accent)] text-lg">+</button>
        </div>
      </Section>

      {/* Dose */}
      <Section title="Dose (mcg)">
        <div className="grid grid-cols-4 gap-1.5">
          {DOSE_PRESETS.map((mcg) => (
            <button
              key={mcg}
              onClick={() => { setDoseMcg(mcg); setCustomDose(""); }}
              className={`rounded-md py-2 text-sm font-medium border ${
                doseMcg === mcg && !customDose
                  ? "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--accent)]"
              }`}
            >
              {mcg}mcg
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3">
          <button onClick={() => { const v = Math.max(10, doseMcg - 10); setDoseMcg(v); setCustomDose(""); }}
            className="text-[var(--accent)] text-lg">-</button>
          <input
            inputMode="numeric"
            placeholder="Custom"
            value={customDose}
            onChange={(e) => { setCustomDose(e.target.value); const n = Number(e.target.value); if (n > 0) setDoseMcg(n); }}
            className="flex-1 bg-transparent py-2 text-center text-sm focus:outline-none"
          />
          <span className="text-xs text-[var(--muted)]">mcg</span>
          <button onClick={() => { const v = doseMcg + 10; setDoseMcg(v); setCustomDose(""); }}
            className="text-[var(--accent)] text-lg">+</button>
        </div>
      </Section>

      <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] text-center">
        For research purposes only — not for human consumption.
      </p>
    </div>
  );
}

function Section({ title, children, accent }: { title: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <section className={`rounded-xl border bg-[var(--surface)] p-4 space-y-2 ${accent ? "border-[var(--accent)]/40" : "border-[var(--border)]"}`}>
      <p className={`text-xs uppercase tracking-wider ${accent ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>{title}</p>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-center">
      <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}

function Dial({ units, maxUnits }: { units: number; maxUnits: number }) {
  const radius = 80;
  const stroke = 10;
  const center = radius + stroke;
  const size = (radius + stroke) * 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.min(1, Math.max(0, units / maxUnits));
  const offset = circ * (1 - pct);

  return (
    <div className="flex items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={center} cy={center} r={radius}
            stroke="var(--surface-2)" strokeWidth={stroke} fill="none"
          />
          <circle
            cx={center} cy={center} r={radius}
            stroke="var(--accent)" strokeWidth={stroke} fill="none"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.3s" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold text-[var(--accent)]">
            {Number.isFinite(units) ? units.toFixed(1) : "—"}
          </span>
          <span className="text-xs text-[var(--muted)] uppercase tracking-wider">units</span>
        </div>
      </div>
    </div>
  );
}
