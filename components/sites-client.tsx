"use client";

import { useEffect, useMemo } from "react";
import { INJECTION_SITES } from "@/data/injection-sites";
import { useDoses } from "@/lib/stores";

const RECENCY_DAYS = 3;
const MS_DAY = 86_400_000;

export function SiteGrid() {
  const { doses, loaded, load } = useDoses();

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  const recentSiteMap = useMemo(() => {
    const map: Record<string, number> = {};
    const cutoff = Date.now() - RECENCY_DAYS * MS_DAY;
    for (const d of doses) {
      if (!d.siteId) continue;
      if (new Date(d.loggedAt).getTime() < cutoff) continue;
      map[d.siteId] = (map[d.siteId] ?? 0) + 1;
    }
    return map;
  }, [doses]);

  const lastSiteId = doses.find((d) => d.siteId)?.siteId;

  const suggested = useMemo(() => {
    const usedRecently = new Set(Object.keys(recentSiteMap));
    return INJECTION_SITES.find((s) => !usedRecently.has(s.id))?.id;
  }, [recentSiteMap]);

  const left = INJECTION_SITES.filter((s) => s.side === "L");
  const right = INJECTION_SITES.filter((s) => s.side === "R");

  const SiteItem = ({ s }: { s: (typeof INJECTION_SITES)[0] }) => {
    const uses = recentSiteMap[s.id] ?? 0;
    const isLast = s.id === lastSiteId;
    const isSuggested = s.id === suggested;

    let bg = "bg-[var(--surface)]";
    let textColor = "";
    let badge = null;

    if (isLast) {
      bg = "bg-[var(--danger)]/15";
      textColor = "text-[var(--danger)]";
      badge = <span className="text-[9px] uppercase tracking-wider text-[var(--danger)]">last</span>;
    } else if (uses >= 2) {
      bg = "bg-[var(--warning)]/10";
      textColor = "text-[var(--warning)]";
    } else if (uses === 1) {
      bg = "bg-[var(--surface-2)]";
      textColor = "text-[var(--muted)]";
    } else if (isSuggested) {
      bg = "bg-[var(--accent)]/10";
      textColor = "text-[var(--accent)]";
      badge = <span className="text-[9px] uppercase tracking-wider text-[var(--accent)]">next</span>;
    }

    return (
      <li className={`${bg} rounded-md border border-[var(--border)] px-2.5 py-2 flex items-center justify-between`}>
        <span className={`text-sm ${textColor}`}>{s.label}</span>
        {badge}
      </li>
    );
  };

  return (
    <div>
      {suggested && (
        <div className="mb-4 rounded-xl border border-[var(--accent)]/50 bg-[var(--accent)]/5 p-3">
          <p className="text-xs uppercase tracking-wider text-[var(--accent)]">Suggested next</p>
          <p className="mt-1 font-medium">
            {INJECTION_SITES.find((s) => s.id === suggested)?.label ?? "—"}
          </p>
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[var(--accent)]/30" /> Suggested
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[var(--surface-2)]" /> Used once
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[var(--warning)]/20" /> Used 2+×
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[var(--danger)]/20" /> Last used
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <section>
          <h2 className="mb-2 text-xs uppercase tracking-wider text-[var(--muted)]">Left</h2>
          <ul className="space-y-1.5">
            {left.map((s) => <SiteItem key={s.id} s={s} />)}
          </ul>
        </section>
        <section>
          <h2 className="mb-2 text-xs uppercase tracking-wider text-[var(--muted)]">Right</h2>
          <ul className="space-y-1.5">
            {right.map((s) => <SiteItem key={s.id} s={s} />)}
          </ul>
        </section>
      </div>
    </div>
  );
}
