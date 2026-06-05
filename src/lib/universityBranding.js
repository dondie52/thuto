const CAMPUS_DIR = "university-campuses";

/** Institution IDs used for campus photo and alias resolution (logos disabled for compliance). */
export const UNIVERSITY_KNOWN_IDS = new Set([
  "ub",
  "biust",
  "bac",
  "botho",
  "ba-isago",
  "abm",
  "limkokwing",
  "bou",
  "boitekanelo",
  "new-era",
  "fctve",
  "isbs",
  "fire-college",
  "lcibs",
  "logan-business-college",
  "gaborone-commercial-college",
  "gtc",
  "bcet",
  "ihs",
  "pillar-of-success",
  "buan",
  "mega-size-college",
  "bosa-bosele",
  "naledi-training-institute",
  "gips",
  "idm",
  "guc",
  "oodi",
  "roads-training-centre",
  "dawn-training",
  "learneasy",
  "stargems",
  "homeland-college",
  "botswana-accountancy-training",
  "serowe-coe",
  "tlokweng-coe",
  "molepolole-coe",
  "cep-training",
  "gcca",
  "tebelopele",
  "byte-size-college",
  "insurance-training-institute",
  "realic",
  "crackit",
  "palapye-technical-college",
  "bibf",
  "tonota-coe",
  "aafm",
  "africa-insurance-training-institute",
  "awil-college",
  "delta-training-academy",
  "elsimate-institute",
  "nampol-college-of-education",
  "kanye-sda-nursing",
]);

export const UNIVERSITY_CAMPUS_PHOTO_BY_ID = {
  abm: `${CAMPUS_DIR}/abm.jpg`,
  ub: `${CAMPUS_DIR}/ub.jpg`,
  biust: `${CAMPUS_DIR}/biust.jpg`,
  "ba-isago": `${CAMPUS_DIR}/ba-isago.jpg`,
  boitekanelo: `${CAMPUS_DIR}/boitekanelo.jpg`,
  buan: `${CAMPUS_DIR}/buan.jpg`,
  gips: `${CAMPUS_DIR}/gips.jpg`,
  idm: `${CAMPUS_DIR}/idm.jpg`,
  isbs: `${CAMPUS_DIR}/isbs.jpg`,
  "nampol-college-of-education": `${CAMPUS_DIR}/nampol-college-of-education.jpg`,
  "new-era": `${CAMPUS_DIR}/new-era.jpg`,
};

const UNIVERSITY_NAME_BY_ID = {
  abm: "ABM University College",
  ub: "University of Botswana",
  biust: "BIUST",
  "ba-isago": "BA ISAGO University",
  boitekanelo: "Boitekanelo College",
  buan: "Botswana University of Agriculture and Natural Resources",
  gips: "Gaborone Institute of Professional Studies",
  idm: "Institute of Development Management",
  isbs: "Imperial School of Business and Science",
  "nampol-college-of-education": "Nampol College of Education",
  "new-era": "New Era College",
};

const UNIVERSITY_CAMPUS_PHOTO_LABEL_BY_ID = {
  abm: "ABM University College campus building",
  ub: "University of Botswana campus",
  biust: "BIUST campus community",
  "ba-isago": "BA ISAGO University campus life",
  boitekanelo: "Boitekanelo College students",
  buan: "BUAN campus life",
  gips: "Gaborone Institute of Professional Studies staff",
  idm: "Institute of Development Management learning space",
  isbs: "Imperial School of Business and Science campus",
  "nampol-college-of-education": "Nampol College of Education graduates",
  "new-era": "New Era College campus building",
};

const UNIVERSITY_ALIASES_BY_ID = {
  abm: ["ABM University College", "ABM"],
  ub: ["University of Botswana", "UB"],
  biust: ["BIUST", "Botswana International University of Science and Technology"],
  "ba-isago": ["BA ISAGO University", "BA ISAGO"],
  boitekanelo: ["Boitekanelo College", "Boitekanelo"],
  buan: ["Botswana University of Agriculture and Natural Resources", "BUAN"],
  gips: ["Gaborone Institute of Professional Studies", "GIPS"],
  idm: ["Institute of Development Management (IDM) Botswana", "Institute of Development Management", "IDM"],
  isbs: ["Imperial School of Business and Science", "ISBS"],
  "nampol-college-of-education": ["Nampol College of Education", "Nampol College Of Education", "NCE"],
  "new-era": ["New Era College"],
};

function normalizeUniversity(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function resolveUniversityId(university) {
  const directId = String(university?.id || "").trim();
  if (directId && (UNIVERSITY_KNOWN_IDS.has(directId) || UNIVERSITY_CAMPUS_PHOTO_BY_ID[directId])) {
    return directId;
  }

  const candidates = [
    university?.university,
    university?.universityShort,
    university?.name,
    university?.shortName,
  ].map(normalizeUniversity);

  for (const [id, aliases] of Object.entries(UNIVERSITY_ALIASES_BY_ID)) {
    const normalizedAliases = aliases.map(normalizeUniversity);
    if (candidates.some((candidate) => candidate && normalizedAliases.includes(candidate))) {
      return id;
    }
  }

  return "";
}

export function deriveUniversityInitials(university) {
  const shortName = String(university?.shortName || "").trim();
  if (shortName) return shortName.toUpperCase();

  const label = String(university?.name || "").trim();
  if (!label) return "UNI";

  const upperAcronym = label
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => (word === word.toUpperCase() && word.length <= 6 ? word : ""))
    .filter(Boolean);
  if (upperAcronym.length) return upperAcronym[0].slice(0, 6);

  const initials = label
    .replace(/[()&]/g, " ")
    .split(/\s+/)
    .filter((word) => word && !["of", "and", "the", "in"].includes(word.toLowerCase()))
    .slice(0, 3)
    .map((word) => word[0]?.toUpperCase() || "")
    .join("");
  return initials || label.slice(0, 3).toUpperCase();
}

export function resolveUniversityLogo(university) {
  if (import.meta.env.VITE_SHOW_OFFICIAL_LOGOS === "true") {
    const logo = university?.logo;
    return typeof logo === "string" ? logo.trim() : "";
  }
  return "";
}

export function resolveUniversityCampusPhoto(university) {
  const explicitPhoto = university?.campusPhoto || university?.campusImage;
  if (explicitPhoto) {
    const name = String(university?.name || university?.university || university?.universityShort || "Institution").trim();
    return { imagePath: String(explicitPhoto).trim(), label: `${name} campus` };
  }

  const id = resolveUniversityId(university);
  const imagePath = UNIVERSITY_CAMPUS_PHOTO_BY_ID[id] || "";
  if (!imagePath) return null;

  const label =
    UNIVERSITY_CAMPUS_PHOTO_LABEL_BY_ID[id] ||
    `${UNIVERSITY_NAME_BY_ID[id] || university?.name || university?.university || "Institution"} campus`;
  return { id, imagePath, label };
}
