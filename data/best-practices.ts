export type PracticeSection = {
  id: string;
  title: string;
  category: "practice" | "mix" | "goals" | "reference";
  body: string[];
};

export const PRACTICES: PracticeSection[] = [
  {
    id: "multi-vial-contamination",
    title: "Avoiding Multi-Vial Contamination",
    category: "practice",
    body: [
      "Use a fresh sterile syringe + needle for every vial draw to avoid cross-contamination.",
      "If reusing a syringe across vials, draw the most-stable / cleanest first and the most-vulnerable last.",
      "Wipe the rubber stopper with 70% IPA before every puncture and let it air-dry.",
      "Never push contaminated air or solution back into a clean vial.",
    ],
  },
  {
    id: "critical-safety",
    title: "Critical Safety Rules",
    category: "practice",
    body: [
      "Bacteriostatic water (BAC) only for reconstitution — NEVER tap water or saline.",
      "Always inspect for cloudiness, discoloration, or particulates before injecting.",
      "Rotate sites every dose. Same site reuse risks scarring, lipohypertrophy, and infection.",
      "Disclose all peptides/compounds to your physician before any procedure.",
    ],
  },
  {
    id: "bioregulator-rules",
    title: "Bioregulator Rules",
    category: "practice",
    body: [
      "Khavinson bioregulators are gentle — typical course is 10–20 days, 1–2× per year per organ.",
      "Oral capsules dissolve under the tongue 10–15 min before food; injectables go subQ.",
      "Don't stack >3 bioregulators at once unless following an established protocol.",
    ],
  },
  {
    id: "mixing-best-practices",
    title: "Mixing Best Practices",
    category: "mix",
    body: [
      "Default to pinning alone unless you have specific compatibility data.",
      "Compatibility depends on charge, vehicle, and free-thiol presence — never assume.",
      "GHK-Cu must always be drawn separately — free thiols on partner peptides reduce Cu²⁺.",
      "Oil-based and aqueous compounds NEVER mix in the same syringe.",
    ],
  },
  {
    id: "needle-guidance",
    title: "Needle Guidance",
    category: "practice",
    body: [
      "SubQ: 29–31G × 1/2\" (insulin syringes) — slim and minimal trauma.",
      "IM: 23–25G × 1\" for arms, 22–23G × 1.5\" for glutes/thigh.",
      "Always use a NEW needle for each injection. Recapping is OK if needed for transport, but never reuse.",
    ],
  },
  {
    id: "oral-compound-tips",
    title: "Oral Compound Tips",
    category: "practice",
    body: [
      "Capsule peptides (oral KPV, Larazotide, oral bioregulators) — take fasted, 30 min before food.",
      "Lipid-soluble vitamins (A, D, E, K) — take with a fat-containing meal.",
      "Stimulants/nootropics — split doses to avoid afternoon stim affecting sleep.",
    ],
  },
  {
    id: "color-legend",
    title: "Color Legend",
    category: "reference",
    body: [
      "Green: compatible / synergistic / OK to combine.",
      "Yellow: caution — possible interaction or careful timing.",
      "Red: incompatible — pin or dose alone.",
      "Gray: unknown — no documented data; default to pinning alone.",
    ],
  },
  {
    id: "shelf-life",
    title: "Shelf Life Color Guide",
    category: "reference",
    body: [
      "Lyophilized (powder) at 2–8°C: typically 24+ months sealed.",
      "Reconstituted in BAC water at 2–8°C: 30 days for most peptides; 7–14 days for fragile ones (BPC, GLP-1s vary).",
      "Frozen: most reconstituted peptides last 6+ months but freeze-thaw cycles degrade them — divide into single-use aliquots.",
    ],
  },
  {
    id: "interaction-tiers",
    title: "Interaction Tiers",
    category: "reference",
    body: [
      "Tier 1 (Synergistic ✦): Combine in the same syringe for additive/synergistic effect.",
      "Tier 2 (Compatible ✓): Safe to combine; no significant interaction.",
      "Tier 3 (Caution !): Possible interaction — separate sites or stagger timing.",
      "Tier 4 (Incompatible ✕): Pin alone — chemical or pharmacological incompatibility.",
    ],
  },
  {
    id: "administration-routes",
    title: "Administration Routes",
    category: "reference",
    body: [
      "SubQ (subcutaneous): under skin into fat — most peptides default here.",
      "IM (intramuscular): into muscle — required for oil-based steroids and some long-acting peptides.",
      "Oral: capsules, sublingual, or troches — bypassed by GI for sublingual.",
      "Intranasal: spray to nasal mucosa — Selank, Semax, oxytocin.",
      "Transdermal: skin patches/creams — slow release.",
      "IV: intravenous — research / clinical setting only, never DIY.",
    ],
  },
  {
    id: "long-term-storage",
    title: "Long-Term Storage",
    category: "reference",
    body: [
      "Lyophilized peptides: -20°C freezer, light-protected, desiccated.",
      "Pre-aliquot BAC water reconstitutions for daily use; store rest at 2–8°C.",
      "Avoid repeated freeze-thaw — divide before freezing.",
      "Label every vial with reconstitution date + concentration.",
    ],
  },
  {
    id: "reconstitution-best-practices",
    title: "Reconstitution Best Practices",
    category: "mix",
    body: [
      "Wipe vial stopper with 70% IPA before puncturing.",
      "Inject BAC water slowly down the side of the vial wall — do not shoot directly onto the powder.",
      "Swirl gently; never shake. Shaking shears peptide bonds.",
      "Wait 2–5 minutes for full dissolution before drawing.",
    ],
  },
  {
    id: "vial-inspection",
    title: "Vial Inspection Guide",
    category: "practice",
    body: [
      "Powder should be uniform white/off-white. Yellow tint may indicate degradation.",
      "After reconstitution: clear, colorless solution. Cloudiness, particulates, or strong color = discard.",
      "Stopper should be intact and not pushed in. Crimp seal must be tight.",
    ],
  },
  {
    id: "purity-quality",
    title: "Quality & Purity Verification",
    category: "practice",
    body: [
      "Reputable suppliers provide HPLC + MS certificates of analysis (CoA) for every batch.",
      "Look for ≥98% purity on HPLC. Mass spec should match expected molecular weight.",
      "Independent third-party testing (Janoshik, etc.) is the gold standard.",
    ],
  },
  {
    id: "cycle-planning",
    title: "Cycle Planning Fundamentals",
    category: "goals",
    body: [
      "Define a clear goal: healing, fat-loss, recomposition, longevity, cognitive.",
      "Pick compounds with evidence for that goal — avoid kitchen-sink stacking.",
      "Plan duration + off-time. Most peptides cycle 4–12 weeks on, 4+ weeks off.",
      "Get baseline labs before starting and post-cycle labs to assess.",
    ],
  },
  {
    id: "tolerance",
    title: "Tolerance & Receptor Desensitization",
    category: "goals",
    body: [
      "GHRP-class peptides desensitize ghrelin receptors with constant use — pulse dosing preserves response.",
      "GLP-1 agonists: GI side effects diminish with steady dose; receptor function persists.",
      "MT-II / PT-141: melanocortin receptor down-regulation possible; cycle off.",
    ],
  },
  {
    id: "injection-technique",
    title: "Injection Technique",
    category: "practice",
    body: [
      "Pinch fat fold for subQ. Insert needle at 45–90° depending on body fat.",
      "Aspirate (pull plunger back) for IM to avoid intravascular injection.",
      "Inject slowly (3–5 sec) to minimize tissue trauma and local reactions.",
      "Apply gentle pressure post-injection — do not rub.",
    ],
  },
  {
    id: "disposal",
    title: "Disposal & Sharps Safety",
    category: "practice",
    body: [
      "Never recap a used needle (except briefly for transport with one-handed scoop technique).",
      "Use FDA-approved sharps container or rigid puncture-resistant container with a lid.",
      "Dispose at pharmacy take-back, household hazardous waste, or mail-back program.",
    ],
  },
  {
    id: "self-injection-psychology",
    title: "Self-Injection Psychology",
    category: "practice",
    body: [
      "Set up everything before unwrapping the needle — reduces hesitation.",
      "Sit/lie down for first few injections in case of vasovagal response.",
      "Distract yourself (music, TV) — anticipation is worse than reality.",
      "It gets easier. By dose 5–10 it's routine.",
    ],
  },
  {
    id: "supplement-considerations",
    title: "Supplement-Specific Considerations",
    category: "practice",
    body: [
      "Fat-soluble vitamins accumulate — don't mega-dose chronically without bloodwork.",
      "Iron, calcium, zinc compete for absorption — separate by 2+ hours.",
      "Cycle adaptogens (Ashwagandha, Rhodiola) — take breaks every 6–8 weeks.",
    ],
  },
  {
    id: "ppe-sterility",
    title: "PPE & Sterility",
    category: "practice",
    body: [
      "Wash hands with soap for 20+ seconds before any draw.",
      "Use alcohol pads (70% IPA) on injection site and vial stopper.",
      "Work on a clean, flat surface free of pets/dust.",
      "Wear nitrile gloves for added sterility (especially if doing many vials).",
    ],
  },
  {
    id: "faq",
    title: "Frequently Asked Questions",
    category: "reference",
    body: [
      "Q: Can I mix BPC-157 and TB-500? A: Yes — both are aqueous, charge-compatible.",
      "Q: Do I need to refrigerate during shipping? A: Lyophilized peptides tolerate 2–4 days at room temp.",
      "Q: How long does a 5mg BPC vial reconstituted in 2mL last? A: ~30 days at 2–8°C.",
      "Q: Subcutaneous vs intramuscular for peptides? A: SubQ is the default for most research peptides.",
    ],
  },
];

export const TABS: { id: PracticeSection["category"]; label: string }[] = [
  { id: "practice", label: "Practices" },
  { id: "mix", label: "Mix Guide" },
  { id: "goals", label: "Goals" },
  { id: "reference", label: "References" },
];
