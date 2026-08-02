export const UNIVERSITY_LOGO_BY_ID = {
  ub: "university-logos/ub.jpg",
  biust: "university-logos/biust.jpg",
  bac: "university-logos/bac.jpg",
  botho: "university-logos/botho.jpg",
  "ba-isago": "university-logos/ba-isago.jpg",
  abm: "university-logos/abm.jpg",
  limkokwing: "university-logos/limkokwing.jpg",
  bou: "university-logos/bou.jpg",
  boitekanelo: "university-logos/boitekanelo.jpg",
  "new-era": "university-logos/new-era.jpg",
  fctve: "university-logos/fctve.jpg",
  isbs: "university-logos/isbs.png",
  "fire-college": "university-logos/fire-college.png",
  lcibs: "university-logos/lcibs.png",
  "logan-business-college": "university-logos/logan-business-college.png",
  "gaborone-commercial-college": "university-logos/gaborone-commercial-college.png",
  gtc: "university-logos/gtc.jpeg",
  bcet: "university-logos/bcet.jpeg",
  ihs: "university-logos/ihs.jpeg",
  "pillar-of-success": "university-logos/pillar-of-success.jpeg",
  buan: "university-logos/buan.jpg",
  "mega-size-college": "university-logos/mega-size-college.jpeg",
  "bosa-bosele": "university-logos/bosa-bosele.jpeg",
  "naledi-training-institute": "university-logos/naledi.jpg",
  gips: "university-logos/gips.jpeg",
  idm: "university-logos/idm.jpeg",
  guc: "university-logos/guc.jpeg",
  oodi: "university-logos/oodi.jpeg",
  "roads-training-centre": "university-logos/roads-training-centre.jpeg",
  "dawn-training": "university-logos/dawn-training.jpeg",
  learneasy: "university-logos/learneasy.jpeg",
  stargems: "university-logos/stargems.jpeg",
  "homeland-college": "university-logos/homeland-college.jpeg",
  "botswana-accountancy-training": "university-logos/botswana-accountancy-training.jpeg",
  "serowe-coe": "university-logos/serowe-coe.jpeg",
  "tlokweng-coe": "university-logos/tlokweng-coe.jpeg",
  "molepolole-coe": "university-logos/molepolole-coe.jpeg",
  "cep-training": "university-logos/cep-training.jpeg",
  gcca: "university-logos/gcca.jpeg",
  tebelopele: "university-logos/tebelopele.jpeg",
  "byte-size-college": "university-logos/byte-size-college.jpeg",
  "insurance-training-institute": "university-logos/insurance-training-institute.jpeg",
  realic: "university-logos/realic.jpeg",
  crackit: "university-logos/crackit.jpeg",
  "palapye-technical-college": "university-logos/palapye-technical-college.jpeg",
  bibf: "university-logos/bibf.jpeg",
  "tonota-coe": "university-logos/tonota-coe.jpeg",
  aafm: "university-logos/aafm.jpeg",
  "africa-insurance-training-institute": "university-logos/africa-insurance-training-institute.jpeg",
  "awil-college": "university-logos/awil-college.jpeg",
  "delta-training-academy": "university-logos/delta-training-academy.jpeg",
  "elsimate-institute": "university-logos/elsimate-institute.jpeg",
  "nampol-college-of-education": "university-logos/nampol-college-of-education.jpeg",
  "kanye-sda-nursing": "university-logos/kanye-sda-nursing.svg",
};

const CAMPUS_DIR = "university-campuses";

/** Institution IDs used for logo, campus photo, and alias resolution. */
export const UNIVERSITY_KNOWN_IDS = new Set(Object.keys(UNIVERSITY_LOGO_BY_ID));

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
    university?.canonicalName,
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

function pickEmbeddedAcronym(label) {
  const acronyms = label
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => /^[A-Z0-9]{2,6}$/.test(word));
  return acronyms[0] || "";
}

export function deriveUniversityInitials(university) {
  const shortName = String(university?.shortName || "").trim();
  if (shortName) return shortName.toUpperCase();

  const label = String(university?.name || "").trim();
  if (!label) return "UNI";

  const embeddedAcronym = pickEmbeddedAcronym(label);
  if (embeddedAcronym) return embeddedAcronym.slice(0, 6);

  const id = resolveUniversityId(university);
  const aliasAcronyms = UNIVERSITY_ALIASES_BY_ID[id] || [];
  const knownAcronym = aliasAcronyms.map((alias) => pickEmbeddedAcronym(alias)).find(Boolean);
  if (knownAcronym) return knownAcronym.slice(0, 6);

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
  // Bundled university data is the canonical source; keep the map as a safety net.
  const explicit = typeof university?.logo === "string" ? university.logo.trim() : "";
  if (explicit) return explicit;
  const id = university?.id || resolveUniversityId(university);
  return UNIVERSITY_LOGO_BY_ID[id] || "";
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
