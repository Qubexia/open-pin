import type { Protocol, FrequencyUnit, ProtocolStep } from "./db";

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

export function currentStep(p: Protocol): { step: ProtocolStep; index: number } | null {
  if (!p.steps?.length) return null;
  let elapsed = daysElapsed(p.startDate);
  for (let i = 0; i < p.steps.length; i++) {
    if (elapsed < p.steps[i].durationDays) return { step: p.steps[i], index: i };
    elapsed -= p.steps[i].durationDays;
  }
  return null;
}

export function totalDuration(p: Protocol): number {
  if (p.steps?.length) return p.steps.reduce((s, st) => s + st.durationDays, 0);
  return p.durationDays;
}

export function daysRemaining(p: Protocol): number {
  const elapsed = daysElapsed(p.startDate);
  if (elapsed < 0) return totalDuration(p);
  return Math.max(0, totalDuration(p) - elapsed);
}

export function progressPct(p: Protocol): number {
  const elapsed = daysElapsed(p.startDate);
  if (elapsed <= 0) return 0;
  const total = totalDuration(p);
  if (!total) return 100;
  return Math.min(100, Math.round((elapsed / total) * 100));
}

export function isDue(p: Protocol): boolean {
  if (!p.active) return false;
  if (daysRemaining(p) === 0) return false;
  const elapsed = daysElapsed(p.startDate);
  if (elapsed < 0) return false;
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
  return step ? step.step.doseMcg : p.doseMcg;
}
