"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/db";
import { HouseholdSettings } from "@/components/household-settings";
import {
  type AccentPreset,
  type LandingPage,
  useAppSettings,
} from "@/lib/stores";
import type { DoseLog, LabMarker, OralSupplement, Protocol, Vial } from "@/lib/db";

const BACKUP_KEY = "onepin_backups";
const MAX_BACKUPS = 5;

type Backup = { ts: string; label: string; data: string };

const ACCENT_OPTIONS: Array<{ value: AccentPreset; label: string; swatch: string }> = [
  { value: "green", label: "Green", swatch: "#22c55e" },
  { value: "blue", label: "Blue", swatch: "#38bdf8" },
  { value: "amber", label: "Amber", swatch: "#f59e0b" },
  { value: "rose", label: "Rose", swatch: "#f43f5e" },
];

const LANDING_OPTIONS: Array<{ value: LandingPage; label: string }> = [
  { value: "/home", label: "Home" },
  { value: "/protocols", label: "Protocols" },
  { value: "/inventory", label: "Inventory" },
  { value: "/calc", label: "Calc" },
  { value: "/more", label: "More" },
];

function getBackups(): Backup[] {
  try {
    return JSON.parse(localStorage.getItem(BACKUP_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveBackup(data: string) {
  const backups = getBackups();
  const entry: Backup = {
    ts: new Date().toISOString(),
    label: new Date().toLocaleString(),
    data,
  };
  backups.unshift(entry);
  if (backups.length > MAX_BACKUPS) backups.length = MAX_BACKUPS;
  localStorage.setItem(BACKUP_KEY, JSON.stringify(backups));
}

async function exportAll(): Promise<string> {
  if (!db) return "{}";
  const [vials, doses, protocols, labs, orals] = await Promise.all([
    db.vials.toArray(),
    db.doses.toArray(),
    db.protocols.toArray(),
    db.labs.toArray(),
    db.orals.toArray(),
  ]);
  return JSON.stringify({ vials, doses, protocols, labs, orals, exportedAt: new Date().toISOString() }, null, 2);
}

async function importAll(json: string) {
  if (!db) return;
  const data = JSON.parse(json) as {
    vials?: Vial[];
    doses?: DoseLog[];
    protocols?: Protocol[];
    labs?: LabMarker[];
    orals?: OralSupplement[];
  };
  const stripId = <T extends { id?: number }>(row: T): Omit<T, "id"> => {
    const clone = { ...row };
    delete clone.id;
    return clone;
  };
  await db.transaction("rw", [db.vials, db.doses, db.protocols, db.labs, db.orals], async () => {
    if (data.vials) { await db.vials.clear(); await db.vials.bulkAdd(data.vials.map(stripId)); }
    if (data.doses) { await db.doses.clear(); await db.doses.bulkAdd(data.doses.map(stripId)); }
    if (data.protocols) { await db.protocols.clear(); await db.protocols.bulkAdd(data.protocols.map(stripId)); }
    if (data.labs) { await db.labs.clear(); await db.labs.bulkAdd(data.labs.map(stripId)); }
    if (data.orals) { await db.orals.clear(); await db.orals.bulkAdd(data.orals.map(stripId)); }
  });
}

export function SettingsScreen() {
  const {
    theme,
    accent,
    defaultLanding,
    labsPreviewCount,
    unitSystem,
    density,
    motion,
    showAdherence,
    showInventory,
    showProtocols,
    showLabs,
    showCalc,
    householdMode,
    householdMembers,
    hydrate,
    update,
    reset,
  } = useAppSettings();
  const [backups, setBackups] = useState<Backup[]>(() => (typeof window !== "undefined" ? getBackups() : []));
  const [status, setStatus] = useState("");
  const [apiKey, setApiKey] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem("onepin_claude_key") ?? "") : ""
  );

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const summary = useMemo(
    () => `${theme} theme · ${accent} accent · ${density} density`,
    [theme, accent, density]
  );

  const handleExport = async () => {
    const json = await exportAll();
    saveBackup(json);
    setBackups(getBackups());
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `onepin-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("Exported successfully.");
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const json = ev.target?.result as string;
        await importAll(json);
        saveBackup(json);
        setBackups(getBackups());
        setStatus("Import successful. Reload to see changes.");
      } catch {
        setStatus("Import failed - invalid file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleRestoreBackup = async (backup: Backup) => {
    try {
      await importAll(backup.data);
      setStatus(`Restored from ${backup.label}`);
    } catch {
      setStatus("Restore failed.");
    }
  };

  const handleSaveKey = () => {
    localStorage.setItem("onepin_claude_key", apiKey.trim());
    setStatus("API key saved.");
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-[var(--muted)]">Control the look, feel, and defaults across most of OnePin.</p>
        <p className="text-xs text-[var(--muted)]">{summary}</p>
      </header>

      {status && (
        <div className="ui-card rounded-lg border-[var(--accent)]/40 bg-[var(--accent)]/5 px-3 py-2 text-sm text-[var(--accent)]">
          {status}
        </div>
      )}

      <section className="ui-card space-y-4 p-4">
        <div>
          <h2 className="text-xs uppercase tracking-wider text-[var(--muted)]">Appearance & Layout</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">These settings affect most screens immediately.</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-[var(--muted)]">Theme</label>
          <div className="ui-segment grid grid-cols-2 gap-1">
            <ToggleButton active={theme === "dark"} onClick={() => update({ theme: "dark" })}>Dark</ToggleButton>
            <ToggleButton active={theme === "light"} onClick={() => update({ theme: "light" })}>Light</ToggleButton>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-[var(--muted)]">Accent Color</label>
          <div className="grid grid-cols-2 gap-2">
            {ACCENT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => update({ accent: option.value })}
                className={`ui-card flex items-center gap-3 px-3 py-2.5 text-sm ${
                  accent === option.value ? "border-[var(--accent)]/55" : ""
                }`}
              >
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: option.swatch }} />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-[var(--muted)]">Display Density</label>
          <div className="ui-segment grid grid-cols-2 gap-1">
            <ToggleButton active={density === "comfortable"} onClick={() => update({ density: "comfortable" })}>
              Comfortable
            </ToggleButton>
            <ToggleButton active={density === "compact"} onClick={() => update({ density: "compact" })}>
              Compact
            </ToggleButton>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-[var(--muted)]">Animations</label>
          <div className="ui-segment grid grid-cols-2 gap-1">
            <ToggleButton active={motion === "full"} onClick={() => update({ motion: "full" })}>
              Full Motion
            </ToggleButton>
            <ToggleButton active={motion === "reduced"} onClick={() => update({ motion: "reduced" })}>
              Reduced
            </ToggleButton>
          </div>
        </div>
      </section>

      <section className="ui-card space-y-4 p-4">
        <div>
          <h2 className="text-xs uppercase tracking-wider text-[var(--muted)]">Units</h2>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-[var(--muted)]">Unit System</label>
          <div className="ui-segment grid grid-cols-2 gap-1">
            <ToggleButton active={unitSystem === "metric"} onClick={() => update({ unitSystem: "metric" })}>Metric (ml/mg)</ToggleButton>
            <ToggleButton active={unitSystem === "imperial"} onClick={() => update({ unitSystem: "imperial" })}>Imperial (oz/gr)</ToggleButton>
          </div>
        </div>
      </section>

      <section className="ui-card space-y-4 p-4">
        <div>
          <h2 className="text-xs uppercase tracking-wider text-[var(--muted)]">App Modules</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">Enable or disable specific features of the application.</p>
        </div>

        <div className="space-y-3">
          <FeatureToggle label="Adherence Tracking" active={showAdherence} onToggle={(v) => update({ showAdherence: v })} />
          <FeatureToggle label="Inventory Management" active={showInventory} onToggle={(v) => update({ showInventory: v })} />
          <FeatureToggle label="Protocols & Cycles" active={showProtocols} onToggle={(v) => update({ showProtocols: v })} />
          <FeatureToggle label="Lab Results" active={showLabs} onToggle={(v) => update({ showLabs: v })} />
          <FeatureToggle label="Calculators" active={showCalc} onToggle={(v) => update({ showCalc: v })} />
        </div>
      </section>

      <section className="ui-card space-y-4 p-4">
        <HouseholdSettings
          enabled={householdMode}
          members={householdMembers}
          onToggle={(value) => update({ householdMode: value })}
          onMembersChange={(members) => update({ householdMembers: members })}
        />
      </section>

      <section className="ui-card space-y-4 p-4">
        <div>
          <h2 className="text-xs uppercase tracking-wider text-[var(--muted)]">App Defaults</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">Choose where the app lands and how much content Home shows by default.</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-[var(--muted)]">Default landing page</label>
          <select
            value={defaultLanding}
            onChange={(e) => update({ defaultLanding: e.target.value as LandingPage })}
            className="ui-input"
          >
            {LANDING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-[var(--muted)]">Labs preview count on Home</label>
          <div className="ui-segment grid grid-cols-2 gap-1">
            <ToggleButton active={labsPreviewCount === 4} onClick={() => update({ labsPreviewCount: 4 })}>
              4 Results
            </ToggleButton>
            <ToggleButton active={labsPreviewCount === 8} onClick={() => update({ labsPreviewCount: 8 })}>
              8 Results
            </ToggleButton>
          </div>
        </div>
      </section>

      <section className="ui-card space-y-4 p-4">
        <div>
          <h2 className="text-xs uppercase tracking-wider text-[var(--muted)]">Claude AI (optional)</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">Used for lab insights. Stored locally only.</p>
        </div>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="ui-input flex-1"
          />
          <button onClick={handleSaveKey} className="ui-button-primary px-3 py-2 text-sm font-medium">
            Save
          </button>
        </div>
      </section>

      <section className="ui-card space-y-3 p-4">
        <h2 className="text-xs uppercase tracking-wider text-[var(--muted)]">Data</h2>
        <button onClick={handleExport} className="ui-button-secondary w-full px-3 py-2.5 text-left text-sm">
          Download backup JSON
        </button>
        <label className="ui-button-secondary block w-full cursor-pointer px-3 py-2.5 text-sm">
          Choose JSON file...
          <input type="file" accept=".json,application/json" onChange={handleImportFile} className="hidden" />
        </label>
      </section>

      {backups.length > 0 && (
        <section className="ui-card space-y-2 p-4">
          <h2 className="text-xs uppercase tracking-wider text-[var(--muted)]">Rolling backups (last {MAX_BACKUPS})</h2>
          <ul className="space-y-2">
            {backups.map((backup, index) => (
              <li key={index} className="ui-card-muted flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-xs text-[var(--muted)]">{backup.label}</span>
                <button onClick={() => handleRestoreBackup(backup)} className="ui-button-primary px-2.5 py-1 text-xs">
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="ui-card space-y-3 p-4">
        <h2 className="text-xs uppercase tracking-wider text-[var(--muted)]">Reset UI</h2>
        <p className="text-xs text-[var(--muted)]">Restore the visual defaults without touching your saved data.</p>
        <button
          type="button"
          onClick={() => {
            reset();
            setStatus("UI settings reset to defaults.");
          }}
          className="ui-button-secondary w-full px-3 py-2.5 text-sm"
        >
          Reset Appearance & Defaults
        </button>
      </section>

      <p className="ui-disclaimer text-[10px] uppercase tracking-wider">
        For research purposes only - not for human consumption.
      </p>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 text-sm font-medium ${active ? "bg-[var(--accent)] text-[var(--accent-fg)]" : "text-[var(--muted)]"}`}
    >
      {children}
    </button>
  );
}

function FeatureToggle({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        onClick={() => onToggle(!active)}
        className={`relative h-5 w-9 rounded-full transition-colors ${active ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`}
      >
        <span
          className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all ${active ? "left-5" : "left-1"}`}
        />
      </button>
    </div>
  );
}
