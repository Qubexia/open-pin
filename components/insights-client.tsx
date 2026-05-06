"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCompoundName } from "@/data/compounds";
import { useDoses, useLabs, useProtocols } from "@/lib/stores";

type Range = { start: Date; end: Date; label: string };

function buildWeeks(count: number): Range[] {
  const ranges: Range[] = [];
  const now = new Date();
  // align to Sunday
  const day = now.getDay();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - day);
  sunday.setHours(0, 0, 0, 0);

  for (let i = 0; i < count; i++) {
    const start = new Date(sunday);
    start.setDate(sunday.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    ranges.push({ start, end, label: `${fmt(start)} - ${fmt(end)}` });
  }
  return ranges;
}

const KEY = "onepin_insights";

type StoredInsight = { rangeKey: string; report: string; generatedAt: string };

function loadInsights(): Record<string, StoredInsight> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}"); }
  catch { return {}; }
}

function saveInsight(rangeKey: string, report: string) {
  const all = loadInsights();
  all[rangeKey] = { rangeKey, report, generatedAt: new Date().toISOString() };
  localStorage.setItem(KEY, JSON.stringify(all));
}

function buildLocalReport(args: {
  range: Range;
  doses: any[];
  protocols: any[];
  labs: any[];
}) {
  const { range, doses, protocols, labs } = args;
  const inRange = doses.filter((d) => {
    const t = new Date(d.loggedAt).getTime();
    return t >= range.start.getTime() && t <= range.end.getTime();
  });
  const byCompound = new Map<string, number>();
  let skipped = 0;
  for (const d of inRange) {
    if (d.skipped) { skipped++; continue; }
    byCompound.set(d.compoundId, (byCompound.get(d.compoundId) ?? 0) + 1);
  }
  const activeProtocols = protocols.filter((p) => p.active);
  const labCount = labs.filter((l) => {
    const t = new Date(l.takenAt).getTime();
    return t >= range.start.getTime() && t <= range.end.getTime();
  }).length;

  const lines: string[] = [];
  lines.push(`Range: ${range.label}`);
  lines.push(`Doses logged: ${inRange.length - skipped} · Skipped: ${skipped}`);
  lines.push(`Active protocols: ${activeProtocols.length}`);
  lines.push(`Lab entries: ${labCount}`);
  lines.push("");
  if (byCompound.size > 0) {
    lines.push("By compound:");
    Array.from(byCompound.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([id, count]) => lines.push(`  • ${getCompoundName(id)}: ${count}`));
  } else {
    lines.push("No compound activity in this period.");
  }
  return lines.join("\n");
}

export function InsightsScreen() {
  const { doses, loaded: dLoaded, load: loadD } = useDoses();
  const { protocols, loaded: pLoaded, load: loadP } = useProtocols();
  const { entries: labs, loaded: lLoaded, load: loadL } = useLabs();
  const ranges = useMemo(() => buildWeeks(12), []);
  const [stored, setStored] = useState<Record<string, StoredInsight>>({});

  useEffect(() => {
    if (!dLoaded) loadD();
    if (!pLoaded) loadP();
    if (!lLoaded) loadL();
    setStored(loadInsights());
  }, [dLoaded, loadD, pLoaded, loadP, lLoaded, loadL]);

  const generate = (range: Range) => {
    const key = range.label;
    const report = buildLocalReport({ range, doses, protocols, labs });
    saveInsight(key, report);
    setStored(loadInsights());
  };

  const apiKey = typeof window !== "undefined" ? localStorage.getItem("onepin_claude_key") : null;

  return (
    <div className="space-y-4">
      <Link href="/more" className="inline-block text-xs rounded-md border border-[var(--border)] px-3 py-1.5 text-[var(--muted)]">
        ← Back to More
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Insight Reports</h1>
        <p className="text-sm text-[var(--muted)]">
          {apiKey
            ? "Using rule-based analysis. AI integration is local-first."
            : "Add an API key in Settings for AI-powered analysis. Fallback: rule-based summary."}
        </p>
      </div>

      <ul className="space-y-2">
        {ranges.map((r) => {
          const insight = stored[r.label];
          return (
            <li key={r.label} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium">{r.label}</p>
                <span className="text-xs text-[var(--muted)]">
                  {insight ? `Generated ${new Date(insight.generatedAt).toLocaleDateString()}` : "Ready to generate"}
                </span>
              </div>
              {insight ? (
                <pre className="whitespace-pre-wrap text-xs text-[var(--muted)] bg-[var(--surface-2)] rounded-md p-3 font-mono">
                  {insight.report}
                </pre>
              ) : null}
              <button onClick={() => generate(r)}
                className="w-full rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-2 text-xs font-medium text-[var(--accent)]">
                {insight ? "Regenerate Insight" : "Generate Insight"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
