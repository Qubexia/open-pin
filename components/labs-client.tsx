"use client";

import { useEffect, useMemo, useState } from "react";
import { useLabs } from "@/lib/stores";

const COMMON_MARKERS = [
  { name: "Total Testosterone", unit: "ng/dL", refMin: 300, refMax: 1000 },
  { name: "Free Testosterone", unit: "pg/mL", refMin: 50, refMax: 210 },
  { name: "Estradiol (E2)", unit: "pg/mL", refMin: 10, refMax: 40 },
  { name: "SHBG", unit: "nmol/L", refMin: 16, refMax: 55 },
  { name: "LH", unit: "mIU/mL", refMin: 1.7, refMax: 8.6 },
  { name: "FSH", unit: "mIU/mL", refMin: 1.5, refMax: 12.4 },
  { name: "IGF-1", unit: "ng/mL", refMin: 88, refMax: 246 },
  { name: "GH", unit: "ng/mL", refMin: 0, refMax: 3 },
  { name: "TSH", unit: "mIU/L", refMin: 0.4, refMax: 4.0 },
  { name: "Free T4", unit: "ng/dL", refMin: 0.8, refMax: 1.8 },
  { name: "DHEA-S", unit: "mcg/dL", refMin: 80, refMax: 560 },
  { name: "Cortisol (AM)", unit: "mcg/dL", refMin: 6, refMax: 23 },
  { name: "Prolactin", unit: "ng/mL", refMin: 2, refMax: 18 },
  { name: "Glucose (Fasting)", unit: "mg/dL", refMin: 70, refMax: 99 },
  { name: "HbA1c", unit: "%", refMin: 0, refMax: 5.7 },
  { name: "Insulin (Fasting)", unit: "mcIU/mL", refMin: 2, refMax: 19 },
  { name: "Total Cholesterol", unit: "mg/dL", refMin: 0, refMax: 200 },
  { name: "LDL", unit: "mg/dL", refMin: 0, refMax: 100 },
  { name: "HDL", unit: "mg/dL", refMin: 40, refMax: 999 },
  { name: "Triglycerides", unit: "mg/dL", refMin: 0, refMax: 150 },
  { name: "hsCRP", unit: "mg/L", refMin: 0, refMax: 1 },
  { name: "Hemoglobin", unit: "g/dL", refMin: 13.5, refMax: 17.5 },
  { name: "Hematocrit", unit: "%", refMin: 38.3, refMax: 48.6 },
  { name: "ALT", unit: "U/L", refMin: 0, refMax: 56 },
  { name: "AST", unit: "U/L", refMin: 0, refMax: 40 },
  { name: "Creatinine", unit: "mg/dL", refMin: 0.7, refMax: 1.3 },
  { name: "PSA", unit: "ng/mL", refMin: 0, refMax: 4 },
];

function statusOf(value: number, refMin?: number, refMax?: number): "low" | "high" | "normal" | "unknown" {
  if (refMin === undefined || refMax === undefined) return "unknown";
  if (value < refMin) return "low";
  if (value > refMax) return "high";
  return "normal";
}

const STATUS_STYLE = {
  low: "text-[var(--warning)] border-[var(--warning)]/40",
  high: "text-[var(--danger)] border-[var(--danger)]/40",
  normal: "text-[var(--accent)] border-[var(--accent)]/40",
  unknown: "text-[var(--muted)] border-[var(--border)]",
};

