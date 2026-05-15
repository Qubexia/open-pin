"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { COMPOUNDS, getCompoundName, type Compound } from "@/data/compounds";
import { useAppSettings, useDoses, useInventory, useOrals, useProtocols } from "@/lib/stores";

type Filter = "all" | "compound" | "supplement";
type Period = "today" | "week" | "month" | "active";

const MS_DAY = 86_400_000;

// ─── Vials ─────────────────────────────────────────────────────────────────────
export function VialList() {
  const { vials, loaded, load, remove, add } = useInventory();
  const [menu, setMenu] = useState<number | null>(null);
  useEffect(() => { if (!loaded) load(); }, [loaded, load]);

  if (!loaded) return <p className="text-sm text-[var(--muted)]">Loading…</p>;
  if (vials.length === 0)
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
        <p className="text-3xl">🧪</p>
        <p className="text-sm mt-1">No vials yet</p>
        <p className="text-xs text-[var(--muted)] mt-1">Add one below to start tracking.</p>
      </div>
    );

  const duplicate = async (v: typeof vials[0]) => {
    await add({
      compoundId: v.compoundId,
      strengthMg: v.strengthMg,
      reconstitutedBacWaterMl: v.reconstitutedBacWaterMl,
      brand: v.brand,
    });
    setMenu(null);
  };

  return (
    <ul className="space-y-2">
      {vials.map((v) => (
        <li key={v.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="flex items-center justify-between p-3">
            <Link href={`/compounds/${v.compoundId}`} className="flex-1 min-w-0">
              <p className="font-medium truncate">{getCompoundName(v.compoundId)}</p>
              <p className="text-xs text-[var(--muted)]">
                {v.strengthMg} mg
                {v.reconstitutedBacWaterMl ? ` · ${v.reconstitutedBacWaterMl} mL BAC` : ""}
                {v.brand ? ` · ${v.brand}` : ""}
              </p>
            </Link>
            <button
              onClick={() => setMenu(menu === v.id ? null : v.id ?? null)}
              className="ml-2 rounded-md border border-[var(--border)] px-2 py-1 text-[var(--muted)]"
            >
              ⋯
            </button>
          </div>
          {menu === v.id && (
            <div className="border-t border-[var(--border)] bg-[var(--surface-2)] divide-y divide-[var(--border)]">
              <MenuLink href={`/compounds/${v.compoundId}`} label="View details" icon="ℹ️" />
              <MenuButton label="Duplicate" icon="📋" onClick={() => duplicate(v)} />
              <MenuLink href="/protocols" label="Create protocol" icon="⊕" />
              <MenuButton label="Delete" icon="✕" danger onClick={() => v.id && remove(v.id)} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function MenuLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--surface)]">
      <span className="w-5">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
function MenuButton({ label, icon, onClick, danger }: { label: string; icon: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-[var(--surface)] ${danger ? "text-[var(--danger)]" : ""}`}>
      <span className="w-5">{icon}</span>
      <span>{label}</span>
    </button>
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
    setStrengthMg("5"); setBacMl(""); setBrand("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mg = Number(strengthMg);
    if (!mg || mg <= 0) return;
    await add({
      compoundId, strengthMg: mg,
      reconstitutedBacWaterMl: bacMl ? Number(bacMl) : undefined,
      brand: brand.trim() || undefined,
    });
    reset(); setOpen(false);
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
  const [menu, setMenu] = useState<number | null>(null);
  useEffect(() => { if (!loaded) load(); }, [loaded, load]);

  if (!loaded) return <p className="text-sm text-[var(--muted)]">Loading…</p>;
  if (orals.length === 0)
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
        <p className="text-3xl">💊</p>
        <p className="text-sm mt-1">No oral supplements yet</p>
      </div>
    );

  return (
    <ul className="space-y-2">
      {orals.map((o) => (
        <li key={o.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="flex items-center justify-between p-3">
            <Link href={`/compounds/${o.compoundId}`} className="flex-1 min-w-0">
              <p className="font-medium truncate">{getCompoundName(o.compoundId)}</p>
              <p className="text-xs text-[var(--muted)]">
                {o.strengthMg} mg
                {o.capsPerServing ? ` · ${o.capsPerServing} cap/serving` : ""}
                {o.totalCaps ? ` · ${o.totalCaps} caps total` : ""}
                {o.brand ? ` · ${o.brand}` : ""}
              </p>
            </Link>
            <button onClick={() => setMenu(menu === o.id ? null : o.id ?? null)}
              className="ml-2 rounded-md border border-[var(--border)] px-2 py-1 text-[var(--muted)]">⋯</button>
          </div>
          {menu === o.id && (
            <div className="border-t border-[var(--border)] bg-[var(--surface-2)] divide-y divide-[var(--border)]">
              <MenuLink href={`/compounds/${o.compoundId}`} label="View details" icon="ℹ️" />
              <MenuLink href="/more/pill-bin" label="Add to Pill Bin" icon="💊" />
              <MenuButton label="Delete" icon="✕" danger onClick={() => o.id && remove(o.id)} />
            </div>
          )}
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
      compoundId, strengthMg: mg,
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

// ─── Compound Browser (Library) ────────────────────────────────────────────────
const CATEGORIES = Array.from(new Set(COMPOUNDS.map((c) => c.category))).sort();

export function CompoundBrowser() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");

  const filtered = useMemo(() => COMPOUNDS.filter((c) => {
    const q = query.toLowerCase();
    const matchesQuery = !q || c.name.toLowerCase().includes(q) ||
      c.aliases?.some((a) => a.toLowerCase().includes(q));
    const matchesCat = cat === "all" || c.category === cat;
    return matchesQuery && matchesCat;
  }), [query, cat]);

  return (
    <div className="space-y-3">
      <input
        value={query} onChange={(e) => setQuery(e.target.value)}
        placeholder="Search compounds…"
        className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm"
      />
      <div className="flex gap-1.5 flex-wrap">
        <CatButton active={cat === "all"} onClick={() => setCat("all")}>All</CatButton>
        {CATEGORIES.map((c) => (
          <CatButton key={c} active={cat === c} onClick={() => setCat(c)}>{c}</CatButton>
        ))}
      </div>
      <p className="text-xs text-[var(--muted)]">{filtered.length} compound{filtered.length !== 1 ? "s" : ""}</p>

      <ul className="space-y-1.5">
        {filtered.map((c) => (
          <li key={c.id}>
            <Link href={`/compounds/${c.id}`}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 hover:border-[var(--accent)]/40">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{c.name}</p>
                <p className="text-xs text-[var(--muted)] capitalize">{c.category} · {c.route ?? "subq"}</p>
              </div>
              <span className="text-[var(--muted)] text-xs ml-2">VIEW →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CatButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`rounded px-2 py-1 text-xs capitalize ${active ? "bg-[var(--accent)] text-[var(--accent-fg)]" : "border border-[var(--border)] text-[var(--muted)]"}`}>
      {children}
    </button>
  );
}

// ─── Inventory Screen ──────────────────────────────────────────────────────────
export function InventoryScreen() {
  const [tab, setTab] = useState<"vials" | "orals" | "browser">("vials");
  const [filter, setFilter] = useState<Filter>("all");
  const [period, setPeriod] = useState<Period>("today");
  const [query, setQuery] = useState("");

  const { vials, loaded: vLoaded, load: loadV } = useInventory();
  const { orals, loaded: oLoaded, load: loadO } = useOrals();
  const { doses, loaded: dLoaded, load: loadD } = useDoses();
  const { protocols, loaded: pLoaded, load: loadP } = useProtocols();
  const { showInventory, hydrate: hydrateAppSettings } = useAppSettings();


  useEffect(() => {
    if (!vLoaded) loadV();
    if (!oLoaded) loadO();
    if (!dLoaded) loadD();
    if (!pLoaded) loadP();
    hydrateAppSettings();
  }, [vLoaded, loadV, oLoaded, loadO, dLoaded, loadD, pLoaded, loadP, hydrateAppSettings]);

  // Counters
  const counts = useMemo(() => {
    const today = new Date().toDateString();
    const cutoff = (days: number) => Date.now() - days * MS_DAY;
    const todayCount = doses.filter((d) => new Date(d.loggedAt).toDateString() === today).length;
    const weekCount = doses.filter((d) => new Date(d.loggedAt).getTime() > cutoff(7)).length;
    const monthCount = doses.filter((d) => new Date(d.loggedAt).getTime() > cutoff(30)).length;
    const activeCount = protocols.filter((p) => p.active).length;
    return { today: todayCount, week: weekCount, month: monthCount, active: activeCount };
  }, [doses, protocols]);

  if (!showInventory) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="text-5xl">📦</div>
        <h2 className="text-xl font-semibold">{"Inventory Disabled"}</h2>
        <p className="text-[var(--muted)] max-w-xs">{"You can enable Inventory in the settings panel to track your vials and supplements."}</p>
        <Link href="/more/settings" className="text-[var(--accent)] font-medium">{"Go to Settings"}</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{"Inventory"}</h1>

      {/* All/Compound/Supplement filter pills */}
      <div className="flex justify-center gap-2">
        {(["all", "compound", "supplement"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium border transition-colors ${
              filter === f
                ? "bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)]"
                : "border-[var(--border)] text-[var(--muted)]"
            }`}
          >
            {f === "all" ? "All" : f === "compound" ? "💉 Compound" : "💊 Supplement"}
          </button>
        ))}
      </div>

      {/* Period counters */}
      <div className="flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-0.5">
        {(["today", "week", "month", "active"] as const).map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`flex-1 rounded-md py-1.5 text-xs transition-colors ${
              period === p ? "bg-[var(--accent)] text-[var(--accent-fg)] font-medium" : "text-[var(--muted)]"
            }`}
          >
            <span className="capitalize">{p}</span>
            <span className="ml-1 opacity-70">({counts[p]})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${vials.length + orals.length} items…`}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-9 py-2 text-sm" />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] text-sm">🔍</span>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-0.5">
        {(["vials", "orals", "browser"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
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
          <VialListFiltered query={query} />
          <AddVialForm />
        </div>
      )}
      {tab === "orals" && (
        <div className="space-y-4">
          <OralListFiltered query={query} />
          <AddOralForm />
        </div>
      )}
      {tab === "browser" && <CompoundBrowser />}
    </div>
  );
}

function VialListFiltered({ query }: { query: string }) {
  const { vials, loaded, load, remove, add } = useInventory();
  const [menu, setMenu] = useState<number | null>(null);
  useEffect(() => { if (!loaded) load(); }, [loaded, load]);

  const list = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return vials;
    return vials.filter((v) => {
      const name = getCompoundName(v.compoundId).toLowerCase();
      return name.includes(q) || (v.brand?.toLowerCase().includes(q) ?? false);
    });
  }, [vials, query]);

  if (!loaded) return <p className="text-sm text-[var(--muted)]">Loading…</p>;
  if (list.length === 0)
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
        <p className="text-3xl">🧪</p>
        <p className="text-sm mt-1">{vials.length === 0 ? "No vials yet" : "No matches"}</p>
        <p className="text-xs text-[var(--muted)] mt-1">{vials.length === 0 ? "Add one below." : "Try clearing the search."}</p>
      </div>
    );

  const duplicate = async (v: typeof vials[0]) => {
    await add({ compoundId: v.compoundId, strengthMg: v.strengthMg, reconstitutedBacWaterMl: v.reconstitutedBacWaterMl, brand: v.brand });
    setMenu(null);
  };

  return (
    <ul className="space-y-2">
      {list.map((v) => (
        <li key={v.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="flex items-center justify-between p-3">
            <Link href={`/compounds/${v.compoundId}`} className="flex-1 min-w-0">
              <p className="font-medium truncate">{getCompoundName(v.compoundId)}</p>
              <p className="text-xs text-[var(--muted)]">
                {v.strengthMg} mg
                {v.reconstitutedBacWaterMl ? ` · ${v.reconstitutedBacWaterMl} mL BAC` : ""}
                {v.brand ? ` · ${v.brand}` : ""}
              </p>
            </Link>
            <button onClick={() => setMenu(menu === v.id ? null : v.id ?? null)}
              className="ml-2 rounded-md border border-[var(--border)] px-2 py-1 text-[var(--muted)]">⋯</button>
          </div>
          {menu === v.id && (
            <div className="border-t border-[var(--border)] bg-[var(--surface-2)] divide-y divide-[var(--border)]">
              <MenuLink href={`/compounds/${v.compoundId}`} label="View details" icon="ℹ️" />
              <MenuButton label="Duplicate" icon="📋" onClick={() => duplicate(v)} />
              <MenuLink href="/protocols" label="Create protocol" icon="⊕" />
              <MenuButton label="Delete" icon="✕" danger onClick={() => v.id && remove(v.id)} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function OralListFiltered({ query }: { query: string }) {
  const { orals, loaded, load, remove } = useOrals();
  const [menu, setMenu] = useState<number | null>(null);
  useEffect(() => { if (!loaded) load(); }, [loaded, load]);

  const list = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return orals;
    return orals.filter((o) => getCompoundName(o.compoundId).toLowerCase().includes(q));
  }, [orals, query]);

  if (!loaded) return <p className="text-sm text-[var(--muted)]">Loading…</p>;
  if (list.length === 0)
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
        <p className="text-3xl">💊</p>
        <p className="text-sm mt-1">{orals.length === 0 ? "No oral supplements yet" : "No matches"}</p>
      </div>
    );

  return (
    <ul className="space-y-2">
      {list.map((o) => (
        <li key={o.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="flex items-center justify-between p-3">
            <Link href={`/compounds/${o.compoundId}`} className="flex-1 min-w-0">
              <p className="font-medium truncate">{getCompoundName(o.compoundId)}</p>
              <p className="text-xs text-[var(--muted)]">
                {o.strengthMg} mg
                {o.capsPerServing ? ` · ${o.capsPerServing} cap/serving` : ""}
                {o.totalCaps ? ` · ${o.totalCaps} caps total` : ""}
                {o.brand ? ` · ${o.brand}` : ""}
              </p>
            </Link>
            <button onClick={() => setMenu(menu === o.id ? null : o.id ?? null)}
              className="ml-2 rounded-md border border-[var(--border)] px-2 py-1 text-[var(--muted)]">⋯</button>
          </div>
          {menu === o.id && (
            <div className="border-t border-[var(--border)] bg-[var(--surface-2)] divide-y divide-[var(--border)]">
              <MenuLink href={`/compounds/${o.compoundId}`} label="View details" icon="ℹ️" />
              <MenuLink href="/more/pill-bin" label="Add to Pill Bin" icon="💊" />
              <MenuButton label="Delete" icon="✕" danger onClick={() => o.id && remove(o.id)} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
