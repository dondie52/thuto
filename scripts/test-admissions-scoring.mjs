import {
  computeBestSixBreakdown,
  evaluateProgramme,
  meetsSubjectRequirement,
  parseDoubleAwardGrades,
  rowsToRequirementGrades,
  scienceDoubleAwardPoints,
} from "../src/lib/admissions.js";
import { SCIENCE_DOUBLE_SUBJECT_ID } from "../src/lib/bgcseSubjects.js";
import { attainmentIndex, getGradingProfile, requiredIndexFromMinPoints } from "../src/lib/gradingSystems.js";

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

// ---------------------------------------------------------------------------
// Cross-syllabus matching
//
// Programme requirements are BGCSE letters, so numeric-grade systems have to resolve onto the
// canonical band ladder. Before this worked, every NSC and ECZ student failed every subject
// requirement and saw "Not eligible" across the whole catalogue.
// ---------------------------------------------------------------------------

const nscRequirements = rowsToRequirementGrades(
  [
    { subjectId: "english", grade: "5" },
    { subjectId: "mathematics", grade: "4" },
  ],
  "nsc_matric",
);
assert(nscRequirements.english === "B", "NSC level 5 maps to band B");
assert(meetsSubjectRequirement(nscRequirements.english, "C"), "NSC level 5 satisfies a 'C' requirement");
assert(meetsSubjectRequirement(nscRequirements.math, "C"), "NSC level 4 satisfies a 'C' requirement");
assert(!meetsSubjectRequirement(nscRequirements.math, "A"), "NSC level 4 does not satisfy an 'A' requirement");

const eczRequirements = rowsToRequirementGrades(
  [
    { subjectId: "english", grade: "3" },
    { subjectId: "mathematics", grade: "8" },
  ],
  "ecz",
);
assert(eczRequirements.english === "B", "ECZ grade 3 maps to band B");
assert(meetsSubjectRequirement(eczRequirements.english, "B"), "ECZ grade 3 satisfies a 'B' requirement");
assert(!meetsSubjectRequirement(eczRequirements.math, "C"), "ECZ grade 8 does not satisfy a 'C' requirement");

// On a lower-is-better scale the counted subjects must be the *smallest* numbers.
const eczBreakdown = computeBestSixBreakdown(
  [
    { subjectId: "english", grade: "1" },
    { subjectId: "mathematics", grade: "2" },
    { subjectId: "biology", grade: "3" },
    { subjectId: "geography", grade: "4" },
    { subjectId: "history", grade: "5" },
    { subjectId: "setswana", grade: "6" },
    { subjectId: "physics", grade: "9" },
  ],
  "ecz",
);
assert(eczBreakdown.total === 21, `ECZ best-six counts the six lowest grades (got ${eczBreakdown.total})`);
assert(
  eczBreakdown.dropped.some((entry) => entry.points === 9),
  "ECZ drops the weakest (highest-numbered) grade",
);

// WASSCE aggregates the same way: 6 is perfect, 24 is a common cut-off.
const wassce = getGradingProfile("wassce_gh");
assert(wassce.aggregateBest === 6 && wassce.aggregateWorst === 54, "WASSCE aggregate runs 6 (best) to 54");
const wassce24 = attainmentIndex(24, wassce);
assert(Math.round(wassce24 * 10) / 10 === 62.5, `WASSCE aggregate 24 is index 62.5 (got ${wassce24})`);

// BGCSE behaviour must be bit-for-bit unchanged: index and threshold stay in lockstep.
const bgcse = getGradingProfile("bgcse");
for (const points of [24, 30, 36, 42, 48]) {
  assert(
    Math.abs(attainmentIndex(points, bgcse) - requiredIndexFromMinPoints(points)) < 1e-9,
    `BGCSE ${points} pts sits exactly on the threshold for minPoints ${points}`,
  );
}

const programme = { id: "t", name: "T", university: "U", minPoints: 36, subjectRequirements: { english: "C" } };
const qualified = evaluateProgramme(programme, { english: "B" }, 36, { syllabusType: "bgcse" });
assert(qualified.status === "Qualified", "BGCSE 36 pts qualifies for a 36-pt programme");

const close = evaluateProgramme(programme, { english: "B" }, 33, { syllabusType: "bgcse" });
assert(close.status === "Close", `BGCSE 33 pts is Close to a 36-pt programme (got ${close.status})`);

const far = evaluateProgramme(programme, { english: "B" }, 20, { syllabusType: "bgcse" });
assert(far.status === "Not eligible", "BGCSE 20 pts is not eligible for a 36-pt programme");

// A South African student with strong results now gets a real answer instead of "Not eligible".
const nscResult = evaluateProgramme(programme, nscRequirements, 36, { syllabusType: "nsc_matric" });
assert(nscResult.status === "Qualified", `NSC APS 36 qualifies for a 36-pt programme (got ${nscResult.status})`);
assert(nscResult.estimated === true, "non-BGCSE results are flagged as estimated");
assert(nscResult.bgcseEquivalent === 40, `NSC APS 36 converts to about 40/48 (got ${nscResult.bgcseEquivalent})`);

if (process.exitCode) {
  process.exit(process.exitCode);
}
