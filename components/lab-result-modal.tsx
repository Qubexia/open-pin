"use client";

import { useMemo, useRef, useState } from "react";
import { COMMON_LAB_MARKERS } from "@/data/lab-markers";
import { useLabs } from "@/lib/stores";

type Props = {
  open: boolean;
  onClose: () => void;
};

type ImportMode = "manual" | "csv" | "pdf" | "photo";

type ParsedCsvRow = {
  marker: string;
  value: number;
  unit: string;
  refMin?: number;
  refMax?: number;
  takenAt: string;
  notes?: string;
};

export function LabResultModal({ open, onClose }: Props) {
  const { add } = useLabs();
  const csvInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<ImportMode>("manual");
  const [marker, setMarker] = useState(COMMON_LAB_MARKERS[0].name);
  const [customMarker, setCustomMarker] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState(COMMON_LAB_MARKERS[0].unit);
  const [refMin, setRefMin] = useState<string>(String(COMMON_LAB_MARKERS[0].refMin ?? ""));
  const [refMax, setRefMax] = useState<string>(String(COMMON_LAB_MARKERS[0].refMax ?? ""));
  const [takenAt, setTakenAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [sourceFileName, setSourceFileName] = useState("");
  const [csvStatus, setCsvStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const title = useMemo(() => {
    if (mode === "csv") return "Import CSV";
    if (mode === "pdf") return "Add From PDF";
    if (mode === "photo") return "Add From Photo";
    return "Add Lab Result";
  }, [mode]);

  const sourceNote = sourceFileName ? `Source: ${sourceFileName}` : "";

  const selectPreset = (name: string) => {
    setMarker(name);
    const preset = COMMON_LAB_MARKERS.find((item) => item.name === name);
    if (!preset) return;
    setUnit(preset.unit);
    setRefMin(String(preset.refMin ?? ""));
    setRefMax(String(preset.refMax ?? ""));
  };

  const resetFileInput = (input: HTMLInputElement | null) => {
    if (input) input.value = "";
  };

  const parseCsvText = (text: string, fileName: string): ParsedCsvRow[] => {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((item) => item.trim().toLowerCase());
    const indexOf = (name: string) => headers.indexOf(name);
    const markerIdx = indexOf("marker");
    const valueIdx = indexOf("value");
    const unitIdx = indexOf("unit");
    const refMinIdx = indexOf("refmin");
    const refMaxIdx = indexOf("refmax");
    const takenAtIdx = indexOf("takenat");
    const notesIdx = indexOf("notes");

    if (markerIdx === -1 || valueIdx === -1 || unitIdx === -1) return [];

    return lines.slice(1).flatMap((line) => {
      const cells = line.split(",").map((item) => item.trim());
      const markerValue = cells[markerIdx];
      const numericValue = Number(cells[valueIdx]);
      const unitValue = cells[unitIdx];
      if (!markerValue || !unitValue || !Number.isFinite(numericValue)) return [];

      return [{
        marker: markerValue,
        value: numericValue,
        unit: unitValue,
        refMin: refMinIdx >= 0 && cells[refMinIdx] ? Number(cells[refMinIdx]) : undefined,
        refMax: refMaxIdx >= 0 && cells[refMaxIdx] ? Number(cells[refMaxIdx]) : undefined,
        takenAt: takenAtIdx >= 0 && cells[takenAtIdx] ? cells[takenAtIdx] : new Date().toISOString().slice(0, 10),
        notes: [notesIdx >= 0 ? cells[notesIdx] : "", `Imported from CSV: ${fileName}`].filter(Boolean).join(" · "),
      }];
    });
  };

  const handleCsvUpload = async (file?: File) => {
    if (!file) return;
    setSaving(true);
    setCsvStatus("");
    try {
      const text = await file.text();
      const parsed = parseCsvText(text, file.name);
      if (parsed.length === 0) {
        setCsvStatus("CSV must include marker,value,unit headers.");
        return;
      }

      for (const row of parsed) {
        await add(row);
      }

      setCsvStatus(`Imported ${parsed.length} lab result${parsed.length === 1 ? "" : "s"} from ${file.name}.`);
      resetFileInput(csvInputRef.current);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleSourceUpload = (file?: File, nextMode?: Extract<ImportMode, "pdf" | "photo">) => {
    if (!file) return;
    setSourceFileName(file.name);
    if (nextMode) setMode(nextMode);
  };

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalMarker = marker === "__custom__" ? customMarker.trim() : marker;
    const numericValue = Number(value);
    if (!finalMarker || !Number.isFinite(numericValue)) return;

    setSaving(true);
    try {
      await add({
        marker: finalMarker,
        value: numericValue,
        unit,
        refMin: refMin ? Number(refMin) : undefined,
        refMax: refMax ? Number(refMax) : undefined,
        takenAt,
        notes: [sourceNote, notes.trim()].filter(Boolean).join(" · ") || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-2 sm:items-center sm:px-4">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-[var(--border)] bg-[var(--surface)] sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)]"
          >
            ×
          </button>
          <h2 className="font-semibold">{title}</h2>
          <span className="w-9" />
        </div>

        <div className="space-y-3 p-4">
          <div className="grid grid-cols-4 gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-1">
            {(["manual", "csv", "pdf", "photo"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={`rounded-lg px-2 py-2 text-[11px] font-medium uppercase tracking-wider ${
                  mode === item ? "bg-[var(--accent)] text-[var(--accent-fg)]" : "text-[var(--muted)]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {mode === "csv" && (
            <section className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <p className="text-sm font-medium">Upload CSV results</p>
              <p className="text-xs text-[var(--muted)]">
                Expected headers: <code>marker,value,unit,refMin,refMax,takenAt,notes</code>
              </p>
              <button
                type="button"
                onClick={() => csvInputRef.current?.click()}
                className="w-full rounded-lg border border-[var(--accent)] bg-[var(--accent)]/10 px-3 py-2.5 text-sm font-medium text-[var(--accent)]"
              >
                Choose CSV File
              </button>
              {csvStatus && <p className="text-xs text-[var(--muted)]">{csvStatus}</p>}
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => void handleCsvUpload(e.target.files?.[0])}
              />
            </section>
          )}

          {(mode === "pdf" || mode === "photo") && (
            <section className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <p className="text-sm font-medium">{mode === "pdf" ? "Attach PDF report" : "Take or upload a photo"}</p>
              <p className="text-xs text-[var(--muted)]">
                Upload the source file, then enter the lab value below so it is saved with a reference to that file.
              </p>
              <button
                type="button"
                onClick={() => (mode === "pdf" ? pdfInputRef.current?.click() : photoInputRef.current?.click())}
                className="w-full rounded-lg border border-[var(--accent)] bg-[var(--accent)]/10 px-3 py-2.5 text-sm font-medium text-[var(--accent)]"
              >
                {mode === "pdf" ? "Choose PDF" : "Take Photo / Upload Image"}
              </button>
              {sourceFileName && (
                <p className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--muted)]">
                  Attached: {sourceFileName}
                </p>
              )}
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleSourceUpload(e.target.files?.[0], "pdf")}
              />
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleSourceUpload(e.target.files?.[0], "photo")}
              />
            </section>
          )}

          {mode !== "csv" && (
            <form onSubmit={handleManualSave} className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-xs uppercase tracking-wider text-[var(--muted)]">Lab Result Details</p>
              <div>
                <label className="text-xs text-[var(--muted)]">Marker</label>
                <select
                  value={marker}
                  onChange={(e) => selectPreset(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
                >
                  {COMMON_LAB_MARKERS.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                  <option value="__custom__">Custom...</option>
                </select>
              </div>
              {marker === "__custom__" && (
                <input
                  value={customMarker}
                  onChange={(e) => setCustomMarker(e.target.value)}
                  placeholder="Marker name"
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
                />
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--muted)]">Value</label>
                  <input
                    required
                    inputMode="decimal"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--muted)]">Unit</label>
                  <input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-[var(--muted)]">Ref min</label>
                  <input
                    inputMode="decimal"
                    value={refMin}
                    onChange={(e) => setRefMin(e.target.value)}
                    className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--muted)]">Ref max</label>
                  <input
                    inputMode="decimal"
                    value={refMax}
                    onChange={(e) => setRefMax(e.target.value)}
                    className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--muted)]">Date</label>
                  <input
                    type="date"
                    value={takenAt}
                    onChange={(e) => setTakenAt(e.target.value)}
                    className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
                  />
                </div>
              </div>
              {(mode === "pdf" || mode === "photo") && (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--muted)]">
                  {sourceFileName ? `Attached source: ${sourceFileName}` : "No source file attached yet."}
                </div>
              )}
              <div>
                <label className="text-xs text-[var(--muted)]">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full resize-none rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--accent-fg)] disabled:opacity-50"
                >
                  Save Result
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)]"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
