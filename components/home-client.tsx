"use client";

import { useEffect, useMemo, useState } from "react";
import { getCompoundName } from "@/data/compounds";
import { effectiveDose, FREQ_LABELS, isDue, daysRemaining, totalDuration } from "@/lib/protocol-utils";
import type { Protocol } from "@/lib/db";
import { useDoses, useProtocols, useLabs, useOrals } from "@/lib/stores";

type Filter = "all" | "compound" | "supplement";

export function HomeScreen() {
  const { protocols, loaded: pLoaded, load: loadP } = useProtocols();
  const { doses, loaded: dLoaded, load: loadD } = useDoses();
  const { entries: labs, loaded: lLoaded, load: loadLabs } = useLabs();
  const { orals, loaded: oLoaded, load: loadOrals } = useOrals();
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (!pLoaded) loadP();
    if (!dLoaded) loadD();
    if (!lLoaded) loadLabs();
    if (!oLoaded) loadOrals();
  }, [pLoaded, loadP, dLoaded, loadD, lLoaded, loadLabs, oLoaded, loadOrals]);

  const today = new Date();
  const todayStr = today.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  const due = useMemo(() => protocols.filter(isDue), [protocols]);
  const paused = useMemo(() => protocols.filter((p) => !p.active), [protocols]);
  const upcoming = useMemo(
    () => protocols.filter((p) => p.active && !isDue(p) && daysRemaining(p) > 0),
    [protocols]
  );
  const completed = useMemo(() => protocols.filter((p) => daysRemaining(p) === 0), [protocols]);
  const completedToday = useMemo(() => {
    const todayDate = new Date().toDateString();
    return doses.filter((d) => !d.skipped && new Date(d.loggedAt).toDateString() === todayDate);
  }, [doses]);

  return (
    <div className="space-y-3">
      {/* Filter pills */}
      <div className="flex justify-center gap-2">
        {(["compound", "supplement"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(filter === f ? "all" : f)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium border transition-colors ${
              filter === f
                ? "bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)]"
                : "border-[var(--border)] text-[var(--muted)]"
            }`}
          >
            {f === "compound" ? "💉 Compound" : "💊 Supplement"}
          </button>
        ))}
      </div>

      {/* No supplements scheduled banner */}
      {orals.length === 0 && filter !== "compound" && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-center">
          <p className="text-sm font-medium">No supplements scheduled today</p>
          <p className="text-xs text-[var(--muted)] mt-1">
            Add via Pill Bin to track daily/weekly supplements. Dose deductions still happen when you log.
          </p>
        </div>
      )}

      {/* Today's Overview */}
      <Section title="Today's Overview" subtitle={todayStr} defaultOpen>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Pill Bin Slots" value="0" />
          <Stat label="Completed" value={`${completedToday.length}/${due.length}`} />
        </div>
      </Section>

      {/* Paused */}
      <Section title="Paused" count={paused.length}>
        {paused.length === 0 ? (
          <Empty text="No paused protocols. Protocols you've paused will appear here." />
        ) : (
          <ProtocolList protocols={paused} />
        )}
      </Section>

      {/* Upcoming Scheduled */}
      <Section title="Upcoming Scheduled" count={upcoming.length}>
        {upcoming.length === 0 ? (
          <Empty text="No upcoming protocols scheduled. Active protocols with a future start date will appear here." />
        ) : (
          <ProtocolList protocols={upcoming} />
        )}
      </Section>

      {/* Calendar */}
      <Section title="Calendar">
        <CalendarMonth doses={doses} />
      </Section>

      {/* Completed today */}
      <Section title="Completed" count={completedToday.length}>
        {completedToday.length === 0 ? (
          <Empty text="Nothing logged yet today. Logged doses will appear here." />
        ) : (
          <ul className="space-y-1.5">
            {completedToday.map((d) => (
              <li key={d.id} className="flex justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm">
                <span>{getCompoundName(d.compoundId)} · {d.doseMcg} mcg</span>
                <span className="text-xs text-[var(--muted)]">
                  {new Date(d.loggedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Rest Days */}
      <Section title="Rest Days">
        <Empty text="No rest day protocols today. Frequency gaps will appear here." />
      </Section>

      {/* Off Phase */}
      <Section title="Off Phase">
        <Empty text="No protocols in an off phase right now. Protocols in their break period will appear here." />
      </Section>

      {/* Supplement Levels */}
      <Section title="Supplement Levels">
        <Empty text="No active protocols with pharmacokinetic data. Add a protocol to see levels here." />
      </Section>

      {/* Labs */}
      <Section title="Labs" count={labs.length}>
        {labs.length === 0 ? (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center">
            <p className="text-2xl">🩸</p>
            <p className="text-sm mt-1">No lab results yet</p>
            <p className="text-xs text-[var(--muted)] mt-1">Add blood work to track biomarkers and trends</p>
            <a href="/more/labs" className="mt-3 inline-block rounded-lg border border-[var(--accent)]/40 px-3 py-1.5 text-xs text-[var(--accent)]">
              Add Lab Results
            </a>
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]">{labs.length} lab result{labs.length !== 1 ? "s" : ""} tracked.</p>
        )}
      </Section>

      {/* Ended Protocols */}
      <Section title="Ended Protocols" count={completed.length}>
        {completed.length === 0 ? (
          <Empty text="No ended protocols in this window." />
        ) : (
          <ProtocolList protocols={completed} dimmed />
        )}
      </Section>

      <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] text-center pt-2">
        For research purposes only — not for human consumption.
      </p>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function Section({
  title, subtitle, count, defaultOpen = false, children,
}: {
  title: string; subtitle?: string; count?: number; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">{title}</span>
          {typeof count === "number" && count > 0 && (
            <span className="text-xs rounded px-1.5 py-0.5 border border-[var(--border)] text-[var(--muted)]">{count}</span>
          )}
          {subtitle && <span className="text-xs text-[var(--muted)]">· {subtitle}</span>}
        </div>
        <span className="text-[var(--muted)] text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 text-center">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-[var(--muted)] mt-0.5">{label}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-xs text-[var(--muted)] text-center py-2">{text}</p>;
}

function ProtocolList({ protocols, dimmed }: { protocols: Protocol[]; dimmed?: boolean }) {
  return (
    <ul className="space-y-1.5">
      {protocols.map((p) => (
        <li key={p.id} className={`rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm ${dimmed ? "opacity-60" : ""}`}>
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{p.name}</p>
              <p className="text-xs text-[var(--muted)] truncate">
                {getCompoundName(p.compoundId)} · {effectiveDose(p)} mcg · {FREQ_LABELS[p.frequency]}
              </p>
            </div>
            <span className="text-xs text-[var(--muted)] shrink-0">{daysRemaining(p)}/{totalDuration(p)}d</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CalendarMonth({ doses }: { doses: { loggedAt: string }[] }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayDate = today.getDate();

  const doseDates = useMemo(() => {
    const set = new Set<number>();
    for (const d of doses) {
      const dt = new Date(d.loggedAt);
      if (dt.getFullYear() === year && dt.getMonth() === month) set.add(dt.getDate());
    }
    return set;
  }, [doses, year, month]);

  const monthName = today.toLocaleString(undefined, { month: "long", year: "numeric" });
  const cells: (number | null)[] = Array.from({ length: firstDay }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[var(--accent)] rounded px-2 py-0.5 border border-[var(--accent)]/40">Today · {today.toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}</span>
        <span className="text-xs text-[var(--muted)]">{monthName}</span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-[var(--muted)] uppercase tracking-wider">{d}</div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const isToday = d === todayDate;
          const hasDose = doseDates.has(d);
          return (
            <div
              key={i}
              className={`aspect-square rounded flex items-center justify-center text-xs ${
                isToday
                  ? "bg-[var(--accent)] text-[var(--accent-fg)] font-semibold"
                  : hasDose
                  ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                  : "text-[var(--muted)]"
              }`}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}
