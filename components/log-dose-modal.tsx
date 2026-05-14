"use client";

import { useEffect, useMemo, useState } from "react";
import { COMPOUNDS, getCompoundName } from "@/data/compounds";
import { INJECTION_SITES, type Region } from "@/data/injection-sites";
import { TIMING_LABELS } from "@/lib/protocol-utils";
import { useDoses, useInventory } from "@/lib/stores";

type Props = {
  open: boolean;
  onClose: () => void;
  // Pre-fill options
  compoundId?: string;
  vialId?: number;
  doseMcg?: number;
  timing?: string;
  protocolName?: string;
  syringeNumber?: number;
  totalSyringeUnits?: number;
  onSubmitOverride?: (payload: {
    compoundId: string;
    vialId?: number;
    doseMcg: number;
    siteId?: string;
    timing?: string;
    notes?: string;
    loggedAt: string;
  }) => Promise<void>;
  onSkipOverride?: (payload: {
    compoundId: string;
    doseMcg: number;
    notes?: string;
    loggedAt: string;
  }) => Promise<void>;
  confirmLabel?: string;
};

type Unit = "mcg" | "mg";
type BodyView = "front" | "back" | "none";

// Region groupings: front vs back
const FRONT_REGIONS: Region[] = [
  "shoulder", "delt", "chest", "pec", "bicep", "forearm", "upper-arm",
  "upper-abs", "mid-abs", "lower-abs", "oblique", "love-handle",
  "quad", "inner-thigh", "outer-thigh", "upper-thigh", "thigh", "adductor",
];
const BACK_REGIONS: Region[] = [
  "trap", "rear-delt", "tricep", "back-arm",
  "upper-back", "mid-back", "lower-back", "lat",
  "glute", "hamstring", "calf",
];

const REGION_LABEL_OVERRIDE: Partial<Record<Region, string>> = {
  "love-handle": "Love Handle",
  "inner-thigh": "Inner Thigh",
  "outer-thigh": "Outer Thigh",
  "upper-thigh": "Upper Thigh",
  "upper-arm": "Upper Arm",
  "back-arm": "Back Arm",
  "rear-delt": "Rear Delt",
};
const labelOf = (r: Region) =>
  REGION_LABEL_OVERRIDE[r] ?? r.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

export function LogDoseModal(props: Props) {
  if (!props.open) return null;
  const modalKey = [
    props.compoundId ?? "manual",
    props.vialId ?? "none",
    props.doseMcg ?? 250,
    props.timing ?? "",
    props.protocolName ?? "",
    props.syringeNumber ?? "0",
    props.totalSyringeUnits ?? "",
    props.confirmLabel ?? "",
  ].join("|");

  return <LogDoseModalInner key={modalKey} {...props} />;
}

