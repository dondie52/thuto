import {
  resolveProgrammeVisual,
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

const ubVisual = resolveProgrammeVisual({
  name: "BSc Computer Science",
  field: "Technology",
  university: "University of Botswana",
  universityShort: "UB",
});
assert(ubVisual.visualSource === "institution", "UB programme uses institution campus photo");
assert(ubVisual.imagePath === "university-campuses/ub.jpg", "UB programme resolves campus image path");
assert(ubVisual.label === "University of Botswana campus", "UB programme uses campus alt label");

const baIsagoVisual = resolveProgrammeVisual({
  name: "Bachelor of Commerce in Accounting",
  field: "Business",
  university: "BA ISAGO University",
  universityShort: "BA ISAGO",
});
assert(baIsagoVisual.visualSource === "institution", "BA ISAGO programme uses institution campus photo");
assert(baIsagoVisual.imagePath === "university-campuses/ba-isago.jpg", "BA ISAGO programme resolves campus image path");

const biustVisual = resolveProgrammeVisual({
  name: "BSc Data Science",
  field: "Technology",
  university: "BIUST",
});
assert(biustVisual.visualSource === "institution", "BIUST programme uses institution photo");
assert(biustVisual.imagePath === "university-campuses/biust.jpg", "BIUST programme resolves campus image path");

const buanVisual = resolveProgrammeVisual({
  name: "Bachelor of Science in Agriculture",
  field: "Agriculture",
  university: "Botswana University of Agriculture and Natural Resources",
  universityShort: "BUAN",
});
assert(buanVisual.visualSource === "institution", "BUAN programme uses institution photo");
assert(buanVisual.imagePath === "university-campuses/buan.jpg", "BUAN programme resolves campus image path");

const fallbackVisual = resolveProgrammeVisual({
  name: "Unknown Programme",
  field: "Business",
  university: "Unknown Institution",
});
assert(fallbackVisual.visualSource === "theme", "unknown institution keeps theme fallback");
assert(fallbackVisual.imagePath === "programme-themes/business.jpg", "unknown institution falls back to field theme");

const explicitVisual = resolveProgrammeVisual({
  name: "Custom Programme",
  field: "Business",
  university: "University of Botswana",
  coverImage: "custom/photo.jpg",
});
assert(explicitVisual.visualSource === "programme", "explicit cover image has priority");
assert(explicitVisual.imagePath === "custom/photo.jpg", "explicit cover path is preserved");

if (process.exitCode) {
  process.exit(process.exitCode);
}
console.log("All programme branding checks passed.");
