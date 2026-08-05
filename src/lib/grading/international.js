import { ascendingNumeric, defineProfile } from "./builders.js";

export const INTERNATIONAL_PROFILES = {
  ib_dp: defineProfile({
    id: "ib_dp",
    label: "IB Diploma Programme",
    abbreviation: "IB",
    aliases: ["ib", "international baccalaureate", "ib diploma", "dp"],
    countries: [],
    region: "international",
    level: "advanced",
    verified: true,
    sourceNote: "IB subject grades 1–7 across six subjects, plus up to 3 bonus points (max 45).",
    grades: ascendingNumeric({
      from: 1,
      to: 7,
      bands: { 7: "A*", 6: "A", 5: "B", 4: "C", 3: "D", 2: "E", 1: "U" },
      labels: {
        7: "7 — Excellent",
        6: "6 — Very good",
        5: "5 — Good",
        4: "4 — Satisfactory",
        3: "3 — Mediocre",
        2: "2 — Poor",
        1: "1 — Very poor",
      },
    }),
    subjectsCounted: 6,
    aggregate: "ibTotal",
    aggregateLabel: "Six-subject total",
    helpText:
      "Six IB subject grades (max 42). The 3 bonus points from Theory of Knowledge and the Extended Essay are not counted here.",
    examBoards: ["igcse", "bgcse"],
  }),
};
