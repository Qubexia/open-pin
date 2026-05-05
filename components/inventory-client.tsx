"use client";

import { useEffect, useState } from "react";
import { COMPOUNDS, getCompoundName } from "@/data/compounds";
import { useInventory, useOrals } from "@/lib/stores";

// ─── Vials ─────────────────────────────────────────────────────────────────────
export function VialList() {
  const { vials, loaded, load, remove } = useInventory();
  useEffect(() => { if (!loaded) load(); }, [loaded, load]);

  if (!loaded) return <p className="text-sm text-[var(--muted)]">Loading…</p>;
  if (vials.length === 0)
    return <p className="text-sm text-[var(--muted)]">No vials yet. Add one below.</p>;

  return (
    <ul className="space-y-2">
      {vials.map((v) => (
        <li key={v.id} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
          <div>
            <p className="font-medium">{getCompoundName(v.compoundId)}</p>
            <p className="text-xs text-[var(--muted)]">
              {v.strengthMg} mg
              {v.reconstitutedBacWaterMl ? ` · ${v.reconstitutedBacWaterMl} mL BAC` : ""}
              {v.brand ? ` · ${v.brand}` : ""}
            </p>
          </div>
          <button
            onClick={() => v.id && remove(v.id)}
            className="text-xs rounded-md border border-[var(--border)] px-2 py-1 text-[var(--muted)] hover:text-[var(--danger)] hover:border-[var(--danger)]"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}

export function AddVialForm() {
  const add = useInventory((s) => s.add);
  const [open, setOpen] = useState(false);
  const injectables = COMPOUNDS.filter((c) => !c.isSupplement);
  const [compoundId, setCompoundId] = useState(injectables[0]?.id ?? COMPOUNDS[0].id);
  const [strengthMg, setStrengthMg] = useState<string>("5");
  const [bacMl, setBacMl] = useState<string>("");
  const [brand, setBrand] = useState("");

  const reset = () => {
    setCompoundId(injectables[0]?.id ?? COMPOUNDS[0].id);
    setStrengthMg("5");
    setBacMl("");
    setBrand("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mg = Number(strengthMg);
    if (!mg || mg <= 0) return;
    await add({
      compoundId,
      strengthMg: mg,
      reconstitutedBacWaterMl: bacMl ? Number(bacMl) : undefined,
      brand: brand.trim() || undefined,
    });
    reset();
    setOpen(false);
  };

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="w-full rounded-lg bg-[var(--accent)] px-3 py-2.5 text-sm font-medium text-[var(--accent-fg)]">
        + Add vial
      </button>
    );

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-xs uppercase tracking-wider text-[var(--muted)]">New vial</p>
      <div>
        <label className="text-xs text-[var(--muted)]">Compound</label>
        <select value={compoundId} onChange={(e) => {
          setCompoundId(e.target.value);
          const def = COMPOUNDS.find((c) => c.id === e.target.value)?.defaultStrengthMg;
          if (def) setStrengthMg(String(def));
        }} className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm">
          {injectables.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[var(--muted)]">Strength (mg)</label>
          <input inputMode="decimal" value={strengthMg} onChange={(e) => setStrengthMg(e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-[var(--muted)]">BAC water (mL)</label>
          <input inputMode="decimal" placeholder="optional" value={bacMl} onChange={(e) => setBacMl(e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm" />
        </div>
      </div>
      <div>
        <label className="text-xs text-[var(--muted)]">Brand (optional)</label>
        <input value={brand} onChange={(e) => setBrand(e.target.value)}
          className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm" />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="flex-1 rounded-lg bg-[var(--accent)] px-3 py-2.5 text-sm font-medium text-[var(--accent-fg)]">Save</button>
        <button type="button" onClick={() => { reset(); setOpen(false); }}
          className="rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--muted)]">Cancel</button>
      </div>
    </form>
  );
}

// ─── Oral Supplements ──────────────────────────────────────────────────────────
export function OralList() {
  const { orals, loaded, load, remove } = useOrals();
  useEffect(() => { if (!loaded) load(); }, [loaded, load]);

  if (!loaded) return <p className="text-sm text-[var(--muted)]">Loading…</p>;
  if (orals.length === 0)
    return <p className="text-sm text-[var(--muted)]">No oral supplements yet.</p>;

  return (
    <ul className="space-y-2">
      {orals.map((o) => (
        <li key={o.id} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
          <div>
            <p className="font-medium">{getCompoundName(o.compoundId)}</p>
            <p className="text-xs text-[var(--muted)]">
              {o.strengthMg} mg
              {o.capsPerServing ? ` · ${o.capsPerServing} cap/serving` : ""}
              {o.totalCaps ? ` · ${o.totalCaps} caps total` : ""}
              {o.brand ? ` · ${o.brand}` : ""}
            </p>
          </div>
          <button
            onClick={() => o.id && remove(o.id)}
            className="text-xs rounded-md border border-[var(--border)] px-2 py-1 text-[var(--muted)] hover:text-[var(--danger)] hover:border-[var(--danger)]"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}

export function AddOralForm() {
  const add = useOrals((s) => s.add);
  const [open, setOpen] = useState(false);
  const supplements = COMPOUNDS.filter((c) => c.isSupplement || c.route === "oral");
  const [compoundId, setCompoundId] = useState(supplements[0]?.id ?? COMPOUNDS[0].id);
  const [strengthMg, setStrengthMg] = useState("500");
  const [capsPerServing, setCapsPerServing] = useState("1");
  const [totalCaps, setTotalCaps] = useState("");
  const [brand, setBrand] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mg = Number(strengthMg);
    if (!mg || mg <= 0) return;
    await add({
      compoundId,
      strengthMg: mg,
      capsPerServing: capsPerServing ? Number(capsPerServing) : undefined,
      totalCaps: totalCaps ? Number(totalCaps) : undefined,
      brand: brand.trim() || undefined,
    });
    setOpen(false);
  };

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="w-full rounded-lg border border-[var(--accent)]/50 px-3 py-2.5 text-sm font-medium text-[var(--accent)]">
        + Add oral supplement
      </button>
    );

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-xs uppercase tracking-wider text-[var(--muted)]">New oral supplement</p>
      <div>
        <label className="text-xs text-[var(--muted)]">Compound</label>
        <select value={compoundId} onChange={(e) => {
          setCompoundId(e.target.value);
          const def = COMPOUNDS.find((c) => c.id === e.target.value)?.defaultStrengthMg;
          if (def) setStrengthMg(String(def));
        }} className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm">
          {supplements.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-[var(--muted)]">Strength (mg)</label>
          <input inputMode="decimal" value={strengthMg} onChange={(e) => setStrengthMg(e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-[var(--muted)]">Caps/serving</label>
          <input inputMode="numeric" value={capsPerServing} onChange={(e) => setCapsPerServing(e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-[var(--muted)]">Total caps</label>
          <input inputMode="numeric" placeholder="opt." value={totalCaps} onChange={(e) => setTotalCaps(e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2 text-sm" />
        </div>
      </div>
      <div>
        <label className="text-xs text-[var(--muted)]">Brand (optional)</label>
        <input value={brand} onChange={(e) => setBrand(e.target.value)}
          className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm" />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="flex-1 rounded-lg bg-[var(--accent)] px-3 py-2.5 text-sm font-medium text-[var(--accent-fg)]">Save</button>
        <button type="button" onClick={() => setOpen(false)}
          className="rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--muted)]">Cancel</button>
      </div>
    </form>
  );
}

// ─── Compound Browser ──────────────────────────────────────────────────────────
const CATEGORIES = Array.from(new Set(COMPOUNDS.map((c) => c.category))).sort();

export function CompoundBrowser() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = COMPOUNDS.filter((c) => {
    const q = query.toLowerCase();
    const matchesQuery = !q || c.name.toLowerCase().includes(q) ||
      c.aliases?.some((a) => a.toLowerCase().includes(q));
    const matchesCat = cat === "all" || c.category === cat;
    return matchesQuery && matchesCat;
  });

  return (
    <div className="space-y-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search compounds…"
        className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
      />
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setCat("all")}
          className={`rounded px-2 py-1 text-xs ${cat === "all" ? "bg-[var(--accent)] text-[var(--accent-fg)]" : "border border-[var(--border)] text-[var(--muted)]"}`}>
          All
        </button>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={`rounded px-2 py-1 text-xs capitalize ${cat === c ? "bg-[var(--accent)] text-[var(--accent-fg)]" : "border border-[var(--border)] text-[var(--muted)]"}`}>
            {c}
          </button>
        ))}
      </div>

      <p className="text-xs text-[var(--muted)]">{filtered.length} compound{filtered.length !== 1 ? "s" : ""}</p>

      <ul className="space-y-1.5">
        {filtered.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => setExpanded(expanded === c.id ? null : c.id)}
              className="w-full text-left rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{c.name}</p>
                  <p className="text-xs text-[var(--muted)] capitalize">{c.category} · {c.route ?? "subq"}</p>
                </div>
                <span className="text-[var(--muted)] text-xs">{expanded === c.id ? "▲" : "▼"}</span>
              </div>
            </button>
            {expanded === c.id && (
              <div className="rounded-b-xl border border-t-0 border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 space-y-2 text-sm">
                {c.aliases?.length ? <p className="text-xs text-[var(--muted)]">Also: {c.aliases.join(", ")}</p> : null}
                {c.halfLife && <InfoRow label="Half-life" value={c.halfLife} />}
                {c.peakTmax && <InfoRow label="Peak Tmax" value={c.peakTmax} />}
                {c.storage && <InfoRow label="Storage" value={c.storage} />}
                {c.fasted && <InfoRow label="Timing" value={`Fasted${c.fastedNote ? ` — ${c.fastedNote}` : ""}`} />}
                {c.coStorage && <InfoRow label="Co-storage" value={c.coStorage} />}
                {c.pinAlone && <InfoRow label="Pin alone" value={c.mixNote ?? "Yes"} warn />}
                {c.contaminationStrategy && <InfoRow label="Contamination" value={c.contaminationStrategy} />}
                {c.commonUses && <InfoRow label="Uses" value={Array.isArray(c.commonUses) ? c.commonUses.join(", ") : c.commonUses} />}
                {c.dosingAdvice && <InfoRow label="Dosing" value={c.dosingAdvice} />}
                {c.evidenceSummary && <p className="text-xs text-[var(--muted)]">{c.evidenceSummary}</p>}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function InfoRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-[var(--muted)] shrink-0 w-24">{label}</span>
      <span className={warn ? "text-[var(--warning)]" : ""}>{value}</span>
    </div>
  );
}

// ─── Inventory Screen (page entry point) ───────────────────────────────────────
export function InventoryScreen() {
  const [tab, setTab] = useState<"vials" | "orals" | "browser">("vials");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>

      <div className="flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-0.5">
        {(["vials", "orals", "browser"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium capitalize transition-colors ${
              tab === t ? "bg-[var(--accent)] text-[var(--accent-fg)]" : "text-[var(--muted)]"
            }`}
          >
            {t === "vials" ? "Vials" : t === "orals" ? "Orals" : "Library"}
          </button>
        ))}
      </div>

      {tab === "vials" && (
        <div className="space-y-4">
          <VialList />
          <AddVialForm />
        </div>
      )}
      {tab === "orals" && (
        <div className="space-y-4">
          <OralList />
          <AddOralForm />
        </div>
      )}
      {tab === "browser" && <CompoundBrowser />}
    </div>
  );
}
