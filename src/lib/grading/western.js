import { defineProfile, descendingNumeric, letterLadder } from "./builders.js";

/**
 * WAEC/WASSCE grades run A1 (best) to F9 (fail). Credit passes are A1-C6, and the aggregate
 * of the best six is what admission cut-offs quote — a *lower* aggregate is stronger, so 6 is
 * a perfect score and 24 is a common cut-off.
 */
const WASSCE_GRADES = descendingNumeric({
  from: 1,
  to: 9,
  values: { 1: "A1", 2: "B2", 3: "B3", 4: "C4", 5: "C5", 6: "C6", 7: "D7", 8: "E8", 9: "F9" },
  bands: { 1: "A*", 2: "A", 3: "A", 4: "B", 5: "C", 6: "C", 7: "D", 8: "E", 9: "U" },
  labels: {
    1: "A1 — Excellent",
    2: "B2 — Very good",
    3: "B3 — Good",
    4: "C4 — Credit",
    5: "C5 — Credit",
    6: "C6 — Credit",
    7: "D7 — Pass",
    8: "E8 — Pass",
    9: "F9 — Fail",
  },
});

export const WESTERN_PROFILES = {
  wassce_gh: defineProfile({
    id: "wassce_gh",
    label: "WASSCE — West African Senior School Certificate (Ghana)",
    abbreviation: "WASSCE",
    aliases: ["wassce", "waec", "ghana", "west african", "shs"],
    countries: ["gh"],
    region: "western",
    verified: true,
    sourceNote: "WAEC A1–F9 where A1 is strongest. Admission quotes the aggregate of the best six (6 is perfect).",
    grades: WASSCE_GRADES,
    direction: "lower_better",
    subjectsCounted: 6,
    aggregate: "aggregatePoints",
    aggregateLabel: "Best-six aggregate (lower is better)",
    helpText:
      "WASSCE aggregate of your best six subjects — 6 is the strongest possible, and many programmes cut off around 24.",
    examBoards: ["igcse", "bgcse"],
  }),

  wassce_ng: defineProfile({
    id: "wassce_ng",
    label: "WASSCE / SSCE — Nigeria (WAEC or NECO)",
    abbreviation: "WAEC",
    aliases: ["waec", "neco", "ssce", "nigeria", "wassce nigeria", "o level nigeria"],
    countries: ["ng"],
    region: "western",
    verified: true,
    sourceNote:
      "WAEC/NECO A1–F9. Nigerian admission normally requires five credit passes including English and Mathematics, plus a separate JAMB UTME score which Thuto does not model.",
    grades: WASSCE_GRADES,
    direction: "lower_better",
    subjectsCounted: 5,
    aggregate: "aggregatePoints",
    aggregateLabel: "Best-five aggregate (lower is better)",
    helpText:
      "Five credit passes including English and Mathematics are the usual minimum. Your JAMB UTME score is assessed separately.",
    examBoards: ["igcse", "bgcse"],
  }),

  gce_cm: defineProfile({
    id: "gce_cm",
    label: "Cameroon GCE",
    abbreviation: "GCE",
    aliases: ["cameroon", "gce cameroon", "cameroon gce board"],
    countries: ["cm"],
    region: "central",
    verified: false,
    sourceNote:
      "Cameroon GCE Ordinary and Advanced Level letter grades. Point convention not confirmed against the GCE Board.",
    grades: letterLadder({ A: 8, B: 7, C: 6, D: 5, E: 4, U: 0 }),
    subjectsCounted: 6,
    aggregate: "bestSix",
    aggregateLabel: "Best-six total",
    helpText: "Cameroon GCE Ordinary Level letter grades (guidance scale).",
    examBoards: ["igcse", "bgcse"],
  }),
};
