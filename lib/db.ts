import Dexie, { type Table } from "dexie";

export type Vial = {
  id?: number;
  compoundId: string;
  brand?: string;
  strengthMg: number;
  reconstitutedBacWaterMl?: number;
  purityPct?: number;
  expiry?: string;
  openedAt?: string;
  createdAt: string;
};

export type DoseLog = {
  id?: number;
  compoundId: string;
  vialId?: number;
  doseMcg: number;
  siteId?: string;
  timing?: string;
  notes?: string;
  skipped?: boolean;
  loggedAt: string;
};

export type FrequencyUnit = "daily" | "eod" | "3x-week" | "weekly" | "every-x-days";

export type ProtocolStep = {
  doseMcg: number;
  durationDays: number;
  label?: string;
};

export type Protocol = {
  id?: number;
  name: string;
  compoundId: string;
  vialId?: number;
  doseMcg: number;
  steps?: ProtocolStep[];
  frequency: FrequencyUnit;
  frequencyXDays?: number;
  durationDays: number;
  startDate: string;
  active: boolean;
  pinAlone?: boolean;
  timing?: "fasted" | "pre-workout" | "post-workout" | "pre-dinner" | "post-dinner";
  createdAt: string;
};

export type LabMarker = {
  id?: number;
  marker: string;
  value: number;
  unit: string;
  refMin?: number;
  refMax?: number;
  takenAt: string;
  notes?: string;
};

export type OralSupplement = {
  id?: number;
  compoundId: string;
  brand?: string;
  strengthMg: number;
  capsPerServing?: number;
  totalCaps?: number;
  notes?: string;
  createdAt: string;
};

export type Settings = {
  id: "singleton";
  claudeApiKey?: string;
};

class OnePinDB extends Dexie {
  vials!: Table<Vial, number>;
  doses!: Table<DoseLog, number>;
  protocols!: Table<Protocol, number>;
  labs!: Table<LabMarker, number>;
  orals!: Table<OralSupplement, number>;
  settings!: Table<Settings, "singleton">;

  constructor() {
    super("onepin");
    this.version(1).stores({
      vials: "++id, compoundId, createdAt",
      doses: "++id, compoundId, loggedAt, siteId",
      settings: "id",
    });
    this.version(2).stores({
      vials: "++id, compoundId, createdAt",
      doses: "++id, compoundId, loggedAt, siteId",
      protocols: "++id, compoundId, active, startDate",
      settings: "id",
    });
    this.version(3).stores({
      vials: "++id, compoundId, createdAt",
      doses: "++id, compoundId, loggedAt, siteId",
      protocols: "++id, compoundId, active, startDate",
      labs: "++id, marker, takenAt",
      orals: "++id, compoundId, createdAt",
      settings: "id",
    });
  }
}

export const db = typeof window !== "undefined" ? new OnePinDB() : (null as unknown as OnePinDB);
