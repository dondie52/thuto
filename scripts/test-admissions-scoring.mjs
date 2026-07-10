import {
  computeBestSixBreakdown,
  parseDoubleAwardGrades,
  rowsToRequirementGrades,
  scienceDoubleAwardPoints,
} from "../src/lib/admissions.js";
import { SCIENCE_DOUBLE_SUBJECT_ID } from "../src/lib/bgcseSubjects.js";

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`ok: ${message}`);
  }
}

assert(scienceDoubleAwardPoints("C", "C") === 12, "Science Double Award CC = 12 points");
assert(scienceDoubleAwardPoints("B", "B") === 14, "Science Double Award BB = 14 points");

const parsed = parseDoubleAwardGrades("CC");
assert(parsed?.grade1 === "C" && parsed?.grade2 === "C", "parseDoubleAwardGrades parses CC");

const breakdown = computeBestSixBreakdown([
  { subjectId: SCIENCE_DOUBLE_SUBJECT_ID, grade: "C", grade2: "C" },
  { subjectId: "english", grade: "B" },
  { subjectId: "mathematics", grade: "B" },
  { subjectId: "biology", grade: "A" },
  { subjectId: "setswana", grade: "B" },
  { subjectId: "geography", grade: "C" },
  { subjectId: "history", grade: "D" },
]);

assert(breakdown.invalid == null, "best-six breakdown has no invalid state");
assert(breakdown.total >= 12, "best-six includes doubled science points");
const scienceEntry = breakdown.counted.find((entry) => entry.subjectId === SCIENCE_DOUBLE_SUBJECT_ID);
assert(scienceEntry?.points === 12, "counted science double award shows 12 pts");
assert(scienceEntry?.grade === "CC", "counted science double award displays CC");

const requirements = rowsToRequirementGrades([
  { subjectId: SCIENCE_DOUBLE_SUBJECT_ID, grade: "B", grade2: "C" },
  { subjectId: "mathematics", grade: "A" },
]);
assert(requirements.science === "C", "science requirement uses weaker double-award component");
assert(requirements.math === "A", "math requirement unchanged");

const incomplete = computeBestSixBreakdown([
  { subjectId: SCIENCE_DOUBLE_SUBJECT_ID, grade: "C", grade2: "" },
]);
assert(incomplete.invalid != null, "missing second component is invalid");

if (process.exitCode) {
  process.exit(process.exitCode);
}
