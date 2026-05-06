"use client";

import { useEffect, useMemo, useState } from "react";
import { COMMON_LAB_MARKERS } from "@/data/lab-markers";
import { getCompound, getCompoundName } from "@/data/compounds";
import { PRACTICES } from "@/data/best-practices";
import { effectiveDose, FREQ_LABELS, isDue, daysRemaining, totalDuration } from "@/lib/protocol-utils";
import type { DoseLog, FrequencyUnit, Protocol, ProtocolStep } from "@/lib/db";
import { useDoses, useProtocols, useLabs, useOrals } from "@/lib/stores";

type Filter = "all" | "compound" | "supplement";
type PillSlot = "AM" | "Mid" | "PM" | "Night";
type PillEntry = { compoundId: string; caps: number };
type PillSchedule = Record<string, Record<PillSlot, PillEntry[]>>;
type PhaseWindow = { id: string; title: string; subtitle: string; detail: string };
type SupplementLevel = { compoundId: string; label: string; detail: string; note: string };
type DisplayDose = Pick<DoseLog, "compoundId" | "doseMcg" | "loggedAt"> & { id?: number | string };

const PILL_BIN_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PILL_BIN_SLOTS: PillSlot[] = ["AM", "Mid", "PM", "Night"];
const PILL_BIN_KEY = "onepin_pill_bin";

