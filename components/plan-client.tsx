"use client";

import { useEffect, useMemo, useState } from "react";
import { COMPOUNDS } from "@/data/compounds";
import { lookupCompat } from "@/data/interactions";
import { useInventory } from "@/lib/stores";
import { SYRINGES, type SyringeKind, calcDraw, fmt } from "@/lib/syringe";

const compoundOf = (id: string) => COMPOUNDS.find((c) => c.id === id);
const compoundName = (id: string) => compoundOf(id)?.name ?? id;

export function Planner() {
  const { vials, loaded, load } = useInventory();
  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  const [vialAId, setVialAId] = useState<number | undefined>();
  const [doseA, setDoseA] = useState("250");
  const [vialBId, setVialBId] = useState<number | "none">("none");
  const [doseB, setDoseB] = useState("250");
  const [syringe, setSyringe] = useState<SyringeKind>("insulin-u100");

  useEffect(() => {
    if (vials.length && vialAId === undefined) setVialAId(vials[0].id);
  }, [vials, vialAId]);

  const vialA = vials.find((v) => v.id === vialAId);
  const vialB = vialBId === "none" ? undefined : vials.find((v) => v.id === vialBId);

  const calcA = useMemo(() => {
    if (!vialA?.reconstitutedBacWaterMl) return null;
    return calcDraw({
      vialStrengthMg: vialA.strengthMg,
      bacWaterMl: vialA.reconstitutedBacWaterMl,
      doseMcg: Number(doseA),
      syringe,
    });
  }, [vialA, doseA, syringe]);

  const calcB = useMemo(() => {
    if (!vialB?.reconstitutedBacWaterMl) return null;
    return calcDraw({
      vialStrengthMg: vialB.strengthMg,
      bacWaterMl: vialB.reconstitutedBacWaterMl,
      doseMcg: Number(doseB),
      syringe,
    });
  }, [vialB, doseB, syringe]);

  const compat = useMemo(() => {
    if (!vialA || !vialB) return null;
    return lookupCompat(vialA.compoundId, vialB.compoundId) ?? {
      verdict: "compatible" as const,
      rationale: "No specific incompatibility on file. Mixing aqueous neutral peptides is generally safe — verify charge, vehicle, and free thiol.",
      compound1: vialA.compoundId,
      compound2: vialB.compoundId,
    };
  }, [vialA, vialB]);

  const totalVolume = (calcA?.volumeMl ?? 0) + (calcB?.volumeMl ?? 0);
  const totalUnits = (calcA?.units ?? 0) + (calcB?.units ?? 0);
  const withinCapacity = totalVolume <= SYRINGES[syringe].capacityMl;

  if (!loaded) return <p className="text-sm text-[var(--muted)]">Loading…</p>;

  if (vials.length === 0)
    return (
      <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
        Add a reconstituted vial in <strong>Inventory</strong> first (with BAC water amount), then come back here to plan a draw.
      </p>
    );

  const reconstitutedVials = vials.filter((v) => v.reconstitutedBacWaterMl && v.reconstitutedBacWaterMl > 0);

  if (reconstitutedVials.length === 0)
    return (
      <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
        None of your vials have a BAC water amount set. Edit a vial in Inventory and add the mL of bacteriostatic water you used.
      </p>
    );

  return (
    <div className="space-y-4">
      <Section title="Syringe">
        <select
          value={syringe}
          onChange={(e) => setSyringe(e.target.value as SyringeKind)}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
        >
          {Object.entries(SYRINGES).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label} · {v.deadSpaceMl} mL dead space
            </option>
          ))}
        </select>
      </Section>

      <Section title="Compound A">
        <VialPicker
          vials={reconstitutedVials}
          value={vialAId}
          onChange={(id) => setVialAId(id as number)}
        />
        <DoseInput value={doseA} onChange={setDoseA} />
        {calcA && <CalcReadout calc={calcA} syringe={syringe} />}
      </Section>

      <Section title="Compound B (optional mix)">
        <select
          value={vialBId === "none" ? "none" : String(vialBId)}
          onChange={(e) => setVialBId(e.target.value === "none" ? "none" : Number(e.target.value))}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
        >
          <option value="none">— Pin alone —</option>
          {reconstitutedVials
            .filter((v) => v.id !== vialAId)
            .map((v) => (
              <option key={v.id} value={v.id}>
                {compoundName(v.compoundId)} · {v.strengthMg} mg / {v.reconstitutedBacWaterMl} mL
              </option>
            ))}
        </select>
        {vialB && <DoseInput value={doseB} onChange={setDoseB} />}
        {calcB && <CalcReadout calc={calcB} syringe={syringe} />}
      </Section>

      {vialA && vialB && compat && (
        <CompatBanner
          verdict={compat.verdict}
          rationale={compat.rationale}
          a={compoundName(vialA.compoundId)}
          b={compoundName(vialB.compoundId)}
        />
      )}

      {(calcA || calcB) && (
        <div className="rounded-xl border border-[var(--accent)]/40 bg-[var(--surface)] p-4">
          <p className="text-xs uppercase tracking-wider text-[var(--muted)]">Total draw</p>
          <p className="mt-1 text-2xl font-semibold">
            {fmt(totalVolume, 3)} mL <span className="text-base font-normal text-[var(--muted)]">· {fmt(totalUnits, 0)} units</span>
          </p>
          {!withinCapacity && (
            <p className="mt-1 text-xs text-[var(--danger)]">
              Exceeds {SYRINGES[syringe].capacityMl} mL capacity. Split the dose or use a larger syringe.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
      <h2 className="text-xs uppercase tracking-wider text-[var(--muted)]">{title}</h2>
      {children}
    </section>
  );
}

function VialPicker({
  vials,
  value,
  onChange,
}: {
  vials: import("@/lib/db").Vial[];
  value: number | undefined;
  onChange: (id: number) => void;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
    >
      {vials.map((v) => (
        <option key={v.id} value={v.id}>
          {compoundName(v.compoundId)} · {v.strengthMg} mg / {v.reconstitutedBacWaterMl} mL
        </option>
      ))}
    </select>
  );
}

function DoseInput({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-[var(--muted)]">Target dose (mcg)</span>
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
      />
    </label>
  );
}

function CalcReadout({
  calc,
  syringe,
}: {
  calc: NonNullable<ReturnType<typeof calcDraw>>;
  syringe: SyringeKind;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      <Stat label="Conc." value={`${fmt(calc.concentrationMcgPerMl, 0)} mcg/mL`} />
      <Stat label="Volume" value={`${fmt(calc.volumeMl, 3)} mL`} />
      <Stat label="Units" value={`${fmt(calc.units, 1)} (${SYRINGES[syringe].unitsPerMl}/mL)`} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2">
      <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

function CompatBanner({
  verdict,
  rationale,
  a,
  b,
}: {
  verdict: "compatible" | "incompatible" | "synergistic" | "caution";
  rationale: string;
  a: string;
  b: string;
}) {
  const colors = {
    compatible: { border: "border-[var(--accent)]/50", text: "text-[var(--accent)]", label: "Compatible" },
    synergistic: { border: "border-[var(--accent)]", text: "text-[var(--accent)]", label: "Synergistic" },
    caution: { border: "border-[var(--warning)]", text: "text-[var(--warning)]", label: "Caution" },
    incompatible: { border: "border-[var(--danger)]", text: "text-[var(--danger)]", label: "Incompatible — pin alone" },
  }[verdict];
  return (
    <div className={`rounded-xl border ${colors.border} bg-[var(--surface)] p-4`}>
      <p className={`text-xs font-semibold uppercase tracking-wider ${colors.text}`}>{colors.label}</p>
      <p className="mt-1 text-sm">
        {a} + {b}
      </p>
      <p className="mt-2 text-xs text-[var(--muted)]">{rationale}</p>
    </div>
  );
}
