import {
  deriveUniversityInitials,
  resolveUniversityLogo,
} from "../src/lib/universityBranding.js";

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`ok: ${message}`);
  }
}

assert(
  deriveUniversityInitials({ name: "BIUST" }) === "BIUST",
  "BIUST acronym is preserved",
);

assert(
  deriveUniversityInitials({
    name: "Botswana International University of Science & Technology",
  }) === "BIUST",
  "full BIUST name with ampersand derives to BIUST",
);

assert(
  deriveUniversityInitials({ name: "College of Fire & Safety (Fire College)" }) === "CFS",
  "Fire College name no longer resolves to ampersand",
);

assert(
  deriveUniversityInitials({ shortName: "Fire College", name: "College of Fire & Safety (Fire College)" }) === "FIRE COLLEGE",
  "shortName takes precedence",
);

assert(
  deriveUniversityInitials({ name: "University of Botswana" }) === "UB",
  "University of Botswana derives to UB",
);

assert(
  deriveUniversityInitials({ name: "BA ISAGO University" }) === "BA",
  "BA ISAGO keeps BA token",
);

assert(
  resolveUniversityLogo({ id: "ub", logo: "university-logos/ub.jpg" }) === "university-logos/ub.jpg",
  "explicit logo path is preferred",
);

assert(
  resolveUniversityLogo({ id: "biust" }) === "university-logos/biust.jpg",
  "bundled logo map covers BIUST",
);

assert(resolveUniversityLogo({ id: "unknown-college-xyz" }) === "", "missing logo returns empty string");
