"use client";

import { useState } from "react";
import { db } from "@/lib/db";

const BACKUP_KEY = "onepin_backups";
const MAX_BACKUPS = 5;

type Backup = { ts: string; label: string; data: string };

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
  const data = JSON.parse(json);
  await db.transaction("rw", [db.vials, db.doses, db.protocols, db.labs, db.orals], async () => {
    if (data.vials) { await db.vials.clear(); await db.vials.bulkAdd(data.vials.map((v: any) => { const { id, ...rest } = v; return rest; })); }
    if (data.doses) { await db.doses.clear(); await db.doses.bulkAdd(data.doses.map((d: any) => { const { id, ...rest } = d; return rest; })); }
    if (data.protocols) { await db.protocols.clear(); await db.protocols.bulkAdd(data.protocols.map((p: any) => { const { id, ...rest } = p; return rest; })); }
    if (data.labs) { await db.labs.clear(); await db.labs.bulkAdd(data.labs.map((l: any) => { const { id, ...rest } = l; return rest; })); }
    if (data.orals) { await db.orals.clear(); await db.orals.bulkAdd(data.orals.map((o: any) => { const { id, ...rest } = o; return rest; })); }
  });
}

export function SettingsScreen() {
  const [backups, setBackups] = useState<Backup[]>(() => (typeof window !== "undefined" ? getBackups() : []));
  const [status, setStatus] = useState("");
  const [apiKey, setApiKey] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem("onepin_claude_key") ?? "") : ""
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
        setStatus("Import failed — invalid file.");
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-[var(--muted)]">Data management & preferences</p>
      </div>

      {status && (
        <div className="rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/5 px-3 py-2 text-sm text-[var(--accent)]">
          {status}
        </div>
      )}

      {/* Claude API key */}
      <section className="space-y-2">
        <h2 className="text-xs uppercase tracking-wider text-[var(--muted)]">Claude AI (optional)</h2>
        <p className="text-xs text-[var(--muted)]">Used for lab insights. Stored locally only.</p>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-…"
            className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
          />
          <button onClick={handleSaveKey}
            className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--accent-fg)]">
            Save
          </button>
        </div>
      </section>

      {/* Export */}
      <section className="space-y-2">
        <h2 className="text-xs uppercase tracking-wider text-[var(--muted)]">Export</h2>
        <button onClick={handleExport}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-left">
          ↓ Download backup JSON
        </button>
      </section>

      {/* Import */}
      <section className="space-y-2">
        <h2 className="text-xs uppercase tracking-wider text-[var(--muted)]">Import</h2>
        <p className="text-xs text-[var(--muted)]">Replaces all existing data with the imported file.</p>
        <label className="block w-full cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm">
          ↑ Choose JSON file…
          <input type="file" accept=".json,application/json" onChange={handleImportFile} className="hidden" />
        </label>
      </section>

      {/* Rolling backups */}
      {backups.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs uppercase tracking-wider text-[var(--muted)]">Rolling backups (last {MAX_BACKUPS})</h2>
          <ul className="space-y-1.5">
            {backups.map((b, i) => (
              <li key={i} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">
                <span className="text-xs text-[var(--muted)]">{b.label}</span>
                <button onClick={() => handleRestoreBackup(b)}
                  className="text-xs text-[var(--accent)] border border-[var(--accent)]/40 rounded px-2 py-0.5">
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
        For research purposes only — not for human consumption.
      </p>
    </div>
  );
}
