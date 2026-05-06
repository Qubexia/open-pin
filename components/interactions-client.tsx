"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { COMPOUNDS, getCompoundName, SAFETY_FLAG_LABELS } from "@/data/compounds";
import { lookupCompat } from "@/data/interactions";
import { cumulativeOrganLoad, organLoadEntries, sharedSafetyFlags, loadColor } from "@/lib/organ-load";
import { useInventory, useProtocols } from "@/lib/stores";

type StackSource = "active" | "selection";

export function InteractionsScreen() {
  const { protocols, loaded: pLoaded, load: loadP } = useProtocols();
  const { vials, loaded: vLoaded, load: loadV } = useInventory();
  const [source, setSource] = useState<StackSource>("active");
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!pLoaded) loadP();
    if (!vLoaded) loadV();
  }, [pLoaded, loadP, vLoaded, loadV]);

  const activeStackIds = useMemo(() => {
    const ids = new Set<string>();
    for (const p of protocols) if (p.active) ids.add(p.compoundId);
    for (const v of vials) ids.add(v.compoundId);
    return Array.from(ids);
  }, [protocols, vials]);

  const stackIds = source === "active" ? activeStackIds : selected;
  const stack = stackIds.map((id) => COMPOUNDS.find((c) => c.id === id)).filter(Boolean) as typeof COMPOUNDS;

  const cumLoad = useMemo(() => cumulativeOrganLoad(stackIds), [stackIds]);
  const loadEntries = organLoadEntries(cumLoad);
  const maxScore = Math.max(1, ...loadEntries.map((e) => e.score));
  const flags = useMemo(() => sharedSafetyFlags(stackIds), [stackIds]);

  const pairMatrix = useMemo(() => {
    const result: { a: string; b: string; verdict: string; rationale: string }[] = [];
    for (let i = 0; i < stack.length; i++) {
      for (let j = i + 1; j < stack.length; j++) {
        const compat = lookupCompat(stack[i].id, stack[j].id);
        if (compat) result.push({ a: stack[i].id, b: stack[j].id, verdict: compat.verdict, rationale: compat.rationale });
      }
    }
    return result;
  }, [stack]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return [];
    return COMPOUNDS.filter((c) =>
      c.name.toLowerCase().includes(q) || c.aliases?.some((a) => a.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [query]);

  const toggle = (id: string) => {
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
    setQuery("");
  };

  return (
    <div className="space-y-4">
      <Link href="/more" className="inline-block text-xs rounded-md border border-[var(--border)] px-3 py-1.5 text-[var(--muted)]">
        ← Back to More
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Interactions</h1>

      <div className="flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-0.5">
        {(["active", "selection"] as const).map((s) => (
          <button key={s} onClick={() => setSource(s)}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
              source === s ? "bg-[var(--accent)] text-[var(--accent-fg)]" : "text-[var(--muted)]"
            }`}
          >
            {s === "active" ? `Active stack (${activeStackIds.length})` : `Custom (${selected.length})`}
          </button>
        ))}
      </div>

      {source === "selection" && (
        <div className="space-y-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search compounds…"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm" />
          {filtered.length > 0 && (
            <ul className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] max-h-48 overflow-auto">
              {filtered.map((c) => (
                <li key={c.id}>
                  <button onClick={() => toggle(c.id)} className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface)]">
                    {selected.includes(c.id) ? "✓ " : ""}{c.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selected.map((id) => (
                <button key={id} onClick={() => toggle(id)}
                  className="rounded-full px-2.5 py-1 text-xs border border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]">
                  {getCompoundName(id)} ✕
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <Section title={`My Stack (${stack.length})`} subtitle={`${pairMatrix.length} pair${pairMatrix.length !== 1 ? "s" : ""} with data`}>
        {stack.length === 0 ? (
          <Empty text={source === "active" ? "No active protocols or vials." : "Search above to add compounds."} />
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {stack.map((c) => (
              <span key={c.id} className="rounded-full px-2.5 py-0.5 text-xs border border-[var(--border)] bg-[var(--surface-2)]">
                {c.name}
              </span>
            ))}
          </div>
        )}
      </Section>

      {stack.length >= 6 && (
        <div className="rounded-xl border border-[var(--warning)]/50 bg-[var(--warning)]/10 p-3">
          <p className="text-xs uppercase tracking-wider text-[var(--warning)]">⚠ Large compound stack ({stack.length})</p>
          <p className="mt-1 text-xs text-[var(--muted)]">More compounds increase the chance of unfavorable interactions.</p>
        </div>
      )}

      <Section title="Pair Matrix">
        {pairMatrix.length === 0 ? (
          <Empty text="No documented pair interactions in stack." />
        ) : (
          <ul className="space-y-1.5">
            {pairMatrix.map((p, i) => (
              <li key={i} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-sm">{getCompoundName(p.a)} + {getCompoundName(p.b)}</p>
                  <VerdictBadge verdict={p.verdict} />
                </div>
                <p className="text-xs text-[var(--muted)] mt-1">{p.rationale}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Cumulative Organ Load" subtitle="Weighted sum of stack effects">
        {stack.length === 0 ? (
          <Empty text="Add compounds to see organ load." />
        ) : (
          <div className="space-y-1.5">
            {loadEntries.map((e) => (
              <OrganBar key={e.organ} label={e.label} score={e.score} max={maxScore} />
            ))}
            <p className="mt-2 text-[10px] text-[var(--muted)]">Heuristic 0–10 per compound, summed. Not medical guidance.</p>
          </div>
        )}
      </Section>

      <Section title="Shared Safety Flags" subtitle={`${flags.length} shared`}>
        {flags.length === 0 ? (
          <Empty text="No flags shared by 2+ compounds in stack." />
        ) : (
          <ul className="space-y-2">
            {flags.map((f) => (
              <li key={f.flag} className="rounded-lg border border-[var(--warning)]/40 bg-[var(--warning)]/10 px-3 py-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-[var(--warning)]">{SAFETY_FLAG_LABELS[f.flag]}</p>
                  <span className="text-xs text-[var(--warning)]">{f.compoundIds.length}×</span>
                </div>
                <p className="text-xs text-[var(--muted)] mt-1">{f.compoundIds.map(getCompoundName).join(", ")}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] text-center pt-2">
        For research purposes only — not medical advice.
      </p>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{title}</h2>
        {subtitle && <span className="text-xs text-[var(--muted)]">{subtitle}</span>}
      </div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-xs text-[var(--muted)] py-2">{text}</p>;
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const styles: Record<string, string> = {
    compatible: "text-[var(--accent)] border-[var(--accent)]/40",
    synergistic: "text-[var(--accent)] border-[var(--accent)]",
    caution: "text-[var(--warning)] border-[var(--warning)]/40",
    incompatible: "text-[var(--danger)] border-[var(--danger)]/40",
  };
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider rounded px-1.5 py-0.5 border shrink-0 ${styles[verdict] ?? styles.compatible}`}>
      {verdict}
    </span>
  );
}

function OrganBar({ label, score, max }: { label: string; score: number; max: number }) {
  const pct = Math.min(100, (score / max) * 100);
  const color = loadColor(score);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 text-[var(--muted)] shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="w-10 text-right tabular-nums" style={{ color }}>{score}</span>
    </div>
  );
}