function LogDoseModalInner(props: Props) {
  const {
    open,
    onClose,
    compoundId,
    vialId,
    doseMcg = 250,
    timing,
    protocolName,
    syringeNumber,
    totalSyringeUnits,
    onSubmitOverride,
    onSkipOverride,
    confirmLabel,
  } = props;
  const { vials, loaded: vLoaded, load: loadV } = useInventory();
  const logDose = useDoses((s) => s.log);
  const skipDose = useDoses((s) => s.skip);

  const [selectedCompoundId, setSelectedCompoundId] = useState(compoundId ?? COMPOUNDS[0].id);
  const [selectedVialId, setSelectedVialId] = useState<number | undefined>(vialId);
  const [unit, setUnit] = useState<Unit>("mcg");
  const [doseValue, setDoseValue] = useState(String(doseMcg));
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });
  const [bodyView, setBodyView] = useState<BodyView>("front");
  const [siteId, setSiteId] = useState<string | undefined>();
  const [selectedTiming, setSelectedTiming] = useState(timing ?? "");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open && !vLoaded) loadV();
  }, [open, vLoaded, loadV]);

  // Compute mcg equivalent
  const doseMcgValue = useMemo(() => {
    const n = Number(doseValue);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return unit === "mg" ? n * 1000 : n;
  }, [doseValue, unit]);

  // Compute units (insulin U-100 = 100 units / mL)
  const computedUnits = useMemo(() => {
    const v = vials.find((x) => x.id === selectedVialId);
    if (!v?.reconstitutedBacWaterMl) return null;
    const concentrationMcgPerMl = (v.strengthMg * 1000) / v.reconstitutedBacWaterMl;
    if (!concentrationMcgPerMl) return null;
    const volumeMl = doseMcgValue / concentrationMcgPerMl;
    return Math.round(volumeMl * 100 * 10) / 10; // 1 decimal
  }, [vials, selectedVialId, doseMcgValue]);

  const stepBy = (delta: number) => {
    const cur = Number(doseValue);
    const step = unit === "mg" ? 0.5 : 25;
    const next = Math.max(0, +(cur + delta * step).toFixed(unit === "mg" ? 2 : 0));
    setDoseValue(String(next));
  };

  const sites = bodyView === "front" ? FRONT_REGIONS : bodyView === "back" ? BACK_REGIONS : [];
  const compoundName = getCompoundName(selectedCompoundId);
  const compound = COMPOUNDS.find((c) => c.id === selectedCompoundId);

  const handleLog = async () => {
    if (doseMcgValue <= 0) return;
    const loggedAt = new Date(`${date}T${time}`).toISOString();
    const payload = {
      compoundId: selectedCompoundId,
      vialId: selectedVialId,
      doseMcg: doseMcgValue,
      siteId,
      timing: selectedTiming || undefined,
      notes: notes.trim() || undefined,
      loggedAt,
    };
    if (onSubmitOverride) await onSubmitOverride(payload);
    else {
      await logDose(payload);
    }
    onClose();
  };

  const handleSkip = async () => {
    const loggedAt = new Date(`${date}T${time}`).toISOString();
    const payload = {
      compoundId: selectedCompoundId,
      doseMcg: doseMcgValue,
      notes: notes.trim() || undefined,
      loggedAt,
    };
    if (onSkipOverride) await onSkipOverride(payload);
    else {
      await skipDose(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center px-2 sm:px-4">
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-[var(--border)] bg-[var(--surface)] max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)]">
          <button onClick={onClose}
            className="rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)] w-9 h-9 flex items-center justify-center">
            ✕
          </button>
          <h2 className="font-semibold">Log Syringe</h2>
          <span className="w-9 h-9 flex items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)]">i</span>
        </div>

        <div className="p-4 space-y-3">
          {/* Syringe summary card */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--accent)]">
                {syringeNumber ? `Syringe ${syringeNumber}` : "Manual Log"}
                {totalSyringeUnits ? (
                  <span className="ml-2 text-xs rounded-full bg-[var(--surface)] px-2 py-0.5 text-[var(--muted)] border border-[var(--border)]">
                    TOTAL {totalSyringeUnits}u
                  </span>
                ) : null}
              </p>
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium truncate">{protocolName ?? compoundName}</p>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => stepBy(-1)}
                  className="w-7 h-7 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--accent)]">−</button>
                <input value={doseValue} onChange={(e) => setDoseValue(e.target.value)} inputMode="decimal"
                  className="w-14 text-center rounded bg-[var(--surface)] border border-[var(--border)] py-1 text-sm" />
                <button onClick={() => stepBy(1)}
                  className="w-7 h-7 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--accent)]">+</button>
                <select value={unit} onChange={(e) => setUnit(e.target.value as Unit)}
                  className="rounded bg-[var(--surface)] border border-[var(--border)] px-2 py-1 text-xs">
                  <option value="mcg">mcg</option>
                  <option value="mg">mg</option>
                </select>
                {computedUnits !== null && (
                  <span className="rounded bg-[var(--accent)]/10 border border-[var(--accent)]/40 px-2 py-1 text-xs text-[var(--accent)] tabular-nums">
                    {computedUnits}u
                  </span>
                )}
              </div>
            </div>
            {compound?.aliases?.length ? (
              <p className="text-[10px] text-[var(--muted)]">{compound.aliases.join(", ")}</p>
            ) : null}
          </div>

          {/* Compound + Vial */}
          {!compoundId && (
            <div>
              <label className="text-xs text-[var(--muted)]">Compound</label>
              <select value={selectedCompoundId} onChange={(e) => setSelectedCompoundId(e.target.value)}
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm">
                {COMPOUNDS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {vials.filter((v) => v.compoundId === selectedCompoundId).length > 0 && (
            <div>
              <label className="text-xs text-[var(--muted)]">Vial</label>
              <select value={selectedVialId ?? ""} onChange={(e) => setSelectedVialId(e.target.value ? Number(e.target.value) : undefined)}
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm">
                <option value="">— None —</option>
                {vials.filter((v) => v.compoundId === selectedCompoundId).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.strengthMg}mg{v.reconstitutedBacWaterMl ? ` · ${v.reconstitutedBacWaterMl}mL BAC` : ""}
                    {v.brand ? ` · ${v.brand}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date & Time */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-[var(--muted)]">Date & Time</label>
              <span className="text-xs text-[var(--muted)]">{new Date(date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm" />
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm" />
            </div>
          </div>

          {/* Application Site */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-[var(--muted)]">Application Site</label>
              <span className="text-xs text-[var(--muted)]">
                {siteId ? INJECTION_SITES.find((s) => s.id === siteId)?.label : "None"}
              </span>
            </div>
            <div className="flex gap-1.5">
              {(["front", "back", "none"] as const).map((v) => (
                <button key={v} onClick={() => { setBodyView(v); if (v === "none") setSiteId(undefined); }}
                  className={`flex-1 rounded-md py-1.5 text-xs font-medium border ${
                    bodyView === v
                      ? "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--muted)]"
                  }`}
                >
                  {v === "front" ? "Front" : v === "back" ? "Back" : "None"}
                </button>
              ))}
              <button onClick={() => setBodyView(bodyView === "none" ? "front" : "none")}
                className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-[var(--accent)]">📖</button>
            </div>

            {/* Body diagram + L/R columns */}
            {bodyView !== "none" && (
              <div className="mt-2 grid grid-cols-[1fr_2fr_1fr] gap-1.5 items-stretch">
                <ul className="space-y-1">
                  {sites.map((r) => {
                    const id = `l-${r}`;
                    const active = siteId === id;
                    return (
                      <li key={id}>
                        <button onClick={() => setSiteId(id)}
                          className={`w-full rounded-full px-2 py-1 text-[11px] border ${
                            active
                              ? "bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)]"
                              : "border-[var(--border)] text-[var(--muted)] bg-[var(--surface-2)]"
                          }`}
                        >
                          L {labelOf(r)}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-center">
                  <BodySVG view={bodyView} highlightSite={siteId} />
                </div>
                <ul className="space-y-1">
                  {sites.map((r) => {
                    const id = `r-${r}`;
                    const active = siteId === id;
                    return (
                      <li key={id}>
                        <button onClick={() => setSiteId(id)}
                          className={`w-full rounded-full px-2 py-1 text-[11px] border ${
                            active
                              ? "bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)]"
                              : "border-[var(--border)] text-[var(--muted)] bg-[var(--surface-2)]"
                          }`}
                        >
                          R {labelOf(r)}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* Timing */}
          <div>
            <label className="text-xs text-[var(--muted)]">Timing</label>
            <select value={selectedTiming} onChange={(e) => setSelectedTiming(e.target.value)}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm">
              <option value="">— Any —</option>
              {Object.entries(TIMING_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-[var(--muted)]">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm resize-none" />
          </div>
        </div>

        {/* Footer actions (sticky) */}
        <div className="sticky bottom-0 flex gap-2 p-3 border-t border-[var(--border)] bg-[var(--surface)]">
          <button onClick={handleSkip}
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm font-medium text-[var(--muted)]">
            Skip
          </button>
          <button onClick={handleLog} disabled={doseMcgValue <= 0}
            className="flex-1 rounded-lg border border-[var(--accent)] bg-[var(--accent)]/10 px-3 py-2.5 text-sm font-medium text-[var(--accent)] disabled:opacity-40">
            {confirmLabel ?? "Log Dose"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BodySVG({ view, highlightSite }: { view: BodyView; highlightSite?: string }) {
  const highlightRegion = highlightSite?.split("-").slice(1).join("-") as Region | undefined;
  const side: "L" | "R" | undefined = highlightSite?.startsWith("l-") ? "L" : highlightSite?.startsWith("r-") ? "R" : undefined;

  // Anatomical position map (front view, left half — mirror for right)
  const positions: Partial<Record<Region, { x: number; y: number }>> = {
    shoulder: { x: 32, y: 19 }, delt: { x: 30, y: 22 }, "rear-delt": { x: 30, y: 22 },
    trap: { x: 44, y: 16 },
    pec: { x: 41, y: 26 }, chest: { x: 41, y: 26 },
    bicep: { x: 26, y: 30 }, tricep: { x: 26, y: 30 }, "upper-arm": { x: 25, y: 32 }, "back-arm": { x: 25, y: 32 },
    forearm: { x: 20, y: 42 },
    "upper-abs": { x: 44, y: 35 }, "mid-abs": { x: 44, y: 41 }, "lower-abs": { x: 44, y: 47 },
    "love-handle": { x: 38, y: 44 }, oblique: { x: 38, y: 42 },
    "upper-back": { x: 44, y: 26 }, "mid-back": { x: 44, y: 35 }, "lower-back": { x: 44, y: 46 },
    lat: { x: 34, y: 34 },
    glute: { x: 44, y: 54 },
    quad: { x: 41, y: 64 }, "inner-thigh": { x: 47, y: 62 }, "outer-thigh": { x: 36, y: 64 },
    "upper-thigh": { x: 41, y: 58 }, thigh: { x: 41, y: 64 }, adductor: { x: 47, y: 65 },
    hamstring: { x: 41, y: 67 },
    calf: { x: 41, y: 82 },
  };

  const pos = highlightRegion ? positions[highlightRegion] : null;
  const dotX = pos ? (side === "R" ? 100 - pos.x : pos.x) : null;
  const dotY = pos?.y ?? null;

  const strokeColor = "rgba(255,255,255,0.55)";
  const muscleColor = "rgba(255,255,255,0.18)";
  const isBack = view === "back";

  return (
    <svg viewBox="0 0 100 100" className="w-full h-auto max-h-72" preserveAspectRatio="xMidYMid meet">
      {/* Body outline */}
      <g fill="none" stroke={strokeColor} strokeWidth="0.6" strokeLinejoin="round" strokeLinecap="round">
        {/* Head */}
        <ellipse cx="50" cy="9" rx="5" ry="6" />
        {/* Neck */}
        <path d="M46 14 L46 17 M54 14 L54 17" />
        {/* Trapezius/Shoulders bridge */}
        <path d="M46 17 L38 19 L32 22 L29 25" />
        <path d="M54 17 L62 19 L68 22 L71 25" />
        {/* Outer arms */}
        <path d="M29 25 L25 32 L22 42 L19 50 L19 56 L22 56" />
        <path d="M71 25 L75 32 L78 42 L81 50 L81 56 L78 56" />
        {/* Inner arms */}
        <path d="M22 56 L26 42 L31 33" />
        <path d="M78 56 L74 42 L69 33" />
        {/* Torso sides */}
        <path d="M31 33 L34 44 L34 52 L36 56" />
        <path d="M69 33 L66 44 L66 52 L64 56" />
        {/* Hip / groin */}
        <path d="M36 56 L40 60 L50 62 L60 60 L64 56" />
        {/* Legs outer */}
        <path d="M40 60 L36 75 L34 88 L36 95 L42 95 L43 88 L44 75 L45 62" />
        <path d="M60 60 L64 75 L66 88 L64 95 L58 95 L57 88 L56 75 L55 62" />
        {/* Centerline (subtle) */}
        <line x1="50" y1="17" x2="50" y2="62" strokeDasharray="0.8,1.5" opacity="0.35" />
      </g>

      {/* Muscle groups — front view */}
      {!isBack && (
        <g fill="none" stroke={muscleColor} strokeWidth="0.4">
          {/* Pecs */}
          <path d="M38 22 Q44 25 49 25 Q42 31 36 30 Z" />
          <path d="M62 22 Q56 25 51 25 Q58 31 64 30 Z" />
          {/* Abs - 6-pack */}
          <line x1="44" y1="32" x2="56" y2="32" />
          <line x1="44" y1="36" x2="56" y2="36" />
          <line x1="44" y1="40" x2="56" y2="40" />
          <line x1="44" y1="44" x2="56" y2="44" />
          <line x1="50" y1="30" x2="50" y2="48" />
          {/* Biceps */}
          <ellipse cx="26" cy="32" rx="3" ry="5" />
          <ellipse cx="74" cy="32" rx="3" ry="5" />
          {/* Quads */}
          <ellipse cx="41" cy="70" rx="3" ry="9" />
          <ellipse cx="59" cy="70" rx="3" ry="9" />
        </g>
      )}

      {/* Muscle groups — back view */}
      {isBack && (
        <g fill="none" stroke={muscleColor} strokeWidth="0.4">
          {/* Traps */}
          <path d="M46 17 Q50 22 54 17 Q56 24 50 28 Q44 24 46 17 Z" />
          {/* Lats */}
          <path d="M34 28 Q36 38 38 44 L42 44 L42 30 Z" />
          <path d="M66 28 Q64 38 62 44 L58 44 L58 30 Z" />
          {/* Spine */}
          <line x1="50" y1="20" x2="50" y2="55" />
          {/* Glutes */}
          <ellipse cx="44" cy="56" rx="5" ry="3.5" />
          <ellipse cx="56" cy="56" rx="5" ry="3.5" />
          {/* Hamstrings */}
          <ellipse cx="41" cy="72" rx="3" ry="8" />
          <ellipse cx="59" cy="72" rx="3" ry="8" />
          {/* Calves */}
          <ellipse cx="40" cy="86" rx="2.5" ry="5" />
          <ellipse cx="60" cy="86" rx="2.5" ry="5" />
        </g>
      )}

      {/* Highlight ring + dot */}
      {dotX !== null && dotY !== null && view !== "none" && (
        <g>
          <circle cx={dotX} cy={dotY} r="4" fill="var(--accent)" opacity="0.2">
            <animate attributeName="r" values="3;5;3" dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.1;0.3" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <circle cx={dotX} cy={dotY} r="2.3" fill="var(--accent)" />
          <circle cx={dotX} cy={dotY} r="0.8" fill="var(--accent-fg)" />
        </g>
      )}

      {/* View label */}
      <text x="50" y="98" fontSize="2.8" fill="white" opacity="0.4" textAnchor="middle">
        {view === "back" ? "— Back view —" : "— Front view —"}
      </text>
    </svg>
  );
}