function isoDateOffset(offsetDays: number, hour = 9, minute = 0, baseDate = new Date()) {
  const date = new Date(baseDate);
  date.setHours(hour, minute, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString();
}

function stableNumericId(seed: string) {
  return Array.from(seed).reduce((total, char, index) => total + char.charCodeAt(0) * (index + 1), 900000);
}

function buildReferenceProtocol(config: {
  id: string;
  name: string;
  compoundId: string;
  doseMcg: number;
  frequency: FrequencyUnit;
  durationDays: number;
  startOffsetDays: number;
  active: boolean;
  timing?: Protocol["timing"];
  steps?: ProtocolStep[];
  baseDate: Date;
}) {
  const protocol: Protocol = {
    id: stableNumericId(config.id),
    name: config.name,
    compoundId: config.compoundId,
    doseMcg: config.doseMcg,
    frequency: config.frequency,
    durationDays: config.durationDays,
    startDate: isoDateOffset(config.startOffsetDays, 9, 0, config.baseDate),
    active: config.active,
    timing: config.timing,
    steps: config.steps,
    createdAt: isoDateOffset(config.startOffsetDays - 1, 9, 0, config.baseDate),
  };

  return protocol;
}

function buildReferenceDashboard(todayKey: string) {
  const baseDate = new Date(`${todayKey}T09:00:00`);
  const dueProtocols = [
    buildReferenceProtocol({
      id: "due-1",
      name: "Morning GH Pulse",
      compoundId: "cjc-1295-no-dac",
      doseMcg: 150,
      frequency: "daily",
      durationDays: 42,
      startOffsetDays: -6,
      active: true,
      timing: "fasted",
      baseDate,
    }),
    buildReferenceProtocol({
      id: "due-2",
      name: "Systemic Repair",
      compoundId: "bpc-157",
      doseMcg: 350,
      frequency: "daily",
      durationDays: 28,
      startOffsetDays: -10,
      active: true,
      timing: "post-workout",
      baseDate,
    }),
  ];

  const pausedProtocols = [
    buildReferenceProtocol({
      id: "paused-1",
      name: "Copper Repair Hold",
      compoundId: "ghk-cu",
      doseMcg: 1000,
      frequency: "daily",
      durationDays: 30,
      startOffsetDays: -12,
      active: false,
      baseDate,
    }),
    buildReferenceProtocol({
      id: "paused-2",
      name: "Hexarelin Reset",
      compoundId: "hexarelin",
      doseMcg: 120,
      frequency: "daily",
      durationDays: 21,
      startOffsetDays: -8,
      active: false,
      timing: "pre-dinner",
      baseDate,
    }),
  ];

  const upcomingProtocols = [
    buildReferenceProtocol({
      id: "upcoming-1",
      name: "Visceral Fat Block",
      compoundId: "tesamorelin",
      doseMcg: 2000,
      frequency: "daily",
      durationDays: 35,
      startOffsetDays: 2,
      active: true,
      timing: "fasted",
      baseDate,
    }),
    buildReferenceProtocol({
      id: "upcoming-2",
      name: "Recovery Reload",
      compoundId: "tb-500",
      doseMcg: 2500,
      frequency: "weekly",
      durationDays: 42,
      startOffsetDays: 4,
      active: true,
      baseDate,
    }),
  ];

  const restDayProtocols = [
    buildReferenceProtocol({
      id: "rest-1",
      name: "Pulse Day Off",
      compoundId: "ipamorelin",
      doseMcg: 200,
      frequency: "eod",
      durationDays: 30,
      startOffsetDays: -1,
      active: true,
      timing: "fasted",
      baseDate,
    }),
    buildReferenceProtocol({
      id: "rest-2",
      name: "Weekend Tissue Support",
      compoundId: "tb-500",
      doseMcg: 2500,
      frequency: "weekly",
      durationDays: 56,
      startOffsetDays: -2,
      active: true,
      baseDate,
    }),
  ];

  const endedProtocols = [
    buildReferenceProtocol({
      id: "ended-1",
      name: "BPC Rehab Block",
      compoundId: "bpc-157",
      doseMcg: 300,
      frequency: "daily",
      durationDays: 21,
      startOffsetDays: -32,
      active: false,
      baseDate,
    }),
    buildReferenceProtocol({
      id: "ended-2",
      name: "Sleep Recovery Cycle",
      compoundId: "sermorelin",
      doseMcg: 250,
      frequency: "daily",
      durationDays: 14,
      startOffsetDays: -20,
      active: false,
      timing: "pre-dinner",
      baseDate,
    }),
  ];

  const completedLogs: DisplayDose[] = [
    { id: "log-1", compoundId: "cjc-1295-no-dac", doseMcg: 150, loggedAt: isoDateOffset(0, 7, 30, baseDate) },
    { id: "log-2", compoundId: "bpc-157", doseMcg: 350, loggedAt: isoDateOffset(0, 13, 15, baseDate) },
  ];

  const supplementEntries = [
    { compoundId: "vitamin-d", caps: 1 },
    { compoundId: "magnesium", caps: 2 },
    { compoundId: "urolithin-a", caps: 1 },
  ];

  const supplementLevels: SupplementLevel[] = [
    {
      compoundId: "vitamin-d",
      label: "AM · 1 serving",
      detail: "Vitamin D3",
      note: "Fat-soluble support with a meal.",
    },
    {
      compoundId: "magnesium",
      label: "Night · 2 caps",
      detail: "Magnesium",
      note: "Evening recovery and sleep support.",
    },
    {
      compoundId: "urolithin-a",
      label: "Mid · 1 serving",
      detail: "Urolithin A",
      note: "Longevity stack with daily steady-state dosing.",
    },
  ];

  const offPhaseNotes = PRACTICES.filter((item) => item.id === "cycle-planning" || item.id === "tolerance")
    .slice(0, 2)
    .map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: item.body[0],
      detail: item.body[1] ?? item.body[0],
    }));

  return {
    dueProtocols,
    pausedProtocols,
    upcomingProtocols,
    restDayProtocols,
    endedProtocols,
    completedLogs,
    supplementEntries,
    supplementLevels,
    offPhaseNotes,
    labMarkers: COMMON_LAB_MARKERS.slice(0, 4),
    calendarDoses: completedLogs,
  };
}

function createEmptyPillDay(): Record<PillSlot, PillEntry[]> {
  return { AM: [], Mid: [], PM: [], Night: [] };
}

function createEmptyPillSchedule(): PillSchedule {
  return Object.fromEntries(PILL_BIN_DAYS.map((day) => [day, createEmptyPillDay()])) as PillSchedule;
}

