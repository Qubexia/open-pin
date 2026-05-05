"use client";

import { useEffect, useState } from "react";
import { COMPOUNDS, getCompoundName } from "@/data/compounds";
import { lookupCompat } from "@/data/interactions";
import { type FrequencyUnit, type ProtocolStep } from "@/lib/db";
import { FREQ_LABELS, TIMING_LABELS, daysRemaining, isDue, progressPct, currentStep, effectiveDose } from "@/lib/protocol-utils";
import { SYRINGES, type SyringeKind, calcDraw, fmt } from "@/lib/syringe";
import { useInventory, useProtocols } from "@/lib/stores";
import { SiteGrid as SiteGridComponent } from "./sites-client";

const FREQUENCIES: FrequencyUnit[] = ["daily", "eod", "3x-week", "weekly", "every-x-days"];

// ─── Protocol List ─────────────────────────────────────────────────────────────
export function ProtocolList() {
  const { protocols, loaded, load, remove, toggle } = useProtocols();
  useEffect(() => { if (!loaded) load(); }, [loaded, load]);
  if (!loaded) return <p className="text-sm text-[var(--muted)]">Loading…</p>;
  if (protocols.length === 0)
    return <p className="text-sm text-[var(--muted)]">No protocols yet. Create one below.</p>;

  return (
    <ul className="space-y-3">
      {protocols.map((p) => {
        const remaining = daysRemaining(p);
        const due = isDue(p);
        const finished = remaining === 0;
        const pct = progressPct(p);
        const step = currentStep(p);
        const dose = effectiveDose(p);

        return (
          <li key={p.id} className={`rounded-xl border p-4 ${
            finished ? "border-[var(--border)] opacity-60" :
            due ? "border-[var(--accent)]/60 bg-[var(--accent)]/5" :
            "border-[var(--border)] bg-[var(--surface)]"
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{p.name}</p>
                  {due && !finished && <Badge color="green">Due today</Badge>}
                  {finished && <Badge color="muted">Finished</Badge>}
                  {!p.active && !finished && <Badge color="muted">Paused</Badge>}
                  {p.pinAlone && <Badge color="yellow">Pin alone</Badge>}
                </div>
                <p className="text-sm text-[var(--muted)] mt-0.5">
                  {getCompoundName(p.compoundId)} · {dose} mcg
                  {p.timing ? ` · ${TIMING_LABELS[p.timing]}` : ""}
                </p>
                {step && (
                  <p className="text-xs text-[var(--accent)] mt-0.5">
                    Step {step.index + 1}{step.step.label ? `: ${step.step.label}` : ""} · {step.step.durationDays - (daysRemaining(p) % step.step.durationDays)}d in
                  </p>
                )}
                <p className="text-xs text-[var(--muted)]">
                  {FREQ_LABELS[p.frequency]}{p.frequencyXDays ? ` (every ${p.frequencyXDays}d)` : ""} · {remaining}/{daysRemaining(p) + (progressPct(p) === 0 ? 0 : Math.round(daysRemaining(p) * pct / (100 - pct + 0.001)))}d left
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => p.id && toggle(p.id, !p.active)}
                  className="text-xs rounded-md border border-[var(--border)] px-2 py-1 text-[var(--muted)]">
                  {p.active ? "Pause" : "Resume"}
                </button>
                <button onClick={() => p.id && remove(p.id)}
                  className="text-xs rounded-md border border-[var(--border)] px-2 py-1 text-[var(--muted)] hover:text-[var(--danger)] hover:border-[var(--danger)]">
                  ✕
                </button>
              </div>
            </div>
            <div className="mt-3 h-1.5 w-full rounded-full bg-[var(--surface-2)]">
              <div className="h-1.5 rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: "green" | "yellow" | "muted" }) {
  const cls = { green: "text-[var(--accent)] border-[var(--accent)]/50", yellow: "text-[var(--warning)] border-[var(--warning)]/50", muted: "text-[var(--muted)] border-[var(--border)]" }[color];
  return <span className={`text-[10px] font-semibold uppercase tracking-wider border rounded px-1.5 py-0.5 ${cls}`}>{children}</span>;
}

// ─── Add Protocol Form ─────────────────────────────────────────────────────────
export function AddProtocolForm() {
  const { add } = useProtocols();
  const { vials, loaded, load } = useInventory();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [compoundId, setCompoundId] = useState(COMPOUNDS[0].id);
  const [vialId, setVialId] = useState<number | undefined>();
  const [doseMcg, setDoseMcg] = useState("250");
  const [frequency, setFrequency] = useState<FrequencyUnit>("daily");
  const [frequencyX, setFrequencyX] = useState("3");
  const [durationDays, setDurationDays] = useState("28");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [timing, setTiming] = useState<string>("");
  const [pinAlone, setPinAlone] = useState(false);
  const [multiStep, setMultiStep] = useState(false);
  const [steps, setSteps] = useState<ProtocolStep[]>([{ doseMcg: 250, durationDays: 14 }]);

  useEffect(() => { if (!loaded) load(); }, [loaded, load]);
  useEffect(() => { if (vials.length && !vialId) setVialId(vials[0].id); }, [vials, vialId]);

  const addStep = () => setSteps((s) => [...s, { doseMcg: 250, durationDays: 14 }]);
  const removeStep = (i: number) => setSteps((s) => s.filter((_, idx) => idx !== i));
  const updateStep = (i: number, field: keyof ProtocolStep, val: number) =>
    setSteps((s) => s.map((st, idx) => idx === i ? { ...st, [field]: val } : st));

  const totalDays = multiStep ? steps.reduce((a, s) => a + s.durationDays, 0) : Number(durationDays);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await add({
      name: name.trim(), compoundId, vialId,
      doseMcg: multiStep ? steps[0].doseMcg : Number(doseMcg),
      steps: multiStep ? steps : undefined,
      frequency, frequencyXDays: frequency === "every-x-days" ? Number(frequencyX) : undefined,
      durationDays: totalDays, startDate,
      timing: timing as any || undefined,
      pinAlone, active: true,
    });
    setOpen(false); setName("");
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} className="w-full rounded-lg bg-[var(--accent)] px-3 py-2.5 text-sm font-medium text-[var(--accent-fg)]">
      + New protocol
    </button>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-xs uppercase tracking-wider text-[var(--muted)]">New protocol</p>

      <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Protocol name (e.g. BPC-157 healing cycle)"
        className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm" />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[var(--muted)]">Compound</label>
          <select value={compoundId} onChange={(e) => setCompoundId(e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2 text-sm">
            {COMPOUNDS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {vials.length > 0 && (
          <div>
            <label className="text-xs text-[var(--muted)]">Linked vial</label>
            <select value={vialId ?? ""} onChange={(e) => setVialId(e.target.value ? Number(e.target.value) : undefined)}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2 text-sm">
              <option value="">None</option>
              {vials.filter((v) => v.compoundId === compoundId).map((v) => (
                <option key={v.id} value={v.id}>{v.strengthMg}mg{v.brand ? ` · ${v.brand}` : ""}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Multi-step toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={multiStep} onChange={(e) => setMultiStep(e.target.checked)} className="accent-[var(--accent)]" />
        <span className="text-sm">Multi-step protocol</span>
      </label>

      {multiStep ? (
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 items-center rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-2">
              <div>
                <label className="text-[10px] text-[var(--muted)]">Step {i + 1} dose (mcg)</label>
                <input inputMode="numeric" value={step.doseMcg} onChange={(e) => updateStep(i, "doseMcg", Number(e.target.value))}
                  className="w-full rounded border-0 bg-transparent text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-[var(--muted)]">Days</label>
                <input inputMode="numeric" value={step.durationDays} onChange={(e) => updateStep(i, "durationDays", Number(e.target.value))}
                  className="w-full rounded border-0 bg-transparent text-sm focus:outline-none" />
              </div>
              <button type="button" onClick={() => removeStep(i)} className="text-xs text-[var(--muted)] hover:text-[var(--danger)] justify-self-end">✕</button>
            </div>
          ))}
          <button type="button" onClick={addStep} className="text-xs text-[var(--accent)] border border-[var(--accent)]/40 rounded px-2 py-1">+ Add step</button>
          <p className="text-xs text-[var(--muted)]">Total: {totalDays} days</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[var(--muted)]">Dose (mcg)</label>
            <input inputMode="numeric" value={doseMcg} onChange={(e) => setDoseMcg(e.target.value)}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-[var(--muted)]">Duration (days)</label>
            <input inputMode="numeric" value={durationDays} onChange={(e) => setDurationDays(e.target.value)}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[var(--muted)]">Frequency</label>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value as FrequencyUnit)}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2 text-sm">
            {FREQUENCIES.map((f) => <option key={f} value={f}>{FREQ_LABELS[f]}</option>)}
          </select>
          {frequency === "every-x-days" && (
            <input inputMode="numeric" value={frequencyX} onChange={(e) => setFrequencyX(e.target.value)} placeholder="X days"
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2 text-sm" />
          )}
        </div>
        <div>
          <label className="text-xs text-[var(--muted)]">Start date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2 text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[var(--muted)]">Timing</label>
          <select value={timing} onChange={(e) => setTiming(e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2 text-sm">
            <option value="">— Any —</option>
            {Object.entries(TIMING_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={pinAlone} onChange={(e) => setPinAlone(e.target.checked)} className="accent-[var(--accent)]" />
            Force solo
          </label>
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit" className="flex-1 rounded-lg bg-[var(--accent)] px-3 py-2.5 text-sm font-medium text-[var(--accent-fg)]">Save</button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--muted)]">Cancel</button>
      </div>
    </form>
  );
}

// ─── Syringe Planner ───────────────────────────────────────────────────────────
export function Planner() {
  const { vials, loaded, load } = useInventory();
  useEffect(() => { if (!loaded) load(); }, [loaded, load]);

  const [vialAId, setVialAId] = useState<number | undefined>();
  const [doseA, setDoseA] = useState("250");
  const [vialBId, setVialBId] = useState<number | "none">("none");
  const [doseB, setDoseB] = useState("250");
  const [syringe, setSyringe] = useState<SyringeKind>("insulin-u100");
  const [forceSolo, setForceSolo] = useState(false);

  useEffect(() => { if (vials.length && !vialAId) setVialAId(vials[0].id); }, [vials, vialAId]);

  const reconstituted = vials.filter((v) => v.reconstitutedBacWaterMl && v.reconstitutedBacWaterMl > 0);
  const vialA = vials.find((v) => v.id === vialAId);
  const vialB = (forceSolo || vialBId === "none") ? undefined : vials.find((v) => v.id === vialBId);

  const calcA = vialA?.reconstitutedBacWaterMl ? calcDraw({ vialStrengthMg: vialA.strengthMg, bacWaterMl: vialA.reconstitutedBacWaterMl, doseMcg: Number(doseA), syringe }) : null;
  const calcB = vialB?.reconstitutedBacWaterMl ? calcDraw({ vialStrengthMg: vialB.strengthMg, bacWaterMl: vialB.reconstitutedBacWaterMl, doseMcg: Number(doseB), syringe }) : null;

  const compat = vialA && vialB ? (lookupCompat(vialA.compoundId, vialB.compoundId) ?? { verdict: "compatible" as const, rationale: "No specific interaction on file. Verify charge, vehicle, and free thiol before mixing.", compound1: "", compound2: "" }) : null;

  const totalVol = (calcA?.volumeMl ?? 0) + (calcB?.volumeMl ?? 0);
  const totalUnits = (calcA?.units ?? 0) + (calcB?.units ?? 0);
  const overCapacity = totalVol > SYRINGES[syringe].capacityMl;

  if (!loaded) return <p className="text-sm text-[var(--muted)]">Loading…</p>;
  if (reconstituted.length === 0)
    return <p className="text-sm text-[var(--muted)] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">Add a vial with BAC water amount in Inventory to use the calculator.</p>;

  const compoundData = vialA ? COMPOUNDS.find((c) => c.id === vialA.compoundId) : null;

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
        <h3 className="text-xs uppercase tracking-wider text-[var(--muted)]">Syringe</h3>
        <select value={syringe} onChange={(e) => setSyringe(e.target.value as SyringeKind)}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm">
          {Object.entries(SYRINGES).map(([k, v]) => (
            <option key={k} value={k}>{v.label} · {v.deadSpaceMl} mL dead space</option>
          ))}
        </select>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
        <h3 className="text-xs uppercase tracking-wider text-[var(--muted)]">Compound A</h3>
        <select value={vialAId ?? ""} onChange={(e) => setVialAId(Number(e.target.value))}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm">
          {reconstituted.map((v) => (
            <option key={v.id} value={v.id}>{getCompoundName(v.compoundId)} · {v.strengthMg}mg/{v.reconstitutedBacWaterMl}mL</option>
          ))}
        </select>
        <label className="block">
          <span className="text-xs text-[var(--muted)]">Dose (mcg)</span>
          <input inputMode="numeric" value={doseA} onChange={(e) => setDoseA(e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm" />
        </label>
        {calcA && <CalcRow calc={calcA} syringe={syringe} />}
        {compoundData?.pinAlone && (
          <p className="text-xs text-[var(--warning)]">⚠ {compoundData.name} recommended to pin alone. {compoundData.mixNote ?? ""}</p>
        )}
        {compoundData?.coStorage && (
          <p className="text-xs text-[var(--muted)]">Co-storage: {compoundData.coStorage}</p>
        )}
        {compoundData?.contaminationStrategy && (
          <p className="text-xs text-[var(--muted)]">Contamination: {compoundData.contaminationStrategy}</p>
        )}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-wider text-[var(--muted)]">Compound B (mix)</h3>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" checked={forceSolo} onChange={(e) => setForceSolo(e.target.checked)} className="accent-[var(--warning)]" />
            <span className="text-[var(--warning)]">Force Solo</span>
          </label>
        </div>
        {!forceSolo && (
          <>
            <select value={vialBId === "none" ? "none" : String(vialBId)} onChange={(e) => setVialBId(e.target.value === "none" ? "none" : Number(e.target.value))}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm">
              <option value="none">— Pin alone —</option>
              {reconstituted.filter((v) => v.id !== vialAId).map((v) => (
                <option key={v.id} value={v.id}>{getCompoundName(v.compoundId)} · {v.strengthMg}mg/{v.reconstitutedBacWaterMl}mL</option>
              ))}
            </select>
            {vialB && (
              <label className="block">
                <span className="text-xs text-[var(--muted)]">Dose B (mcg)</span>
                <input inputMode="numeric" value={doseB} onChange={(e) => setDoseB(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm" />
              </label>
            )}
            {calcB && <CalcRow calc={calcB} syringe={syringe} />}
          </>
        )}
      </section>

      {compat && !forceSolo && (
        <CompatCard verdict={compat.verdict} rationale={compat.rationale}
          a={getCompoundName(vialA!.compoundId)} b={getCompoundName(vialB!.compoundId)} />
      )}

      {(calcA || calcB) && (
        <div className={`rounded-xl border p-4 ${overCapacity ? "border-[var(--danger)]/50" : "border-[var(--accent)]/40"}`}>
          <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
            {vialB && !forceSolo ? "Draw in order shown (top → bottom)" : "Draw"}
          </p>
          {calcA && vialA && (
            <p className="text-sm mt-1">1. {getCompoundName(vialA.compoundId)} — {fmt(calcA.volumeMl, 3)} mL ({fmt(calcA.units, 1)} units)</p>
          )}
          {calcB && vialB && (
            <p className="text-sm">2. {getCompoundName(vialB.compoundId)} — {fmt(calcB.volumeMl, 3)} mL ({fmt(calcB.units, 1)} units)</p>
          )}
          <p className="mt-2 text-2xl font-semibold">
            {fmt(totalVol, 3)} mL
            <span className="text-base font-normal text-[var(--muted)]"> · {fmt(totalUnits, 1)} units</span>
          </p>
          <p className="text-xs text-[var(--muted)]">+ {SYRINGES[syringe].deadSpaceMl} mL dead space waste</p>
          {overCapacity && <p className="text-xs text-[var(--danger)] mt-1">Exceeds {SYRINGES[syringe].capacityMl} mL — split dose or use larger syringe.</p>}
        </div>
      )}
    </div>
  );
}

function CalcRow({ calc, syringe }: { calc: NonNullable<ReturnType<typeof calcDraw>>; syringe: SyringeKind }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      {[
        { label: "Conc.", value: `${fmt(calc.concentrationMcgPerMl, 0)} mcg/mL` },
        { label: "Volume", value: `${fmt(calc.volumeMl, 3)} mL` },
        { label: "Units", value: `${fmt(calc.units, 1)} u` },
      ].map((s) => (
        <div key={s.label} className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2">
          <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{s.label}</p>
          <p className="text-sm font-medium mt-0.5">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

function CompatCard({ verdict, rationale, a, b }: { verdict: string; rationale: string; a: string; b: string }) {
  const styles: Record<string, { border: string; text: string; label: string }> = {
    compatible: { border: "border-[var(--accent)]/40", text: "text-[var(--accent)]", label: "Compatible" },
    synergistic: { border: "border-[var(--accent)]", text: "text-[var(--accent)]", label: "Synergistic ✦" },
    caution: { border: "border-[var(--warning)]", text: "text-[var(--warning)]", label: "Caution" },
    incompatible: { border: "border-[var(--danger)]", text: "text-[var(--danger)]", label: "Incompatible — pin alone" },
  };
  const s = styles[verdict] ?? styles.compatible;
  return (
    <div className={`rounded-xl border ${s.border} bg-[var(--surface)] p-4`}>
      <p className={`text-xs font-semibold uppercase tracking-wider ${s.text}`}>{s.label}</p>
      <p className="mt-1 text-sm">{a} + {b}</p>
      <p className="mt-1.5 text-xs text-[var(--muted)]">{rationale}</p>
    </div>
  );
}

// ─── Protocol Screen (page entry point) ────────────────────────────────────────
export function ProtocolScreen() {
  const [tab, setTab] = useState<"protocols" | "planner" | "sites">("protocols");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Protocol</h1>
          <p className="text-sm text-[var(--muted)]">Cycles, planner & injection sites</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-0.5">
        {(["protocols", "planner", "sites"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium capitalize transition-colors ${
              tab === t ? "bg-[var(--accent)] text-[var(--accent-fg)]" : "text-[var(--muted)]"
            }`}
          >
            {t === "protocols" ? "Protocols" : t === "planner" ? "Planner" : "Sites"}
          </button>
        ))}
      </div>

      {tab === "protocols" && (
        <div className="space-y-4">
          <ProtocolList />
          <AddProtocolForm />
        </div>
      )}
      {tab === "planner" && <Planner />}
      {tab === "sites" && <SiteGridSection />}

      <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
        For research purposes only — not for human consumption.
      </p>
    </div>
  );
}

function SiteGridSection() {
  return <SiteGridComponent />;
}

// ─── Sites re-export ────────────────────────────────────────────────────────────
export { SiteGrid } from "./sites-client";
