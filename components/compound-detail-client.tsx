"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { type Compound, COMPOUNDS, getCompoundName, SAFETY_FLAG_LABELS } from "@/data/compounds";
import { lookupCompat } from "@/data/interactions";
import { useAppSettings, useDoses, useInventory, useProtocols } from "@/lib/stores";
import { FREQ_LABELS, daysRemaining, effectiveDose, totalDuration } from "@/lib/protocol-utils";
import { cumulativeOrganLoad, organLoadEntries, loadColor } from "@/lib/organ-load";

type Tab = "details" | "dosing" | "schedule" | "interactions";

export function CompoundDetailClient({ compound }: { compound: Compound }) {
  const [tab, setTab] = useState<Tab>("details");
  const { vials, loaded: vLoaded, load: loadV } = useInventory();
  const { protocols, loaded: pLoaded, load: loadP } = useProtocols();
  const { doses, loaded: dLoaded, load: loadD } = useDoses();
  const { hydrate: hydrateAppSettings } = useAppSettings();


  useEffect(() => {
    if (!vLoaded) loadV();
    if (!pLoaded) loadP();
    if (!dLoaded) loadD();
    hydrateAppSettings();
  }, [vLoaded, loadV, pLoaded, loadP, dLoaded, loadD, hydrateAppSettings]);

  const linkedVials = vials.filter((v) => v.compoundId === compound.id);
  const linkedProtocols = protocols.filter((p) => p.compoundId === compound.id);
  const linkedDoses = useMemo(() => doses.filter((d) => d.compoundId === compound.id), [doses, compound.id]);
  const remainingMg = linkedVials.reduce((sum, v) => sum + v.strengthMg, 0);
  const totalDosesUsed = linkedDoses.filter((d) => !d.skipped).length;

  const upcoming = useMemo(() => {
    const out: { date: Date; dose: number; protocolName: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (const p of linkedProtocols.filter((p) => p.active && daysRemaining(p) > 0)) {
      const start = new Date(p.startDate);
      for (let i = 0; i < 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const elapsed = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
        if (elapsed < 0 || elapsed >= totalDuration(p)) continue;
        let due = false;
        switch (p.frequency) {
          case "daily": due = true; break;
          case "eod": due = elapsed % 2 === 0; break;
          case "3x-week": due = [1, 3, 5].includes(date.getDay()); break;
          case "weekly": due = date.getDay() === start.getDay(); break;
          case "every-x-days": due = p.frequencyXDays ? elapsed % p.frequencyXDays === 0 : false; break;
        }
        if (due) out.push({ date, dose: effectiveDose(p), protocolName: p.name });
      }
    }
    return out.slice(0, 8);
  }, [linkedProtocols]);

  const pairs = useMemo(() => {
    return COMPOUNDS
      .filter((c) => c.id !== compound.id)
      .map((c) => ({ compound: c, compat: lookupCompat(compound.id, c.id) }))
      .filter((p) => p.compat)
      .slice(0, 20);
  }, [compound.id]);

  const organLoad = compound.organLoad ? organLoadEntries(cumulativeOrganLoad([compound.id])) : [];
  const maxOrgan = Math.max(1, ...organLoad.map((e) => e.score));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/more/library" className="text-xs rounded-md border border-[var(--border)] px-3 py-1.5 text-[var(--muted)]">
          {"← Library"}
        </Link>
        <span className="text-xs text-[var(--muted)] uppercase tracking-wider">{compound.id}</span>
      </div>

      {/* Header */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h1 className="text-2xl font-semibold tracking-tight">{compound.name}</h1>
        {compound.aliases?.length ? (
          <p className="text-xs text-[var(--muted)] mt-0.5">{"Also"}: {compound.aliases.join(", ")}</p>
        ) : null}
        <div className="flex flex-wrap gap-1.5 mt-2">
          <Pill label={compound.category} variant="accent" />
          <Pill label={compound.route ?? "subq"} />
          {compound.isBlend && <Pill label={"Blend"} variant="accent" />}
          {compound.isSupplement && <Pill label={"Supplement"} />}
          {compound.pinAlone && <Pill label={"Pin alone"} variant="warning" />}
          {compound.fasted && <Pill label={"Fasted"} />}
        </div>
      </div>

      {/* Adjust Stock gauge */}
      {linkedVials.length > 0 && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs uppercase tracking-wider text-[var(--muted)] mb-2">{"Adjust Stock"}</p>
          <StockGauge totalMg={remainingMg} usedDoses={totalDosesUsed} />
          <div className="grid grid-cols-3 gap-2 mt-3">
            <Stat label={"Vials"} value={String(linkedVials.length)} />
            <Stat label={"Total mg"} value={remainingMg.toString()} />
            <Stat label={"Doses logged"} value={String(totalDosesUsed)} />
          </div>
        </section>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-0.5">
        {(["details", "dosing", "schedule", "interactions"] as const).map((t_id) => (
          <button key={t_id} onClick={() => setTab(t_id)}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium capitalize transition-colors ${
              tab === t_id ? "bg-[var(--accent)] text-[var(--accent-fg)]" : "text-[var(--muted)]"
            }`}
          >
            {t_id === "details" ? "Details" : t_id === "dosing" ? "Dosing" : t_id === "schedule" ? "Schedule" : "Interactions"}
          </button>
        ))}
      </div>

      {tab === "details" && (
        <div className="space-y-3">
          <InfoCard title="Compound">
            {compound.commonUses && (
              <Row label="Common uses" value={Array.isArray(compound.commonUses) ? compound.commonUses.join(", ") : compound.commonUses} />
            )}
            {compound.evidenceSummary && <p className="text-xs text-[var(--muted)]">{compound.evidenceSummary}</p>}
          </InfoCard>

          {(compound.halfLife || compound.peakTmax || compound.pharmacokinetics) && (
            <InfoCard title="Pharmacokinetics">
              {compound.halfLife && <Row label="Half-life" value={compound.halfLife} />}
              {compound.peakTmax && <Row label="Peak Tmax" value={compound.peakTmax} />}
              {compound.pharmacokinetics && <p className="text-xs text-[var(--muted)]">{compound.pharmacokinetics}</p>}
            </InfoCard>
          )}

          {(compound.storage || compound.coStorage || compound.vehicle) && (
            <InfoCard title="Storage & Form">
              {compound.storage && <Row label="Storage" value={compound.storage} />}
              {compound.coStorage && <Row label="Co-storage" value={compound.coStorage} />}
              {compound.vehicle && <Row label="Vehicle" value={compound.vehicle} />}
              {compound.diluentType && <Row label="Diluent" value={compound.diluentType} />}
              {compound.contaminationStrategy && <Row label="Contamination" value={compound.contaminationStrategy} warn />}
            </InfoCard>
          )}

          {compound.safetyFlags?.length ? (
            <InfoCard title="Safety Flags">
              <ul className="flex flex-wrap gap-1.5">
                {compound.safetyFlags.map((f) => (
                  <li key={f} className="rounded px-2 py-0.5 text-[10px] border border-[var(--warning)]/40 bg-[var(--warning)]/10 text-[var(--warning)]">
                    ⚠ {SAFETY_FLAG_LABELS[f]}
                  </li>
                ))}
              </ul>
            </InfoCard>
          ) : null}

          {organLoad.length > 0 && (
            <InfoCard title="Organ Load">
              <div className="space-y-1.5">
                {organLoad.map((e) => (
                  <div key={e.organ} className="flex items-center gap-2 text-xs">
                    <span className="w-24 text-[var(--muted)] truncate">{e.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                      <div className="h-2 rounded-full" style={{ width: `${(e.score / maxOrgan) * 100}%`, backgroundColor: loadColor(e.score) }} />
                    </div>
                    <span className="w-8 text-right tabular-nums" style={{ color: loadColor(e.score) }}>{e.score}</span>
                  </div>
                ))}
              </div>
            </InfoCard>
          )}
        </div>
      )}

      {tab === "dosing" && (
        <div className="space-y-3">
          <InfoCard title="Dosing">
            {compound.dosingAdvice && <p className="text-sm">{compound.dosingAdvice}</p>}
            {compound.defaultStrengthMg && <Row label="Default vial" value={`${compound.defaultStrengthMg} mg`} />}
            {compound.fasted && <Row label="Take" value={`Fasted${compound.fastedNote ? ` — ${compound.fastedNote}` : ""}`} warn />}
            {compound.pinAlone && <Row label="Solo" value={compound.mixNote ?? "Pin alone recommended"} warn />}
          </InfoCard>

          <InfoCard title="Linked Vials" subtitle={`${linkedVials.length} in inventory`}>
            {linkedVials.length === 0 ? (
              <Empty text="No vials of this compound in inventory." />
            ) : (
              <ul className="space-y-1.5">
                {linkedVials.map((v) => (
                  <li key={v.id} className="flex justify-between text-sm rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                    <span>{v.strengthMg} mg{v.brand ? ` · ${v.brand}` : ""}</span>
                    <span className="text-xs text-[var(--muted)]">
                      {v.reconstitutedBacWaterMl ? `${v.reconstitutedBacWaterMl} mL BAC` : "Lyophilized"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </InfoCard>
        </div>
      )}

      {tab === "schedule" && (
        <div className="space-y-3">
          <InfoCard title="Active Protocols">
            {linkedProtocols.length === 0 ? (
              <Empty text="No protocols use this compound. Create one in the Protocols tab." />
            ) : (
              <ul className="space-y-1.5">
                {linkedProtocols.map((p) => (
                  <li key={p.id} className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {effectiveDose(p)} mcg · {FREQ_LABELS[p.frequency]}
                        </p>
                      </div>
                      <span className="text-xs text-[var(--muted)]">{daysRemaining(p)}/{totalDuration(p)}d</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </InfoCard>

          <InfoCard title="Upcoming Doses" subtitle="Next 14 days">
            {upcoming.length === 0 ? (
              <Empty text="No upcoming doses scheduled." />
            ) : (
              <ul className="space-y-1">
                {upcoming.map((u, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span className="text-[var(--muted)]">
                      {u.date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    <span>{u.dose} mcg · {u.protocolName}</span>
                  </li>
                ))}
              </ul>
            )}
          </InfoCard>
        </div>
      )}

      {tab === "interactions" && (
        <div className="space-y-3">
          <InfoCard title="Documented pairs" subtitle={`${pairs.length} known`}>
            {pairs.length === 0 ? (
              <Empty text="No documented pair interactions for this compound." />
            ) : (
              <ul className="space-y-1.5">
                {pairs.map(({ compound: c, compat }) => (
                  <li key={c.id} className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">+ {c.name}</span>
                      <VerdictBadge verdict={compat!.verdict} />
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-1">{compat!.rationale}</p>
                  </li>
                ))}
              </ul>
            )}
          </InfoCard>

          {compound.avoid?.length ? (
            <InfoCard title="Avoid">
              <ul className="space-y-1 text-xs text-[var(--danger)]">
                {compound.avoid.map((a) => <li key={a}>• {a}</li>)}
              </ul>
            </InfoCard>
          ) : null}
        </div>
      )}

      <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] text-center pt-2">
        For research purposes only — not medical advice.
      </p>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function Pill({ label, variant }: { label: string; variant?: "accent" | "warning" }) {
  const cls = variant === "accent"
    ? "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]"
    : variant === "warning"
    ? "border-[var(--warning)]/40 bg-[var(--warning)]/10 text-[var(--warning)]"
    : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)]";
  return <span className={`text-[10px] uppercase tracking-wider rounded px-2 py-0.5 border capitalize ${cls}`}>{label}</span>;
}

function InfoCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-wider text-[var(--muted)]">{title}</h2>
        {subtitle && <span className="text-xs text-[var(--muted)]">{subtitle}</span>}
      </div>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-[var(--muted)] shrink-0 w-28">{label}</span>
      <span className={warn ? "text-[var(--warning)]" : ""}>{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2 text-center">
      <p className="text-base font-semibold">{value}</p>
      <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-xs text-[var(--muted)] py-1">{text}</p>;
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const styles: Record<string, string> = {
    compatible: "text-[var(--accent)] border-[var(--accent)]/40",
    synergistic: "text-[var(--accent)] border-[var(--accent)]",
    caution: "text-[var(--warning)] border-[var(--warning)]/40",
    incompatible: "text-[var(--danger)] border-[var(--danger)]/40",
  };
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider rounded px-1.5 py-0.5 border ${styles[verdict] ?? styles.compatible}`}>
      {verdict}
    </span>
  );
}

function StockGauge({ totalMg, usedDoses }: { totalMg: number; usedDoses: number }) {
  // Circular gauge showing remaining capacity (heuristic: assume 250mcg/dose)
  const totalDoses = Math.floor((totalMg * 1000) / 250);
  const remainingDoses = Math.max(0, totalDoses - usedDoses);
  const pct = totalDoses > 0 ? remainingDoses / totalDoses : 0;
  const radius = 60;
  const stroke = 8;
  const size = (radius + stroke) * 2;
  const center = radius + stroke;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - pct);
  const color = pct > 0.5 ? "var(--accent)" : pct > 0.2 ? "var(--warning)" : "var(--danger)";

  return (
    <div className="flex items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={center} cy={center} r={radius} stroke="var(--surface-2)" strokeWidth={stroke} fill="none" />
          <circle cx={center} cy={center} r={radius} stroke={color} strokeWidth={stroke} fill="none"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.3s" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold" style={{ color }}>{remainingDoses}</span>
          <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider">{"doses left"}</span>
        </div>
      </div>
    </div>
  );
}