function loadPillSchedule(): PillSchedule {
  if (typeof window === "undefined") return createEmptyPillSchedule();

  try {
    const raw = window.localStorage.getItem(PILL_BIN_KEY);
    if (!raw) return createEmptyPillSchedule();
    return { ...createEmptyPillSchedule(), ...JSON.parse(raw) };
  } catch {
    return createEmptyPillSchedule();
  }
}

export function HomeScreen() {
  const { protocols, loaded: pLoaded, load: loadP } = useProtocols();
  const { doses, loaded: dLoaded, load: loadD } = useDoses();
  const { entries: labs, loaded: lLoaded, load: loadLabs } = useLabs();
  const { orals, loaded: oLoaded, load: loadOrals } = useOrals();
  const [filter, setFilter] = useState<Filter>("all");
  const [pillSchedule, setPillSchedule] = useState<PillSchedule>(() => createEmptyPillSchedule());

  useEffect(() => {
    if (!pLoaded) loadP();
    if (!dLoaded) loadD();
    if (!lLoaded) loadLabs();
    if (!oLoaded) loadOrals();
  }, [pLoaded, loadP, dLoaded, loadD, lLoaded, loadLabs, oLoaded, loadOrals]);

  useEffect(() => {
    const syncPillSchedule = () => setPillSchedule(loadPillSchedule());

    syncPillSchedule();
    window.addEventListener("focus", syncPillSchedule);
    window.addEventListener("storage", syncPillSchedule);

    return () => {
      window.removeEventListener("focus", syncPillSchedule);
      window.removeEventListener("storage", syncPillSchedule);
    };
  }, []);

  const today = new Date();
  const todayStr = today.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const todayKey = today.toISOString().slice(0, 10);
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();
  const todayDay = PILL_BIN_DAYS[today.getDay()];
  const todayPillSlots = pillSchedule[todayDay] ?? createEmptyPillDay();
  const referenceDashboard = useMemo(() => buildReferenceDashboard(todayKey), [todayKey]);

  const matchesFilter = (compoundId: string) => {
    if (filter === "all") return true;
    const compound = getCompound(compoundId);
    const isSupplement = Boolean(compound?.isSupplement || compound?.route === "oral");
    return filter === "supplement" ? isSupplement : !isSupplement;
  };

  const due = useMemo(
    () => protocols.filter((p) => p.active && new Date(p.startDate).getTime() <= todayStartMs && daysRemaining(p) > 0 && isDue(p)),
    [protocols, todayStartMs]
  );
  const paused = useMemo(
    () => protocols.filter((p) => !p.active && new Date(p.startDate).getTime() <= todayStartMs && daysRemaining(p) > 0),
    [protocols, todayStartMs]
  );
  const upcoming = useMemo(
    () => protocols.filter((p) => p.active && new Date(p.startDate).getTime() > todayStartMs && daysRemaining(p) > 0),
    [protocols, todayStartMs]
  );
  const restDays = useMemo(
    () => protocols.filter((p) => p.active && new Date(p.startDate).getTime() <= todayStartMs && daysRemaining(p) > 0 && !isDue(p)),
    [protocols, todayStartMs]
  );
  const completed = useMemo(
    () => protocols.filter((p) => new Date(p.startDate).getTime() <= todayStartMs && daysRemaining(p) === 0),
    [protocols, todayStartMs]
  );
  const completedToday = useMemo(() => {
    const todayDate = new Date().toDateString();
    return doses.filter((d) => !d.skipped && new Date(d.loggedAt).toDateString() === todayDate);
  }, [doses]);
  const supplementsScheduledToday = PILL_BIN_SLOTS.flatMap((slot) => todayPillSlots[slot]);

  const displayDue = (due.filter((p) => matchesFilter(p.compoundId)).length > 0 ? due : referenceDashboard.dueProtocols)
    .filter((p) => matchesFilter(p.compoundId));
  const displayPaused = (paused.filter((p) => matchesFilter(p.compoundId)).length > 0 ? paused : referenceDashboard.pausedProtocols)
    .filter((p) => matchesFilter(p.compoundId));
  const displayUpcoming = (upcoming.filter((p) => matchesFilter(p.compoundId)).length > 0 ? upcoming : referenceDashboard.upcomingProtocols)
    .filter((p) => matchesFilter(p.compoundId));
  const displayRestDays = (restDays.filter((p) => matchesFilter(p.compoundId)).length > 0 ? restDays : referenceDashboard.restDayProtocols)
    .filter((p) => matchesFilter(p.compoundId));
  const displayEnded = (completed.filter((p) => matchesFilter(p.compoundId)).length > 0 ? completed : referenceDashboard.endedProtocols)
    .filter((p) => matchesFilter(p.compoundId));
  const displayCompletedToday: DisplayDose[] = (completedToday.filter((d) => matchesFilter(d.compoundId)).length > 0
    ? completedToday
    : referenceDashboard.completedLogs).filter((d) => matchesFilter(d.compoundId));
  const displaySupplementEntries = supplementsScheduledToday.length > 0 ? supplementsScheduledToday : referenceDashboard.supplementEntries;
  const displaySupplementLevels = displaySupplementEntries.length > 0
    ? displaySupplementEntries.map((entry, index) => ({
        compoundId: entry.compoundId,
        label: `${PILL_BIN_SLOTS[index % PILL_BIN_SLOTS.length]} · ${entry.caps} ${entry.caps === 1 ? "cap" : "caps"}`,
        detail: getCompoundName(entry.compoundId),
        note: getCompound(entry.compoundId)?.halfLife ?? getCompound(entry.compoundId)?.dosingAdvice ?? "Scheduled from your current pill bin layout.",
      }))
    : referenceDashboard.supplementLevels;
  const pillBinSlotsFilled = PILL_BIN_SLOTS.filter((slot) => todayPillSlots[slot].length > 0).length || Math.min(PILL_BIN_SLOTS.length, displaySupplementLevels.length);
  const calendarDoses = doses.length > 0 ? doses : referenceDashboard.calendarDoses;
  const labSuggestions = COMMON_LAB_MARKERS.slice(0, 4);

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
      {displaySupplementEntries.length === 0 && filter !== "compound" && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-center">
          <p className="text-sm font-medium">No supplements scheduled today</p>
          <p className="text-xs text-[var(--muted)] mt-1">
            {orals.length === 0
              ? "Add supplements in Inventory, then place them in Pill Bin to track daily and weekly intake."
              : "You have supplements in inventory, but none are assigned to today's Pill Bin slots yet."}
          </p>
        </div>
      )}

      {/* Today's Overview */}
      <Section title="Today's Overview" subtitle={todayStr} defaultOpen>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Pill Bin Slots" value={`${pillBinSlotsFilled}/${PILL_BIN_SLOTS.length}`} />
          <Stat label="Completed" value={`${displayCompletedToday.length}/${Math.max(displayDue.length, 1)}`} />
        </div>
      </Section>

      {/* Paused */}
      <Section title="Paused" count={displayPaused.length}>
        <ProtocolList protocols={displayPaused} />
      </Section>

      {/* Upcoming Scheduled */}
      <Section title="Upcoming Scheduled" count={displayUpcoming.length}>
        <ProtocolList protocols={displayUpcoming} />
      </Section>

      {/* Calendar */}
      <Section title="Calendar">
        <CalendarMonth doses={calendarDoses} />
      </Section>

      {/* Completed today */}
      <Section title="Completed" count={displayCompletedToday.length}>
        <DoseList doses={displayCompletedToday} />
      </Section>

      {/* Rest Days */}
      <Section title="Rest Days" count={displayRestDays.length}>
        <ProtocolList protocols={displayRestDays} />
      </Section>

      {/* Off Phase */}
      <Section title="Off Phase" count={referenceDashboard.offPhaseNotes.length}>
        <PhaseWindowList items={referenceDashboard.offPhaseNotes} />
      </Section>

      {/* Supplement Levels */}
      <Section title="Supplement Levels" count={displaySupplementLevels.length}>
        <SupplementLevelList items={displaySupplementLevels} />
      </Section>

      {/* Labs */}
      <Section title="Labs" count={labs.length > 0 ? labs.length : labSuggestions.length}>
        {labs.length === 0 ? (
          <LabMarkerReferenceList markers={labSuggestions} />
        ) : (
          <ul className="space-y-1.5">
            {labs.slice(0, 4).map((lab) => (
              <li key={lab.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{lab.marker}</span>
                  <span className="text-xs text-[var(--muted)]">{new Date(lab.takenAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-[var(--muted)] mt-1">{lab.value} {lab.unit}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Ended Protocols */}
      <Section title="Ended Protocols" count={displayEnded.length}>
        <ProtocolList protocols={displayEnded} dimmed />
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
  if (protocols.length === 0) {
    return <Empty text="No matching entries for the current filter." />;
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return (
    <ul className="space-y-1.5">
      {protocols.map((p) => {
        const startDate = new Date(p.startDate);
        const startsInDays = Math.max(0, Math.ceil((startDate.getTime() - now.getTime()) / 86_400_000));
        const metaLabel = startsInDays > 0 ? `Starts in ${startsInDays}d` : `${daysRemaining(p)}/${totalDuration(p)}d`;

        return (
          <li key={p.id ?? p.name} className={`rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm ${dimmed ? "opacity-60" : ""}`}>
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{p.name}</p>
                <p className="text-xs text-[var(--muted)] truncate">
                  {getCompoundName(p.compoundId)} · {effectiveDose(p)} mcg · {FREQ_LABELS[p.frequency]}
                </p>
              </div>
              <span className="text-xs text-[var(--muted)] shrink-0">{metaLabel}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function DoseList({ doses }: { doses: DisplayDose[] }) {
  if (doses.length === 0) {
    return <Empty text="Nothing logged for the current filter yet." />;
  }

  return (
    <ul className="space-y-1.5">
      {doses.map((d) => (
        <li key={d.id ?? `${d.compoundId}-${d.loggedAt}`} className="flex justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm">
          <span>{getCompoundName(d.compoundId)} · {d.doseMcg} mcg</span>
          <span className="text-xs text-[var(--muted)]">
            {new Date(d.loggedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </li>
      ))}
    </ul>
  );
}

function PhaseWindowList({ items }: { items: PhaseWindow[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{item.title}</p>
              <p className="text-xs text-[var(--muted)] mt-1">{item.subtitle}</p>
            </div>
          </div>
          <p className="text-xs text-[var(--muted)] mt-2">{item.detail}</p>
        </li>
      ))}
    </ul>
  );
}

function SupplementLevelList({ items }: { items: SupplementLevel[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={`${item.compoundId}-${item.label}`} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{item.detail}</p>
              <p className="text-xs text-[var(--muted)] mt-1">{item.note}</p>
            </div>
            <span className="shrink-0 rounded border border-[var(--accent)]/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--accent)]">
              {item.label}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function LabMarkerReferenceList({
  markers,
}: {
  markers: Array<{ name: string; unit: string; refMin?: number; refMax?: number }>;
}) {
  return (
    <ul className="space-y-1.5">
      {markers.map((marker) => (
        <li key={marker.name} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium">{marker.name}</span>
            <span className="text-xs text-[var(--muted)]">{marker.unit}</span>
          </div>
          {(marker.refMin !== undefined || marker.refMax !== undefined) && (
            <p className="text-xs text-[var(--muted)] mt-1">
              Reference: {marker.refMin ?? "-"} to {marker.refMax ?? "-"} {marker.unit}
            </p>
          )}
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

  const doseDates = new Set<number>();
  for (const d of doses) {
    const dt = new Date(d.loggedAt);
    if (dt.getFullYear() === year && dt.getMonth() === month) doseDates.add(dt.getDate());
  }

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
