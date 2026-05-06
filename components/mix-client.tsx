"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { COMPOUNDS, getCompoundName, type Compound } from "@/data/compounds";
import { lookupCompat } from "@/data/interactions";

const VERDICT_STYLE: Record<string, { bg: string; border: string; text: string; label: string; symbol: string }> = {
  compatible: { bg: "bg-[var(--accent)]/10", border: "border-[var(--accent)]/40", text: "text-[var(--accent)]", label: "Compatible", symbol: "✓" },
  synergistic: { bg: "bg-[var(--accent)]/20", border: "border-[var(--accent)]", text: "text-[var(--accent)]", label: "Synergistic", symbol: "✦" },
  caution: { bg: "bg-[var(--warning)]/10", border: "border-[var(--warning)]/40", text: "text-[var(--warning)]", label: "Caution", symbol: "!" },
  incompatible: { bg: "bg-[var(--danger)]/10", border: "border-[var(--danger)]/40", text: "text-[var(--danger)]", label: "Incompatible", symbol: "✕" },
  unknown: { bg: "bg-[var(--surface-2)]", border: "border-[var(--border)]", text: "text-[var(--muted)]", label: "Unknown", symbol: "?" },
};

export function MixScreen() {
  const [primary, setPrimary] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const injectables = useMemo(() => COMPOUNDS.filter((c) => !c.isSupplement && c.route !== "oral"), []);
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return injectables.filter((c) =>
      !q || c.name.toLowerCase().includes(q) || c.aliases?.some((a) => a.toLowerCase().includes(q))
    );
  }, [query, injectables]);

  const primaryCompound = primary ? COMPOUNDS.find((c) => c.id === primary) : null;

  return (
    <div className="space-y-4">
      <Link href="/more" className="inline-block text-xs rounded-md border border-[var(--border)] px-3 py-1.5 text-[var(--muted)]">
        ← Back to More
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mix</h1>
        <p className="text-sm text-[var(--muted)]">Compatibility grid for injectables</p>
      </div>

      {/* Legend */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
        <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-2">Legend</p>
        <div className="flex flex-wrap gap-2 text-xs">
          {(["synergistic", "compatible", "caution", "incompatible", "unknown"] as const).map((v) => {
            const s = VERDICT_STYLE[v];
            return (
              <span key={v} className={`rounded px-2 py-0.5 border ${s.border} ${s.bg} ${s.text}`}>
                {s.symbol} {s.label}
              </span>
            );
          })}
        </div>
      </div>

      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search compound…"
        className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm" />

      {!primary ? (
        <CompoundList list={filtered} onSelect={setPrimary} />
      ) : primaryCompound ? (
        <PairView primary={primaryCompound} candidates={injectables.filter((c) => c.id !== primary)} onBack={() => setPrimary(null)} />
      ) : null}
    </div>
  );
}

function CompoundList({ list, onSelect }: { list: Compound[]; onSelect: (id: string) => void }) {
  return (
    <div>
      <p className="text-xs text-[var(--muted)] mb-2">{list.length} injectable{list.length !== 1 ? "s" : ""} · tap to see compatibility with all others</p>
      <ul className="grid grid-cols-2 gap-1.5">
        {list.map((c) => (
          <li key={c.id}>
            <button onClick={() => onSelect(c.id)}
              className="w-full text-left rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm hover:border-[var(--accent)]/40">
              <p className="font-medium truncate">{c.name}</p>
              <p className="text-[10px] text-[var(--muted)] capitalize">{c.category}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PairView({ primary, candidates, onBack }: { primary: Compound; candidates: Compound[]; onBack: () => void }) {
  const groups = useMemo(() => {
    const g: Record<string, { compound: Compound; rationale?: string }[]> = {
      synergistic: [], compatible: [], caution: [], incompatible: [], unknown: [],
    };
    for (const c of candidates) {
      const compat = lookupCompat(primary.id, c.id);
      const verdict = compat?.verdict ?? "unknown";
      g[verdict].push({ compound: c, rationale: compat?.rationale });
    }
    return g;
  }, [primary, candidates]);

  return (
    <div className="space-y-3">
      <button onClick={onBack} className="text-xs rounded-md border border-[var(--border)] px-3 py-1 text-[var(--muted)]">← All</button>
      <div className="rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/5 p-3">
        <p className="text-[10px] uppercase tracking-wider text-[var(--accent)]">Primary</p>
        <p className="font-medium">{primary.name}</p>
        <p className="text-xs text-[var(--muted)] capitalize">{primary.category} · {primary.route}</p>
        {primary.pinAlone && <p className="text-xs text-[var(--warning)] mt-1">⚠ Recommended pin alone</p>}
      </div>

      {(["synergistic", "compatible", "caution", "incompatible", "unknown"] as const).map((v) => {
        const s = VERDICT_STYLE[v];
        const items = groups[v];
        if (items.length === 0) return null;
        return (
          <section key={v} className={`rounded-xl border ${s.border} ${s.bg} p-3`}>
            <p className={`text-xs font-semibold uppercase tracking-wider ${s.text} mb-2`}>
              {s.symbol} {s.label} ({items.length})
            </p>
            <ul className="space-y-1.5">
              {items.map(({ compound, rationale }) => (
                <li key={compound.id} className="rounded-md bg-[var(--surface)] px-3 py-2">
                  <p className="text-sm">{compound.name}</p>
                  {rationale && <p className="text-xs text-[var(--muted)] mt-0.5">{rationale}</p>}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
