"use client";

import { useEffect, useMemo, useState } from "react";
import { INJECTION_SITES } from "@/data/injection-sites";
import { getCompoundName } from "@/data/compounds";
import { effectiveDose, FREQ_LABELS, isDue, TIMING_LABELS, daysRemaining, progressPct } from "@/lib/protocol-utils";
import { useDoses, useInventory, useProtocols } from "@/lib/stores";

const siteLabel = (id?: string) => INJECTION_SITES.find((s) => s.id === id)?.label ?? "—";

type Pace = "your" | "shared";

export function AdherenceScreen() {
  const { protocols, loaded, load } = useProtocols();
  const logDose = useDoses((s) => s.log);
  const skipDose = useDoses((s) => s.skip);
  const { vials, loaded: vLoaded, load: loadVials } = useInventory();
  const [pace, setPace] = useState<Pace>("your");
  const [done, setDone] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!loaded) load();
    if (!vLoaded) loadVials();
  }, [loaded, load, vLoaded, loadVials]);

  const due = useMemo(() => protocols.filter(isDue), [protocols]);
  const active = useMemo(() => protocols.filter((p) => p.active && daysRemaining(p) > 0), [protocols]);

  const getVial = (p: (typeof protocols)[0]) =>
    vials.find((v) => v.id === p.vialId) ?? vials.find((v) => v.compoundId === p.compoundId);

  const handleLog = async (p: (typeof protocols)[0]) => {
    if (!p.id) return;
    await logDose({ compoundId: p.compoundId, vialId: getVial(p)?.id, doseMcg: effectiveDose(p), timing: p.timing });
    setDone((s) => new Set([...s, p.id!]));
  };

  const handleSkip = async (p: (typeof protocols)[0]) => {
    if (!p.id) return;
    await skipDose({ compoundId: p.compoundId, doseMcg: effectiveDose(p) });
    setDone((s) => new Set([...s, p.id!]));
  };

  const logAll = async () => {
    for (const p of due) if (!done.has(p.id!)) await handleLog(p);
  };

  const skipAll = async () => {
    for (const p of due) if (!done.has(p.id!)) await handleSkip(p);
  };

  const todayDate = new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Adherence</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">{todayDate}</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-0.5">
          {(["your", "shared"] as Pace[]).map((p) => (
            <button
              key={p}
              onClick={() => setPace(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                pace === p ? "bg-[var(--accent)] text-[var(--accent-fg)]" : "text-[var(--muted)]"
              }`}
            >
              {p === "your" ? "Your pace" : "Shared pace"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Due today" value={String(due.length)} />
        <StatCard label="Active cycles" value={String(active.length)} />
        <StatCard
          label="Done"
          value={`${done.size}/${due.length}`}
          accent={done.size === due.length && due.length > 0}
        />
      </div>

      {/* Bulk actions */}
      {due.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={logAll}
            className="flex-1 rounded-lg bg-[var(--accent)] px-3 py-2.5 text-sm font-medium text-[var(--accent-fg)]"
          >
            Log All ({due.length - done.size})
          </button>
          <button
            onClick={skipAll}
            className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--muted)]"
          >
            Skip All
          </button>
        </div>
      )}

      {/* Due today list */}
      {!loaded ? (
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      ) : due.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
          <p className="text-sm text-[var(--muted)]">No doses scheduled today.</p>
          <p className="text-xs text-[var(--muted)] mt-1">Create a protocol in the Protocol tab.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {due.map((p) => {
            const logged = done.has(p.id!);
            const dose = effectiveDose(p);
            return (
              <li
                key={p.id}
                className={`rounded-xl border p-3 ${
                  logged
                    ? "border-[var(--border)] opacity-60"
                    : "border-[var(--accent)]/50 bg-[var(--accent)]/5"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {getCompoundName(p.compoundId)} · {dose} mcg
                      {p.timing ? ` · ${TIMING_LABELS[p.timing]}` : ""}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {FREQ_LABELS[p.frequency]} · {daysRemaining(p)}d left
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleLog(p)}
                      disabled={logged}
                      className="rounded-md border border-[var(--accent)]/50 px-2.5 py-1 text-xs font-medium text-[var(--accent)] disabled:opacity-40"
                    >
                      {logged ? "✓" : "Log"}
                    </button>
                    {!logged && (
                      <button
                        onClick={() => handleSkip(p)}
                        className="rounded-md border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--muted)]"
                      >
                        Skip
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-2 h-1 w-full rounded-full bg-[var(--surface-2)]">
                  <div
                    className="h-1 rounded-full bg-[var(--accent)]"
                    style={{ width: `${progressPct(p)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Quick log (no protocol) */}
      <QuickLogForm />

      {/* Recent */}
      <RecentDoses />

      {/* Site suggestion */}
      <SiteSuggestion />

      <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
        For research purposes only — not for human consumption.
      </p>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-center">
      <p className="text-xs text-[var(--muted)] uppercase tracking-wider">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${accent ? "text-[var(--accent)]" : ""}`}>{value}</p>
    </div>
  );
}

function QuickLogForm() {
  const { vials, loaded, load } = useInventory();
  const logDose = useDoses((s) => s.log);
  const [open, setOpen] = useState(false);
  const [vialId, setVialId] = useState<number | undefined>();
  const [doseMcg, setDoseMcg] = useState("250");
  const [siteId, setSiteId] = useState(INJECTION_SITES[0].id);
  const [timing, setTiming] = useState("");

  useEffect(() => { if (!loaded) load(); }, [loaded, load]);
  useEffect(() => { if (vials.length && !vialId) setVialId(vials[0].id); }, [vials, vialId]);

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={vials.length === 0}
        className="w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--muted)] disabled:opacity-40"
      >
        {vials.length === 0 ? "Add a vial in Inventory" : "+ Quick log (no protocol)"}
      </button>
    );

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const v = vials.find((x) => x.id === vialId);
        if (!v) return;
        await logDose({ compoundId: v.compoundId, vialId: v.id, doseMcg: Number(doseMcg), siteId, timing: timing || undefined });
        setOpen(false);
      }}
      className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
    >
      <p className="text-xs uppercase tracking-wider text-[var(--muted)]">Quick log</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[var(--muted)]">Vial</label>
          <select value={vialId ?? ""} onChange={(e) => setVialId(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2 text-sm">
            {vials.map((v) => <option key={v.id} value={v.id}>{getCompoundName(v.compoundId)} {v.strengthMg}mg</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-[var(--muted)]">Dose (mcg)</label>
          <input inputMode="numeric" value={doseMcg} onChange={(e) => setDoseMcg(e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2 text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[var(--muted)]">Site</label>
          <select value={siteId} onChange={(e) => setSiteId(e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2 text-sm">
            {INJECTION_SITES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-[var(--muted)]">Timing</label>
          <select value={timing} onChange={(e) => setTiming(e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2 text-sm">
            <option value="">— Any —</option>
            {Object.entries(TIMING_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="flex-1 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--accent-fg)]">Save</button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)]">Cancel</button>
      </div>
    </form>
  );
}

function RecentDoses() {
  const { doses, loaded, load } = useDoses();
  useEffect(() => { if (!loaded) load(); }, [loaded, load]);
  if (!loaded || doses.length === 0) return null;
  const recent = doses.filter((d) => !d.skipped).slice(0, 5);
  return (
    <section>
      <h2 className="mb-2 text-xs uppercase tracking-wider text-[var(--muted)]">Recent logs</h2>
      <ul className="space-y-1.5">
        {recent.map((d) => (
          <li key={d.id} className="flex justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">
            <span>{getCompoundName(d.compoundId)} · {d.doseMcg} mcg{d.timing ? ` · ${TIMING_LABELS[d.timing]}` : ""}</span>
            <span className="text-xs text-[var(--muted)]">
              {siteLabel(d.siteId)} · {new Date(d.loggedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SiteSuggestion() {
  const { doses, loaded, load } = useDoses();
  useEffect(() => { if (!loaded) load(); }, [loaded, load]);

  const suggested = useMemo(() => {
    const cutoff = Date.now() - 3 * 86_400_000;
    const recent = new Set(doses.filter((d) => d.siteId && new Date(d.loggedAt).getTime() > cutoff).map((d) => d.siteId!));
    return INJECTION_SITES.find((s) => !recent.has(s.id));
  }, [doses]);

  if (!suggested) return null;
  return (
    <div className="rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/5 p-3">
      <p className="text-xs uppercase tracking-wider text-[var(--accent)]">Suggested site</p>
      <p className="mt-1 font-medium">{suggested.label}</p>
      <p className="text-xs text-[var(--muted)]">Not used in last 3 days</p>
    </div>
  );
}
