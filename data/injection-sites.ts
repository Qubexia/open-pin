export type Side = "L" | "R";
export type Region =
  | "delt" | "rear-delt" | "shoulder" | "trap"
  | "bicep" | "tricep" | "forearm" | "upper-arm" | "back-arm"
  | "pec" | "chest"
  | "lat" | "upper-back" | "mid-back" | "lower-back"
  | "upper-abs" | "mid-abs" | "lower-abs" | "oblique" | "love-handle"
  | "glute"
  | "quad" | "hamstring" | "inner-thigh" | "outer-thigh" | "upper-thigh" | "thigh" | "adductor"
  | "calf";

export type InjectionSite = { id: string; side: Side; region: Region; label: string };

const REGIONS: Region[] = [
  "delt","rear-delt","shoulder","trap",
  "bicep","tricep","forearm","upper-arm","back-arm",
  "pec","chest",
  "lat","upper-back","mid-back","lower-back",
  "upper-abs","mid-abs","lower-abs","oblique","love-handle",
  "glute",
  "quad","hamstring","inner-thigh","outer-thigh","upper-thigh","thigh","adductor",
  "calf",
];

const titleCase = (s: string) =>
  s.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");

export const INJECTION_SITES: InjectionSite[] = (["L","R"] as Side[]).flatMap(side =>
  REGIONS.map(region => ({
    id: `${side.toLowerCase()}-${region}`,
    side,
    region,
    label: `${side} ${titleCase(region)}`,
  }))
);
