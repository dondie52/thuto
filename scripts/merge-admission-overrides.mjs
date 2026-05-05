/**
 * Merges optional per-programme admission overrides and BIUST defaults into programmes.json.
 *
 * 1) scripts/data/admission-overrides.json — array of { id, minPoints?, subjectRequirements?, minPointsSource?, minPointsTier? }
 * 2) BIUST stubs: applies converted minimum from official entry requirements (see scripts/ADMISSIONS-MINPOINTS.md)
 *
 * Usage: node scripts/merge-admission-overrides.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const progPath = path.join(root, "public/data/programmes.json");
const overridePath = path.join(__dirname, "data/admission-overrides.json");

/** BIUST official institutional minimum is >=39 on the official BGCSE scale (A*=A=8…). Thuto now uses the same scale, so no conversion is needed. */
const BIUST_OFFICIAL_FLOOR = 39;

const BIUST_FIELD_DEFAULTS = {
  Engineering: {
    minPoints: 44,
    subjectRequirements: { math: "A", science: "B", english: "C" },
    minPointsSource:
      "BIUST entry-requirements (https://www.biust.ac.bw/entry-requirements/): programme-level bar aligned with existing curated BIUST engineering rows until prospectus confirms each programme.",
    minPointsTier: "converted_official",
  },
  "Natural Sciences": {
    minPoints: BIUST_OFFICIAL_FLOOR,
    subjectRequirements: { english: "D", math: "C", science: "C" },
    minPointsSource:
      "BIUST entry-requirements page; institutional floor (combined six-subject score >=39 on the official BGCSE A=8 scale).",
    minPointsTier: "converted_official",
  },
  Technology: {
    minPoints: 43,
    subjectRequirements: { math: "B", science: "C", english: "C" },
    minPointsSource:
      "BIUST entry-requirements; level aligned with existing curated BSc Data Science row until programme-specific values are added.",
    minPointsTier: "converted_official",
  },
  Business: {
    minPoints: BIUST_OFFICIAL_FLOOR,
    subjectRequirements: { english: "D", math: "C", science: "C" },
    minPointsSource:
      "BIUST entry-requirements page; institutional floor on the official BGCSE A=8 scale (see ADMISSIONS-MINPOINTS.md).",
    minPointsTier: "converted_official",
  },
};

function applyBiustDefaults(programmes) {
  let n = 0;
  for (const p of programmes) {
    if (p.university !== "BIUST") continue;
    if (typeof p.minPoints === "number" && Number.isFinite(p.minPoints)) continue;
    const def = BIUST_FIELD_DEFAULTS[p.field];
    if (!def) continue;
    p.minPoints = def.minPoints;
    p.subjectRequirements = { ...(p.subjectRequirements || {}), ...def.subjectRequirements };
    p.minPointsSource = def.minPointsSource;
    p.minPointsTier = def.minPointsTier;
    n++;
  }
  return n;
}

function main() {
  const programmes = JSON.parse(fs.readFileSync(progPath, "utf8"));
  const byId = new Map(programmes.map((p) => [p.id, p]));

  let fromFile = 0;
  if (fs.existsSync(overridePath)) {
    const raw = JSON.parse(fs.readFileSync(overridePath, "utf8"));
    const rows = Array.isArray(raw) ? raw : [];
    for (const row of rows) {
      if (!row || typeof row.id !== "string") continue;
      const p = byId.get(row.id);
      if (!p) continue;
      if (row.minPoints != null) p.minPoints = row.minPoints;
      if (row.subjectRequirements && typeof row.subjectRequirements === "object") {
        p.subjectRequirements = { ...(p.subjectRequirements || {}), ...row.subjectRequirements };
      }
      if (row.minPointsSource != null) p.minPointsSource = row.minPointsSource;
      if (row.minPointsTier != null) p.minPointsTier = row.minPointsTier;
      fromFile++;
    }
  }

  const biustN = applyBiustDefaults(programmes);
  fs.writeFileSync(progPath, `${JSON.stringify(programmes, null, 2)}\n`);
  console.error(`Admission overrides: ${fromFile} rows from admission-overrides.json; BIUST defaults applied: ${biustN}.`);
}

main();