export function LabsScreen() {
  const { entries, loaded, load, add, remove } = useLabs();
  const [open, setOpen] = useState(false);
  const [marker, setMarker] = useState(COMMON_MARKERS[0].name);
  const [customMarker, setCustomMarker] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState(COMMON_MARKERS[0].unit);
  const [refMin, setRefMin] = useState<string>(String(COMMON_MARKERS[0].refMin ?? ""));
  const [refMax, setRefMax] = useState<string>(String(COMMON_MARKERS[0].refMax ?? ""));
  const [takenAt, setTakenAt] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => { if (!loaded) load(); }, [loaded, load]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof entries> = {};
    for (const e of entries) {
      (map[e.marker] ||= []).push(e);
    }
    return map;
  }, [entries]);

  const selectPreset = (name: string) => {
    setMarker(name);
    const preset = COMMON_MARKERS.find((m) => m.name === name);
    if (preset) {
      setUnit(preset.unit);
      setRefMin(String(preset.refMin ?? ""));
      setRefMax(String(preset.refMax ?? ""));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalMarker = marker === "__custom__" ? customMarker.trim() : marker;
    if (!finalMarker || !value) return;
    await add({
      marker: finalMarker,
      value: Number(value),
      unit,
      refMin: refMin ? Number(refMin) : undefined,
      refMax: refMax ? Number(refMax) : undefined,
      takenAt,
    });
    setValue("");
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Labs</h1>
          <p className="text-sm text-[var(--muted)]">Blood markers & biomarkers</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--accent-fg)]"
        >
          + Add
        </button>
      </div>

      {open && (
        <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs uppercase tracking-wider text-[var(--muted)]">New lab result</p>
          <div>
            <label className="text-xs text-[var(--muted)]">Marker</label>
            <select value={marker} onChange={(e) => selectPreset(e.target.value)}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm">
              {COMMON_MARKERS.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
              <option value="__custom__">Custom…</option>
            </select>
          </div>
          {marker === "__custom__" && (
            <input value={customMarker} onChange={(e) => setCustomMarker(e.target.value)}
              placeholder="Marker name" className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm" />
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--muted)]">Value</label>
              <input required inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)}
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)]">Unit</label>
              <input value={unit} onChange={(e) => setUnit(e.target.value)}
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-[var(--muted)]">Ref min</label>
              <input inputMode="decimal" value={refMin} onChange={(e) => setRefMin(e.target.value)}
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)]">Ref max</label>
              <input inputMode="decimal" value={refMax} onChange={(e) => setRefMax(e.target.value)}
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)]">Date</label>
              <input type="date" value={takenAt} onChange={(e) => setTakenAt(e.target.value)}
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--accent-fg)]">Save</button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)]">Cancel</button>
          </div>
        </form>
      )}

      {!loaded ? (
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
          <p className="text-sm text-[var(--muted)]">No lab results yet.</p>
          <p className="text-xs text-[var(--muted)] mt-1">Add your first result to start tracking trends.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([name, history]) => {
            const latest = history[0];
            const status = statusOf(latest.value, latest.refMin, latest.refMax);
            return (
              <div key={name} className={`rounded-xl border bg-[var(--surface)] p-4 ${STATUS_STYLE[status]}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{name}</p>
                      <span className={`text-[10px] uppercase tracking-wider rounded px-1.5 py-0.5 border ${STATUS_STYLE[status]}`}>
                        {status}
                      </span>
                    </div>
                    <p className="text-2xl font-semibold mt-1">
                      {latest.value} <span className="text-sm font-normal text-[var(--muted)]">{latest.unit}</span>
                    </p>
                    {latest.refMin !== undefined && latest.refMax !== undefined && (
                      <p className="text-xs text-[var(--muted)]">
                        Ref: {latest.refMin}–{latest.refMax} {latest.unit}
                      </p>
                    )}
                    <p className="text-xs text-[var(--muted)] mt-1">
                      {new Date(latest.takenAt).toLocaleDateString()} · {history.length} reading{history.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => latest.id && remove(latest.id)}
                    className="text-xs text-[var(--muted)] hover:text-[var(--danger)] ml-2"
                  >
                    ✕
                  </button>
                </div>

                {history.length > 1 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-[var(--muted)] uppercase tracking-wider">History</p>
                    {history.slice(0, 4).map((h) => {
                      const s = statusOf(h.value, h.refMin, h.refMax);
                      return (
                        <div key={h.id} className="flex justify-between text-xs">
                          <span className={STATUS_STYLE[s].split(" ")[0]}>{h.value} {h.unit}</span>
                          <span className="text-[var(--muted)]">{new Date(h.takenAt).toLocaleDateString()}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
