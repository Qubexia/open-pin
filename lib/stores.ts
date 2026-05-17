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

export type AccentPreset = "green" | "blue" | "amber" | "rose";
export type DensityMode = "comfortable" | "compact";
export type MotionMode = "full" | "reduced";
export type LandingPage = "/home" | "/protocols" | "/inventory" | "/calc" | "/more";
export type UnitSystem = "metric" | "imperial";
export type HouseholdGender = "male" | "female";

export type HouseholdMember = {
  id: string;
  name: string;
  initials: string;
  color: string;
  gender: HouseholdGender;
  primary: boolean;
};

export type AppSettings = {
  theme: Theme;
  accent: AccentPreset;
  density: DensityMode;
  motion: MotionMode;
  defaultLanding: LandingPage;
  labsPreviewCount: 4 | 8;
  unitSystem: UnitSystem;
  showAdherence: boolean;
  showInventory: boolean;
  showProtocols: boolean;
  showLabs: boolean;
  showCalc: boolean;
  householdMode: boolean;
  householdMembers: HouseholdMember[];
};

const APP_SETTINGS_KEY = "onepin_ui_settings";

const DEFAULT_HOUSEHOLD_MEMBER: HouseholdMember = {
  id: "primary",
  name: "Me",
  initials: "M",
  color: "#22c55e",
  gender: "male",
  primary: true,
};

const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: "dark",
  accent: "green",
  density: "comfortable",
  motion: "full",
  defaultLanding: "/home",
  labsPreviewCount: 4,
  unitSystem: "metric",
  showAdherence: true,
  showInventory: true,
  showProtocols: true,
  showLabs: true,
  showCalc: true,
  householdMode: false,
  householdMembers: [DEFAULT_HOUSEHOLD_MEMBER],
};

function loadAppSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_APP_SETTINGS;
  try {
    const raw = localStorage.getItem(APP_SETTINGS_KEY);
    if (!raw) return DEFAULT_APP_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_APP_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

function applyAppSettings(settings: AppSettings) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", settings.theme);
  document.documentElement.setAttribute("data-accent", settings.accent);
  document.documentElement.setAttribute("data-density", settings.density);
  document.documentElement.setAttribute("data-motion", settings.motion);
  document.documentElement.setAttribute("dir", "ltr");
  document.documentElement.lang = "en";
}

type AppSettingsState = AppSettings & {
  loaded: boolean;
  hydrate: () => void;
  update: (patch: Partial<AppSettings>) => void;
  reset: () => void;
};

export const useAppSettings = create<AppSettingsState>((set, get) => ({
  ...DEFAULT_APP_SETTINGS,
  loaded: false,
  hydrate: () => {
    const settings = loadAppSettings();
    applyAppSettings(settings);
    localStorage.setItem("onepin_theme", settings.theme);
    set({ ...settings, loaded: true });
  },
  update: (patch) => {
    const next = { ...get(), ...patch };
    const settings: AppSettings = {
      theme: next.theme,
      accent: next.accent,
      density: next.density,
      motion: next.motion,
      defaultLanding: next.defaultLanding,
      labsPreviewCount: next.labsPreviewCount,
      unitSystem: next.unitSystem,
      showAdherence: next.showAdherence,
      showInventory: next.showInventory,
      showProtocols: next.showProtocols,
      showLabs: next.showLabs,
      showCalc: next.showCalc,
      householdMode: next.householdMode,
      householdMembers: next.householdMembers,
    };
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
    localStorage.setItem("onepin_theme", settings.theme);
    applyAppSettings(settings);
    set(settings);
  },
  reset: () => {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(DEFAULT_APP_SETTINGS));
    localStorage.setItem("onepin_theme", DEFAULT_APP_SETTINGS.theme);
    applyAppSettings(DEFAULT_APP_SETTINGS);
    set({ ...DEFAULT_APP_SETTINGS, loaded: true });
  },
}));
