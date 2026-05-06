"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { COMPOUNDS, getCompoundName } from "@/data/compounds";
import { useOrals } from "@/lib/stores";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SLOTS = ["AM", "Mid", "PM", "Night"] as const;
type Slot = (typeof SLOTS)[number];

type PillEntry = { compoundId: string; caps: number };
type PillSchedule = Record<string, Record<Slot, PillEntry[]>>; // day → slot → entries

const KEY = "onepin_pill_bin";
const LAYOUTS_KEY = "onepin_pill_layouts";

function emptyDay(): Record<Slot, PillEntry[]> {
  return { AM: [], Mid: [], PM: [], Night: [] };
}
function emptySchedule(): PillSchedule {
  const s: PillSchedule = {};
  for (const d of DAYS) s[d] = emptyDay();
  return s;
}
function loadSchedule(): PillSchedule {
  if (typeof window === "undefined") return emptySchedule();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptySchedule();
    return { ...emptySchedule(), ...JSON.parse(raw) };
  } catch { return emptySchedule(); }
}
function saveSchedule(s: PillSchedule) {
  localStorage.setItem(KEY, JSON.stringify(s));
}
function loadLayouts(): Record<string, PillSchedule> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(LAYOUTS_KEY) ?? "{}"); }
  catch { return {}; }
}
function saveLayouts(l: Record<string, PillSchedule>) {
  localStorage.setItem(LAYOUTS_KEY, JSON.stringify(l));
}

