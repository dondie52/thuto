import {
  getProgrammeAboutSummary,
  getProgrammeCampusLocation,
  isGenericProgrammeDescription,
} from "../src/lib/programmeInsights.js";

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`ok: ${message}`);
  }
}

assert(
  isGenericProgrammeDescription("Programme at Boitekanelo College. Confirm entry requirements with the institution."),
  "detects generic programme placeholder copy",
);

const radiography = {
  id: "boitekanelo-bsc-diagnostic-radiography",
  name: "BSc Diagnostic Radiography",
  field: "Health",
  university: "Boitekanelo College",
  minPoints: 36,
  duration: "4 years",
  description: "Programme at Boitekanelo College. Admission points are taken from the 2026 course brochure.",
};

assert(
  getProgrammeCampusLocation(radiography, "Gaborone") === "Gaborone",
  "falls back to university location when campus is missing",
);

assert(
  getProgrammeCampusLocation({ campus: "Francistown" }, "Gaborone") === "Francistown",
  "prefers programme campus when listed",
);

const summary = getProgrammeAboutSummary(radiography);
assert(summary.includes("BSc Diagnostic Radiography"), "summary names the programme");
assert(summary.includes("36"), "summary mentions minimum points");
assert(!summary.includes("2026 course brochure"), "summary avoids generic brochure placeholder");

const curated = {
  ...radiography,
  description:
    "Clinical imaging degree covering X-ray, CT, and MRI practice with supervised hospital placements across Botswana.",
};
assert(
  getProgrammeAboutSummary(curated) === curated.description,
  "uses curated description when it is not generic",
);

if (process.exitCode) process.exit(process.exitCode);
console.log("All programme insight checks passed.");
