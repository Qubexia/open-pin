// Organ load + safety flag overlays applied at module load. Centralized here
// so we don't need to edit every entry inline.

import type { OrganLoad, SafetyFlag } from "./compounds";

export const ORGAN_LOAD_OVERLAY: Record<string, OrganLoad> = {
  // GLP-1s — primarily GI tract & pancreas
  "semaglutide": { giTract: 7, pituitary: 1, kidneys: 2 },
  "tirzepatide": { giTract: 8, kidneys: 2 },
  "retatrutide": { giTract: 8, liver: 3, kidneys: 2 },
  "cagrilintide": { giTract: 5 },
  "liraglutide": { giTract: 6, kidneys: 2 },
  "survodutide": { giTract: 7, liver: 3 },

  // GH-axis peptides
  "cjc-1295-no-dac": { pituitary: 6 },
  "cjc-1295-with-dac": { pituitary: 7, liver: 2 },
  "ipamorelin": { pituitary: 5 },
  "hexarelin": { pituitary: 7, heart: 3 },
  "ghrp-2": { pituitary: 6, mast: 4 },
  "ghrp-6": { pituitary: 6, mast: 5, giTract: 3 },
  "sermorelin": { pituitary: 5 },
  "tesamorelin": { pituitary: 5 },
  "igf-1-lr3": { liver: 5, neurons: 2 },
  "mk-677": { pituitary: 7, giTract: 2 },
  "hgh-frag": { liver: 2 },

  // Healing peptides
  "bpc-157": { giTract: 2, bloodVessels: 2 },
  "tb-500": { mast: 1, bloodVessels: 1 },
  "ghk-cu": { liver: 1 },

  // Hormones
  "test-cyp": { heart: 3, liver: 2 },
  "nandrolone-dec": { kidneys: 3, heart: 2 },
  "oxytocin": { neurons: 3 },
  "kisspeptin": { pituitary: 5 },
  "gonadorelin": { pituitary: 6 },
  "anastrozole": { liver: 3 },
  "enclomiphene": { liver: 2 },

  // Nootropics / stimulants
  "modafinil": { neurons: 4, heart: 3, liver: 2 },
  "methylene-blue": { neurons: 3, kidneys: 2 },
  "caffeine": { heart: 4, neurons: 3 },

  // Senolytics / longevity
  "rapamycin": { liver: 4, neurons: 1 },
  "fisetin": { liver: 1 },
  "dasatinib-quercetin": { liver: 4 },
  "epithalon": { pituitary: 1 },

  // Bioregulators (low load by design)
  "thymalin": { neurons: 1 },
  "thymogen": { neurons: 1 },
  "pinealon": { neurons: 2 },

  // Sexual
  "pt-141": { mast: 4, bloodVessels: 3 },
  "mt-ii": { mast: 6, neurons: 3, bloodVessels: 4 },

  // Vitamins / supplements
  "berberine": { giTract: 2, liver: 1 },
  "metformin": { giTract: 4, liver: 2, kidneys: 2 },
  "nad-injectable": { liver: 1 },
  "tadalafil": { bloodVessels: 3, heart: 2 },
};

export const SAFETY_FLAG_OVERLAY: Record<string, SafetyFlag[]> = {
  "semaglutide": ["insulin-sensitivity"],
  "tirzepatide": ["insulin-sensitivity"],
  "retatrutide": ["insulin-sensitivity"],
  "liraglutide": ["insulin-sensitivity"],
  "cagrilintide": ["insulin-sensitivity"],
  "survodutide": ["insulin-sensitivity"],

  "mk-677": ["insulin-sensitivity"],
  "igf-1-lr3": ["insulin-sensitivity", "tumor-growth"],
  "cjc-1295-with-dac": ["tumor-growth"],
  "ghrp-6": ["mast-cell-degranulation"],
  "ghrp-2": ["mast-cell-degranulation"],
  "hexarelin": ["mast-cell-degranulation"],

  "test-cyp": ["androgenic", "estrogenic", "hpta-suppression"],
  "nandrolone-dec": ["androgenic", "hpta-suppression"],
  "anastrozole": ["estrogenic"],
  "enclomiphene": ["hpta-suppression"],

  "modafinil": ["bp-elevation", "qt-prolongation"],
  "tadalafil": ["bp-elevation", "qt-prolongation"],
  "caffeine": ["bp-elevation", "cardiovascular-load"],

  "rapamycin": ["immunosuppressive"],
  "dasatinib-quercetin": ["immunosuppressive", "qt-prolongation"],

  "pt-141": ["mast-cell-degranulation", "bp-elevation"],
  "mt-ii": ["mast-cell-degranulation", "carcinogenic"],

  "metformin": ["insulin-sensitivity"],
  "berberine": ["insulin-sensitivity"],
};
