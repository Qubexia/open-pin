"use client";

import { create } from "zustand";
import { db, type Vial, type DoseLog, type Protocol, type LabMarker, type OralSupplement } from "./db";
import { ensureDemoSeed } from "./demo-seed";

// ── Inventory (Injectables) ───────────────────────────────────────────────────
type InventoryState = {
  vials: Vial[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (v: Omit<Vial, "id" | "createdAt">) => Promise<void>;
  remove: (id: number) => Promise<void>;
};

export const useInventory = create<InventoryState>((set) => ({
  vials: [],
  loaded: false,
  load: async () => {
    if (!db) return;
    await ensureDemoSeed();
    const vials = await db.vials.orderBy("createdAt").reverse().toArray();
    set({ vials, loaded: true });
  },
  add: async (v) => {
    if (!db) return;
    const row: Vial = { ...v, createdAt: new Date().toISOString() };
    const id = await db.vials.add(row);
    set((s) => ({ vials: [{ ...row, id }, ...s.vials] }));
  },
  remove: async (id) => {
    if (!db) return;
    await db.vials.delete(id);
    set((s) => ({ vials: s.vials.filter((v) => v.id !== id) }));
  },
}));

// ── Oral Supplements ──────────────────────────────────────────────────────────
type OralsState = {
  orals: OralSupplement[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (o: Omit<OralSupplement, "id" | "createdAt">) => Promise<void>;
  remove: (id: number) => Promise<void>;
};

export const useOrals = create<OralsState>((set) => ({
  orals: [],
  loaded: false,
  load: async () => {
    if (!db) return;
    await ensureDemoSeed();
    const orals = await db.orals.orderBy("createdAt").reverse().toArray();
    set({ orals, loaded: true });
  },
  add: async (o) => {
    if (!db) return;
    const row: OralSupplement = { ...o, createdAt: new Date().toISOString() };
    const id = await db.orals.add(row);
    set((s) => ({ orals: [{ ...row, id }, ...s.orals] }));
  },
  remove: async (id) => {
    if (!db) return;
    await db.orals.delete(id);
    set((s) => ({ orals: s.orals.filter((o) => o.id !== id) }));
  },
}));

// ── Doses ──────────────────────────────────────────────────────────────────────
type DoseState = {
  doses: DoseLog[];
  loaded: boolean;
  load: () => Promise<void>;
  log: (d: Omit<DoseLog, "id" | "loggedAt"> & { loggedAt?: string }) => Promise<void>;
  skip: (d: Omit<DoseLog, "id" | "loggedAt"> & { loggedAt?: string }) => Promise<void>;
};

export const useDoses = create<DoseState>((set) => ({
  doses: [],
  loaded: false,
  load: async () => {
    if (!db) return;
    await ensureDemoSeed();
    const doses = await db.doses.orderBy("loggedAt").reverse().limit(500).toArray();
    set({ doses, loaded: true });
  },
  log: async (d) => {
    if (!db) return;
    const row: DoseLog = { ...d, skipped: false, loggedAt: d.loggedAt ?? new Date().toISOString() };
    const id = await db.doses.add(row);
    set((s) => ({ doses: [{ ...row, id }, ...s.doses] }));
  },
  skip: async (d) => {
    if (!db) return;
    const row: DoseLog = { ...d, skipped: true, loggedAt: d.loggedAt ?? new Date().toISOString() };
    const id = await db.doses.add(row);
    set((s) => ({ doses: [{ ...row, id }, ...s.doses] }));
  },
}));

// ── Protocols ──────────────────────────────────────────────────────────────────
type ProtocolState = {
  protocols: Protocol[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (p: Omit<Protocol, "id" | "createdAt">) => Promise<void>;
  remove: (id: number) => Promise<void>;
  toggle: (id: number, active: boolean) => Promise<void>;
};

export const useProtocols = create<ProtocolState>((set) => ({
  protocols: [],
  loaded: false,
  load: async () => {
    if (!db) return;
    await ensureDemoSeed();
    const protocols = await db.protocols.orderBy("startDate").reverse().toArray();
    set({ protocols, loaded: true });
  },
  add: async (p) => {
    if (!db) return;
    const row: Protocol = { ...p, createdAt: new Date().toISOString() };
    const id = await db.protocols.add(row);
    set((s) => ({ protocols: [{ ...row, id }, ...s.protocols] }));
  },
  remove: async (id) => {
    if (!db) return;
    await db.protocols.delete(id);
    set((s) => ({ protocols: s.protocols.filter((p) => p.id !== id) }));
  },
  toggle: async (id, active) => {
    if (!db) return;
    await db.protocols.update(id, { active });
    set((s) => ({
      protocols: s.protocols.map((p) => (p.id === id ? { ...p, active } : p)),
    }));
  },
}));

// ── Labs ───────────────────────────────────────────────────────────────────────
type LabsState = {
  entries: LabMarker[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (m: Omit<LabMarker, "id">) => Promise<void>;
  remove: (id: number) => Promise<void>;
};

export const useLabs = create<LabsState>((set) => ({
  entries: [],
  loaded: false,
  load: async () => {
    if (!db) return;
    await ensureDemoSeed();
    const entries = await db.labs.orderBy("takenAt").reverse().toArray();
    set({ entries, loaded: true });
  },
  add: async (m) => {
    if (!db) return;
    const id = await db.labs.add(m);
    set((s) => ({ entries: [{ ...m, id }, ...s.entries] }));
  },
  remove: async (id) => {
    if (!db) return;
    await db.labs.delete(id);
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
  },
}));

// ── Theme ──────────────────────────────────────────────────────────────────────
type Theme = "dark" | "light";
type ThemeState = {
  theme: Theme;
  setTheme: (t: Theme) => void;
};

export const useTheme = create<ThemeState>((set) => ({
  theme: typeof window !== "undefined" ? (localStorage.getItem("onepin_theme") as Theme ?? "dark") : "dark",
  setTheme: (t) => {
    localStorage.setItem("onepin_theme", t);
    document.documentElement.setAttribute("data-theme", t);
    set({ theme: t });
  },
}));
