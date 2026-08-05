import { bandedScale, defineProfile } from "./builders.js";

export const NORTHERN_PROFILES = {
  bac_20: defineProfile({
    id: "bac_20",
    label: "Baccalauréat (francophone, /20)",
    abbreviation: "BAC",
    aliases: [
      "bac",
      "baccalaureat",
      "baccalaureate",
      "sur 20",
      "mention",
      "moyenne",
      "maroc",
      "morocco",
      "senegal",
      "cote d'ivoire",
      "tunisie",
      "algerie",
    ],
    countries: ["ma", "sn", "ci", "tn", "dz", "ml", "bf", "bj", "tg", "ne", "cm", "ga", "cd"],
    region: "northern",
    verified: true,
    sourceNote:
      "Mentions: Passable 10–11.99, Assez Bien 12–13.99, Bien 14–15.99, Très Bien 16+. Verified for Morocco and Senegal; other francophone systems follow the same /20 convention.",
    grades: bandedScale([
      { value: 18, label: "18–20 — Excellent", band: "A*" },
      { value: 16, label: "16–17.99 — Très Bien", band: "A" },
      { value: 14, label: "14–15.99 — Bien", band: "B" },
      { value: 12, label: "12–13.99 — Assez Bien", band: "C" },
      { value: 10, label: "10–11.99 — Passable (admis)", band: "D" },
      { value: 8, label: "8–9.99 — Insuffisant", band: "F" },
      { value: 0, label: "Below 8 — Échec", band: "U" },
    ]),
    // Per-subject entry rather than a single moyenne: subject requirements ("english": "C")
    // can only be evaluated if Thuto knows the individual notes, and students have them.
    subjectsCounted: 6,
    minPerSubject: 0,
    maxPerSubject: 20,
    aggregate: "average20",
    aggregateLabel: "Best-six total /20 per subject",
    helpText:
      "Enter the note for each subject out of 20, or the closest mention. Southern African institutions assess francophone qualifications case by case.",
    examBoards: ["igcse", "bgcse"],
  }),

  thanaweya: defineProfile({
    id: "thanaweya",
    label: "Thanaweya Amma — Egypt",
    abbreviation: "Thanaweya",
    aliases: ["thanaweya", "thanaweya amma", "egypt", "tansiq", "egyptian secondary"],
    countries: ["eg"],
    region: "northern",
    verified: false,
    sourceNote:
      "Scored as a percentage of the total. Placement runs through the tansiq system with cut-offs that change every year; those are not encoded here.",
    grades: bandedScale([
      { value: 95, label: "95–100%", band: "A*" },
      { value: 85, label: "85–94%", band: "A" },
      { value: 75, label: "75–84%", band: "B" },
      { value: 65, label: "65–74%", band: "C" },
      { value: 55, label: "55–64%", band: "D" },
      { value: 50, label: "50–54%", band: "E" },
      { value: 0, label: "Below 50%", band: "U" },
    ]),
    subjectsCounted: 6,
    minPerSubject: 0,
    maxPerSubject: 100,
    aggregate: "percentage",
    aggregateLabel: "Best-six subject percentages",
    helpText:
      "Enter the percentage band for each subject. Egyptian placement runs through tansiq and its cut-offs change each year.",
    examBoards: ["igcse", "bgcse"],
  }),
};