export function PillBinScreen() {
  const { orals, loaded, load } = useOrals();
  const [schedule, setSchedule] = useState<PillSchedule>(emptySchedule());
  const [autoSync, setAutoSync] = useState(false);
  const [layouts, setLayouts] = useState<Record<string, PillSchedule>>({});
  const [editing, setEditing] = useState<{ day: string; slot: Slot } | null>(null);

  useEffect(() => {
    if (!loaded) load();
    setSchedule(loadSchedule());
    setLayouts(loadLayouts());
  }, [loaded, load]);

  const update = (next: PillSchedule) => {
    setSchedule(next);
    saveSchedule(next);
  };

  const addEntry = (day: string, slot: Slot, entry: PillEntry) => {
    const next = { ...schedule, [day]: { ...schedule[day], [slot]: [...schedule[day][slot], entry] } };
    if (autoSync) {
      for (const d of DAYS) next[d] = { ...next[d], [slot]: [...next[day][slot]] };
    }
    update(next);
  };

  const removeEntry = (day: string, slot: Slot, idx: number) => {
    const next = { ...schedule, [day]: { ...schedule[day], [slot]: schedule[day][slot].filter((_, i) => i !== idx) } };
    if (autoSync) {
      for (const d of DAYS) next[d] = { ...next[d], [slot]: [...next[day][slot]] };
    }
    update(next);
  };

  const resetWeek = () => {
    if (!confirm("Reset all pill slots for the week?")) return;
    update(emptySchedule());
  };

  const saveLayout = () => {
    const name = prompt("Layout name?");
    if (!name) return;
    const next = { ...layouts, [name]: schedule };
    setLayouts(next);
    saveLayouts(next);
  };

  const loadLayout = (name: string) => {
    if (!confirm(`Replace current week with "${name}" layout?`)) return;
    update(layouts[name]);
  };

  const totalCaps = DAYS.reduce((sum, d) =>
    sum + SLOTS.reduce((s, slot) => s + schedule[d][slot].reduce((c, e) => c + e.caps, 0), 0)
  , 0);

  const orals_with_compounds = orals.length > 0;

  return (
    <div className="space-y-4">
      <Link href="/more" className="inline-block text-xs rounded-md border border-[var(--border)] px-3 py-1.5 text-[var(--muted)]">
        ← Back to More
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pill Bin</h1>
        <p className="text-sm text-[var(--muted)]">Weekly pill organizer · {totalCaps} caps planned</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2">
        <button onClick={saveLayout}
          className="rounded-md border border-[var(--accent)]/40 px-3 py-1.5 text-xs text-[var(--accent)]">
          Save Layout
        </button>
        {Object.keys(layouts).length > 0 && (
          <select onChange={(e) => e.target.value && loadLayout(e.target.value)} value=""
            className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-xs text-[var(--muted)]">
            <option value="">Load Layout…</option>
            {Object.keys(layouts).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        )}
        <button onClick={resetWeek}
          className="rounded-md border border-[var(--danger)]/40 px-3 py-1.5 text-xs text-[var(--danger)]">
          Reset Week
        </button>
        <label className="flex items-center gap-2 text-xs cursor-pointer rounded-md border border-[var(--border)] px-3 py-1.5">
          <input type="checkbox" checked={autoSync} onChange={(e) => setAutoSync(e.target.checked)}
            className="accent-[var(--accent)]" />
          <span className={autoSync ? "text-[var(--accent)]" : "text-[var(--muted)]"}>Auto-sync all days</span>
        </label>
      </div>

      {!orals_with_compounds && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
          <p className="text-3xl">💊</p>
          <p className="font-medium mt-1">No supplements in inventory yet</p>
          <p className="text-xs text-[var(--muted)] mt-1">
            Add supplements via Inventory → Orals to populate the pill bin.
          </p>
          <Link href="/inventory" className="mt-3 inline-block rounded-lg border border-[var(--accent)]/40 px-3 py-1.5 text-xs text-[var(--accent)]">
            Go to Inventory
          </Link>
        </div>
      )}

      {/* Weekly grid */}
      <div className="space-y-2">
        {DAYS.map((day) => (
          <details key={day} open={day === DAYS[new Date().getDay()]}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <summary className="px-4 py-2.5 cursor-pointer font-medium flex items-center justify-between">
              <span>{day}</span>
              <span className="text-xs text-[var(--muted)]">
                {SLOTS.reduce((c, s) => c + schedule[day][s].reduce((sum, e) => sum + e.caps, 0), 0)} caps
              </span>
            </summary>
            <div className="px-4 pb-4 grid grid-cols-2 gap-2">
              {SLOTS.map((slot) => (
                <div key={slot} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{slot}</span>
                    <button onClick={() => setEditing({ day, slot })}
                      className="text-[var(--accent)] text-xs">+ Add</button>
                  </div>
                  <ul className="space-y-1">
                    {schedule[day][slot].map((e, i) => (
                      <li key={i} className="flex items-center justify-between text-xs">
                        <span className="truncate">{getCompoundName(e.compoundId)} ×{e.caps}</span>
                        <button onClick={() => removeEntry(day, slot, i)}
                          className="text-[var(--muted)] hover:text-[var(--danger)] ml-1">✕</button>
                      </li>
                    ))}
                    {schedule[day][slot].length === 0 && (
                      <li className="text-xs text-[var(--muted)]">—</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>

      {editing && orals_with_compounds && (
        <AddEntryDialog
          orals={orals}
          onCancel={() => setEditing(null)}
          onAdd={(entry) => { addEntry(editing.day, editing.slot, entry); setEditing(null); }}
          dayLabel={editing.day}
          slotLabel={editing.slot}
        />
      )}
    </div>
  );
}

function AddEntryDialog({
  orals, onCancel, onAdd, dayLabel, slotLabel,
}: {
  orals: { compoundId: string }[];
  onCancel: () => void;
  onAdd: (e: PillEntry) => void;
  dayLabel: string; slotLabel: Slot;
}) {
  const [compoundId, setCompoundId] = useState(orals[0]?.compoundId ?? COMPOUNDS[0].id);
  const [caps, setCaps] = useState("1");
  const inventory = orals.map((o) => o.compoundId);
  const list = COMPOUNDS.filter((c) => inventory.includes(c.id));

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
        <p className="text-xs uppercase tracking-wider text-[var(--muted)]">{dayLabel} · {slotLabel}</p>
        <select value={compoundId} onChange={(e) => setCompoundId(e.target.value)}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm">
          {list.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div>
          <label className="text-xs text-[var(--muted)]">Caps</label>
          <input inputMode="numeric" value={caps} onChange={(e) => setCaps(e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => { const n = Math.max(1, Number(caps) || 1); onAdd({ compoundId, caps: n }); }}
            className="flex-1 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--accent-fg)]">
            Add
          </button>
          <button onClick={onCancel}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)]">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
