export type CommonLabMarker = {
  name: string;
  unit: string;
  refMin?: number;
  refMax?: number;
};

export const COMMON_LAB_MARKERS: CommonLabMarker[] = [
  { name: "Total Testosterone", unit: "ng/dL", refMin: 300, refMax: 1000 },
  { name: "Free Testosterone", unit: "pg/mL", refMin: 50, refMax: 210 },
  { name: "Estradiol (E2)", unit: "pg/mL", refMin: 10, refMax: 40 },
  { name: "SHBG", unit: "nmol/L", refMin: 16, refMax: 55 },
  { name: "LH", unit: "mIU/mL", refMin: 1.7, refMax: 8.6 },
  { name: "FSH", unit: "mIU/mL", refMin: 1.5, refMax: 12.4 },
  { name: "IGF-1", unit: "ng/mL", refMin: 88, refMax: 246 },
  { name: "GH", unit: "ng/mL", refMin: 0, refMax: 3 },
  { name: "TSH", unit: "mIU/L", refMin: 0.4, refMax: 4.0 },
  { name: "Free T4", unit: "ng/dL", refMin: 0.8, refMax: 1.8 },
  { name: "DHEA-S", unit: "mcg/dL", refMin: 80, refMax: 560 },
  { name: "Cortisol (AM)", unit: "mcg/dL", refMin: 6, refMax: 23 },
  { name: "Prolactin", unit: "ng/mL", refMin: 2, refMax: 18 },
  { name: "Glucose (Fasting)", unit: "mg/dL", refMin: 70, refMax: 99 },
  { name: "HbA1c", unit: "%", refMin: 0, refMax: 5.7 },
  { name: "Insulin (Fasting)", unit: "mcIU/mL", refMin: 2, refMax: 19 },
  { name: "Total Cholesterol", unit: "mg/dL", refMin: 0, refMax: 200 },
  { name: "LDL", unit: "mg/dL", refMin: 0, refMax: 100 },
  { name: "HDL", unit: "mg/dL", refMin: 40, refMax: 999 },
  { name: "Triglycerides", unit: "mg/dL", refMin: 0, refMax: 150 },
  { name: "hsCRP", unit: "mg/L", refMin: 0, refMax: 1 },
  { name: "Hemoglobin", unit: "g/dL", refMin: 13.5, refMax: 17.5 },
  { name: "Hematocrit", unit: "%", refMin: 38.3, refMax: 48.6 },
  { name: "ALT", unit: "U/L", refMin: 0, refMax: 56 },
  { name: "AST", unit: "U/L", refMin: 0, refMax: 40 },
  { name: "Creatinine", unit: "mg/dL", refMin: 0.7, refMax: 1.3 },
  { name: "PSA", unit: "ng/mL", refMin: 0, refMax: 4 },
];