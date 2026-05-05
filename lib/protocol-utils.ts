import type { Protocol, FrequencyUnit } from "./db";

const MS_DAY = 86_400_000;

export const FREQ_LABELS: Record<FrequencyUnit, string> = {
  daily: "Every day",
  eod: "Every other day",
  "3x-week": "3× / week",
  weekly: "Once a week",
  "every-x-days": "Every X days",
};

export const TIMING_LABELS: Record<string, string> = {
  fasted: "Fasted",
  "pre-workout": "Pre-workout",
  "post-workout": "Post-workout",
  "pre-dinner": "Pre-dinner",
  "post-dinner": "Post-dinner",
};

export function daysElapsed(startDate: string): number {
  return Math.floor((Date.now() - new Date(startDate).getTime()) / MS_DAY);
}

export function currentStep(p: Protocol): { step: typeof p.steps extends undefined ? null : NonNullable<typeof p.steps>[0]; index: number } | null {
  if (!p.steps?.length) return null;
  let elapsed = daysElapsed(p.startDate);
  for (let i = 0; i < p.steps.length; i++) {
    if (elapsed < p.steps[i].durationDays) return { step: p.steps[i] as any, index: i };
    elapsed -= p.steps[i].durationDays;
  }
  return null;
}

export function totalDuration(p: Protocol): number {
  if (p.steps?.length) return p.steps.reduce((s, st) => s + st.durationDays, 0);
  return p.durationDays;
}

export function daysRemaining(p: Protocol): number {
  return Math.max(0, totalDuration(p) - daysElapsed(p.startDate));
}

export function progressPct(p: Protocol): number {
  const total = totalDuration(p);
  if (!total) return 100;
  return Math.min(100, Math.round((daysElapsed(p.startDate) / total) * 100));
}

export function isDue(p: Protocol): boolean {
  if (!p.active) return false;
  if (daysRemaining(p) === 0) return false;
  const elapsed = daysElapsed(p.startDate);
  switch (p.frequency) {
    case "daily": return true;
    case "eod": return elapsed % 2 === 0;
    case "3x-week": return [1, 3, 5].includes(new Date().getDay());
    case "weekly": return new Date().getDay() === new Date(p.startDate).getDay();
    case "every-x-days": return p.frequencyXDays ? elapsed % p.frequencyXDays === 0 : true;
  }
}

export function effectiveDose(p: Protocol): number {
  const step = currentStep(p);
  return step ? (step.step as any).doseMcg : p.doseMcg;
}
