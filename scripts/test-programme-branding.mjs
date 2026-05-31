import {
  resolveProgrammeThemeKey,
  themeKeyFromField,
} from "../src/lib/programmeBranding.js";

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`ok: ${message}`);
  }
}

assert(themeKeyFromField("Engineering") === "engineering", "Engineering field maps to engineering");
assert(themeKeyFromField("Health Sciences") === "health", "Health Sciences normalizes to health");
assert(themeKeyFromField("Safety") === "fire-safety", "Safety field maps to fire-safety");

assert(
  resolveProgrammeThemeKey({ name: "Certificate V in Fire Safety", field: "General" }) === "fire-safety",
  "fire safety keyword overrides General field"
);

assert(
  resolveProgrammeThemeKey({ id: "bcet-diploma-in-mechanical-engineering", name: "Diploma in Mechanical Engineering", field: "Engineering" }) ===
    "engineering",
  "BCET mechanical engineering uses engineering theme"
);

assert(
  resolveProgrammeThemeKey({ name: "Private Pilot Licence", field: "General", tags: [] }) === "aviation",
  "aviation keyword on pilot programme"
);

assert(
  resolveProgrammeThemeKey({ name: "Fire Safety Engineering", field: "Professional" }) === "fire-safety",
  "fire safety engineering uses fire-safety theme"
);

assert(
  resolveProgrammeThemeKey({ name: "BSc Computer Science", field: "Technology" }) === "technology",
  "computer science maps to technology"
);

assert(
  resolveProgrammeThemeKey({ name: "BA History", field: "Humanities" }) === "education",
  "humanities maps to education theme"
);

assert(
  resolveProgrammeThemeKey({ name: "Unknown Programme", field: "Mystery Field" }) === "default-bw",
  "unknown field falls back to default-bw"
);

if (process.exitCode) {
  process.exit(process.exitCode);
}
console.log("All programme branding checks passed.");
