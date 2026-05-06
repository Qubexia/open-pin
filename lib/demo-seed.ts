import { COMMON_LAB_MARKERS } from "@/data/lab-markers";
import { db, type DoseLog, type LabMarker, type OralSupplement, type Protocol, type Vial } from "./db";

const SEED_FLAG_KEY = "onepin_demo_seed_v1";
const PILL_BIN_KEY = "onepin_pill_bin";
const PILL_LAYOUTS_KEY = "onepin_pill_layouts";
const INSIGHTS_KEY = "onepin_insights";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type PillSlot = "AM" | "Mid" | "PM" | "Night";
type PillEntry = { compoundId: string; caps: number };
type PillSchedule = Record<string, Record<PillSlot, PillEntry[]>>;

let seedPromise: Promise<void> | null = null;

function isoOffset(days: number, hour: number, minute: number, baseDate: Date) {
  const next = new Date(baseDate);
  next.setHours(hour, minute, 0, 0);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

function emptySchedule(): PillSchedule {
  return Object.fromEntries(
    DAYS.map((day) => [day, { AM: [], Mid: [], PM: [], Night: [] }])
  ) as PillSchedule;
}

function buildSeedData(baseDate: Date) {
  const todayDay = DAYS[baseDate.getDay()];

  const vials: Omit<Vial, "id">[] = [
    {
      compoundId: "cjc-1295-no-dac",
      brand: "Core Labs",
      strengthMg: 2,
      reconstitutedBacWaterMl: 2,
      createdAt: isoOffset(-12, 8, 0, baseDate),
    },
    {
      compoundId: "bpc-157",
      brand: "Repair Peptides",
      strengthMg: 5,
      reconstitutedBacWaterMl: 2,
      createdAt: isoOffset(-11, 8, 20, baseDate),
    },
    {
      compoundId: "tb-500",
      brand: "Repair Peptides",
      strengthMg: 5,
      reconstitutedBacWaterMl: 2.5,
      createdAt: isoOffset(-10, 8, 30, baseDate),
    },
    {
      compoundId: "ghk-cu",
      brand: "Dermal Research",
      strengthMg: 50,
      reconstitutedBacWaterMl: 5,
      createdAt: isoOffset(-9, 8, 45, baseDate),
    },
    {
      compoundId: "tesamorelin",
      brand: "Metabolic Lab",
      strengthMg: 5,
      reconstitutedBacWaterMl: 2,
      createdAt: isoOffset(-8, 9, 0, baseDate),
    },
  ];

  const orals: Omit<OralSupplement, "id">[] = [
    {
      compoundId: "vitamin-d",
      brand: "Thorne",
      strengthMg: 0.125,
      capsPerServing: 1,
      totalCaps: 60,
      notes: "AM with fats",
      createdAt: isoOffset(-7, 9, 15, baseDate),
    },
    {
      compoundId: "magnesium",
      brand: "Momentous",
      strengthMg: 200,
      capsPerServing: 2,
      totalCaps: 90,
      notes: "Night recovery",
      createdAt: isoOffset(-7, 9, 20, baseDate),
    },
    {
      compoundId: "urolithin-a",
      brand: "Timeline",
      strengthMg: 500,
      capsPerServing: 1,
      totalCaps: 30,
      notes: "Midday longevity stack",
      createdAt: isoOffset(-6, 9, 25, baseDate),
    },
  ];

  const protocols: Omit<Protocol, "id">[] = [
    {
      name: "Morning GH Pulse",
      compoundId: "cjc-1295-no-dac",
      doseMcg: 150,
      frequency: "daily",
      durationDays: 42,
      startDate: isoOffset(-6, 7, 0, baseDate),
      active: true,
      timing: "fasted",
      createdAt: isoOffset(-7, 9, 0, baseDate),
    },
    {
      name: "Systemic Repair",
      compoundId: "bpc-157",
      doseMcg: 350,
      frequency: "daily",
      durationDays: 28,
      startDate: isoOffset(-10, 12, 0, baseDate),
      active: true,
      timing: "post-workout",
      createdAt: isoOffset(-11, 9, 10, baseDate),
    },
    {
      name: "Copper Repair Hold",
      compoundId: "ghk-cu",
      doseMcg: 1000,
      frequency: "daily",
      durationDays: 30,
      startDate: isoOffset(-12, 20, 0, baseDate),
      active: false,
      createdAt: isoOffset(-13, 9, 20, baseDate),
      pinAlone: true,
    },
    {
      name: "Hexarelin Reset",
      compoundId: "hexarelin",
      doseMcg: 120,
      frequency: "daily",
      durationDays: 21,
      startDate: isoOffset(-8, 19, 0, baseDate),
      active: false,
      timing: "pre-dinner",
      createdAt: isoOffset(-9, 9, 30, baseDate),
    },
    {
      name: "Visceral Fat Block",
      compoundId: "tesamorelin",
      doseMcg: 2000,
      frequency: "daily",
      durationDays: 35,
      startDate: isoOffset(2, 7, 30, baseDate),
      active: true,
      timing: "fasted",
      createdAt: isoOffset(-1, 9, 40, baseDate),
    },
    {
      name: "Recovery Reload",
      compoundId: "tb-500",
      doseMcg: 2500,
      frequency: "weekly",
      durationDays: 42,
      startDate: isoOffset(4, 8, 0, baseDate),
      active: true,
      createdAt: isoOffset(-1, 9, 50, baseDate),
    },
    {
      name: "Pulse Day Off",
      compoundId: "ipamorelin",
      doseMcg: 200,
      frequency: "eod",
      durationDays: 30,
      startDate: isoOffset(-1, 7, 0, baseDate),
      active: true,
      timing: "fasted",
      createdAt: isoOffset(-4, 10, 0, baseDate),
    },
    {
      name: "Weekend Tissue Support",
      compoundId: "tb-500",
      doseMcg: 2500,
      frequency: "weekly",
      durationDays: 56,
      startDate: isoOffset(-2, 9, 0, baseDate),
      active: true,
      createdAt: isoOffset(-5, 10, 10, baseDate),
    },
    {
      name: "BPC Rehab Block",
      compoundId: "bpc-157",
      doseMcg: 300,
      frequency: "daily",
      durationDays: 21,
      startDate: isoOffset(-32, 9, 0, baseDate),
      active: false,
      createdAt: isoOffset(-33, 10, 20, baseDate),
    },
    {
      name: "Sleep Recovery Cycle",
      compoundId: "sermorelin",
      doseMcg: 250,
      frequency: "daily",
      durationDays: 14,
      startDate: isoOffset(-20, 20, 30, baseDate),
      active: false,
      timing: "pre-dinner",
      createdAt: isoOffset(-21, 10, 30, baseDate),
    },
  ];

  const doses: Omit<DoseLog, "id">[] = [
    {
      compoundId: "cjc-1295-no-dac",
      doseMcg: 150,
      siteId: "abdomen-left",
      timing: "fasted",
      skipped: false,
      loggedAt: isoOffset(0, 7, 30, baseDate),
    },
    {
      compoundId: "bpc-157",
      doseMcg: 350,
      siteId: "abdomen-right",
      timing: "post-workout",
      skipped: false,
      loggedAt: isoOffset(0, 13, 15, baseDate),
    },
    {
      compoundId: "ipamorelin",
      doseMcg: 200,
      siteId: "thigh-left",
      timing: "fasted",
      skipped: false,
      loggedAt: isoOffset(-2, 7, 40, baseDate),
    },
    {
      compoundId: "tb-500",
      doseMcg: 2500,
      siteId: "glute-right",
      skipped: false,
      loggedAt: isoOffset(-5, 18, 10, baseDate),
    },
    {
      compoundId: "ghk-cu",
      doseMcg: 1000,
      siteId: "arm-left",
      skipped: true,
      loggedAt: isoOffset(-1, 20, 0, baseDate),
    },
  ];

  const labs: Omit<LabMarker, "id">[] = COMMON_LAB_MARKERS.slice(0, 4).map((marker, index) => ({
    marker: marker.name,
    value: marker.refMin !== undefined && marker.refMax !== undefined
      ? Number((((marker.refMin + marker.refMax) / 2) * (1 + index * 0.03)).toFixed(2))
      : Number((10 + index * 2.5).toFixed(2)),
    unit: marker.unit,
    refMin: marker.refMin,
    refMax: marker.refMax,
    takenAt: isoOffset(-(14 - index * 2), 8, 0, baseDate),
    notes: "Seed reference result",
  }));

  const schedule = emptySchedule();
  schedule[todayDay].AM = [{ compoundId: "vitamin-d", caps: 1 }];
  schedule[todayDay].Mid = [{ compoundId: "magnesium", caps: 2 }];
  schedule[todayDay].PM = [{ compoundId: "urolithin-a", caps: 1 }];
  schedule[DAYS[(baseDate.getDay() + 1) % DAYS.length]].AM = [{ compoundId: "vitamin-d", caps: 1 }];
  schedule[DAYS[(baseDate.getDay() + 1) % DAYS.length]].Night = [{ compoundId: "magnesium", caps: 2 }];

  const layouts = {
    "Longevity AM/PM": schedule,
  };

  const weekStart = new Date(baseDate);
  weekStart.setDate(baseDate.getDate() - baseDate.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const insights = {
    [`${weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`]: {
      rangeKey: `${weekStart.toISOString()}-${weekEnd.toISOString()}`,
      generatedAt: baseDate.toISOString(),
      report: [
        `Range: ${weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
        "Doses logged: 4 · Skipped: 1",
        "Active protocols: 6",
        "Lab entries: 4",
        "",
        "By compound:",
        "  • BPC-157: 1",
        "  • CJC-1295 no DAC: 1",
        "  • Ipamorelin: 1",
        "  • TB-500: 1",
      ].join("\n"),
    },
  };

  return { vials, orals, protocols, doses, labs, schedule, layouts, insights };
}

async function shouldSeed() {
  if (!db || typeof window === "undefined") return false;
  if (window.localStorage.getItem(SEED_FLAG_KEY)) return false;

  const counts = await Promise.all([
    db.vials.count(),
    db.orals.count(),
    db.protocols.count(),
    db.doses.count(),
    db.labs.count(),
  ]);

  return counts.every((count) => count === 0);
}

export async function ensureDemoSeed() {
  if (!db || typeof window === "undefined") return;
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    if (!(await shouldSeed())) return;

    const seed = buildSeedData(new Date());

    await db.transaction("rw", [db.vials, db.orals, db.protocols, db.doses, db.labs], async () => {
      await db.vials.bulkAdd(seed.vials);
      await db.orals.bulkAdd(seed.orals);
      await db.protocols.bulkAdd(seed.protocols);
      await db.doses.bulkAdd(seed.doses);
      await db.labs.bulkAdd(seed.labs);
    });

    window.localStorage.setItem(PILL_BIN_KEY, JSON.stringify(seed.schedule));
    window.localStorage.setItem(PILL_LAYOUTS_KEY, JSON.stringify(seed.layouts));
    window.localStorage.setItem(INSIGHTS_KEY, JSON.stringify(seed.insights));
    window.localStorage.setItem(SEED_FLAG_KEY, new Date().toISOString());
  })();

  try {
    await seedPromise;
  } finally {
    seedPromise = null;
  }
}