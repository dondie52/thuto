/**
 * Keeps the JS grading registry and the Supabase syllabus_types seed in sync.
 *
 * These drift silently and expensively: an id that exists in JS but not in the table fails the
 * profiles foreign key at save time, and a profile whose examBoards match nothing in the subject
 * catalogue renders a predictor with an empty subject dropdown.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GRADING_PROFILES, SYLLABI_BY_COUNTRY } from "../src/lib/gradingSystems.js";
import { BGCSE_SUBJECTS } from "../src/lib/bgcseSubjects.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIGRATION = path.join(root, "supabase/migrations/20260805130000_syllabus_registry.sql");

const failures = [];
function check(condition, message) {
  if (condition) {
    console.log(`ok: ${message}`);
  } else {
    console.error(`FAIL: ${message}`);
    failures.push(message);
  }
}

const jsIds = Object.keys(GRADING_PROFILES);

// --- JS registry vs the migration seed ------------------------------------------------------
const sql = readFileSync(MIGRATION, "utf8");
const seedBlock = sql.slice(
  sql.indexOf("insert into public.syllabus_types"),
  sql.indexOf("on conflict (id) do update set"),
);
const sqlIds = [...seedBlock.matchAll(/^\s*\('([a-z0-9_]+)'/gm)].map((m) => m[1]);

const missingInSql = jsIds.filter((id) => !sqlIds.includes(id));
const missingInJs = sqlIds.filter((id) => !jsIds.includes(id));
check(missingInSql.length === 0, `every JS profile is seeded in SQL${missingInSql.length ? ` (missing: ${missingInSql.join(", ")})` : ""}`);
check(missingInJs.length === 0, `every seeded id exists in JS${missingInJs.length ? ` (missing: ${missingInJs.join(", ")})` : ""}`);

// The nine ids that predate the registry must survive, or existing profiles break.
const LEGACY_IDS = ["bgcse", "igcse", "as_level", "o_level", "nssc", "zimsec_o", "zimsec_a", "ecz", "nsc_matric"];
const droppedLegacy = LEGACY_IDS.filter((id) => !jsIds.includes(id));
check(droppedLegacy.length === 0, `all legacy syllabus ids still exist${droppedLegacy.length ? ` (dropped: ${droppedLegacy.join(", ")})` : ""}`);

// --- Per-profile invariants -----------------------------------------------------------------
const subjectBoards = new Set(BGCSE_SUBJECTS.flatMap((subject) => subject.examBoards || []));

for (const [id, profile] of Object.entries(GRADING_PROFILES)) {
  const problems = [];
  if (profile.id !== id) problems.push("id does not match its key");
  if (!profile.abbreviation) problems.push("no abbreviation to search by");
  if (!profile.grades.length) problems.push("no grades");
  if (!profile.aggregateLabel) problems.push("no aggregate label");
  if (!profile.helpText) problems.push("no help text");
  if (!profile.verified && !profile.sourceNote) problems.push("unverified but no sourceNote explaining why");
  if (profile.aggregateBest === profile.aggregateWorst) problems.push("aggregate range is degenerate");

  // Without an overlapping exam board the subject dropdown renders empty.
  if (!profile.examBoards.some((board) => subjectBoards.has(board))) {
    problems.push(`examBoards ${JSON.stringify(profile.examBoards)} match no subject in bgcseSubjects.js`);
  }

  for (const grade of profile.grades) {
    if (!grade.band) problems.push(`grade ${grade.value} has no canonical band`);
    if (!Number.isFinite(grade.points)) problems.push(`grade ${grade.value} has non-numeric points`);
  }

  check(problems.length === 0, `${id} is well formed${problems.length ? `: ${problems.join("; ")}` : ""}`);
}

// --- Country defaults -----------------------------------------------------------------------
for (const [country, ids] of Object.entries(SYLLABI_BY_COUNTRY)) {
  const unknown = ids.filter((id) => !jsIds.includes(id));
  check(unknown.length === 0, `${country} default list resolves${unknown.length ? ` (unknown: ${unknown.join(", ")})` : ""}`);
}

// --- Search reachability --------------------------------------------------------------------
// Every profile has to be findable by its own abbreviation, or it is unreachable in the picker.
const { searchSyllabi } = await import("../src/lib/gradingSystems.js");
for (const [id, profile] of Object.entries(GRADING_PROFILES)) {
  const found = searchSyllabi(profile.abbreviation).some((p) => p.id === id);
  check(found, `${id} is findable by searching "${profile.abbreviation}"`);
}

console.log(`\n${jsIds.length} syllabus profiles checked.`);
if (failures.length) {
  console.error(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}
