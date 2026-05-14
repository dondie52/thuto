const PROGRAMMES_PATH = `${import.meta.env.BASE_URL}data/programmes.json`;

export async function fetchProgrammes(options = {}) {
  const { signal } = options;
  const response = await fetch(PROGRAMMES_PATH, { signal, cache: "no-store" });
  if (!response.ok) throw new Error("Could not load programmes");
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const UNIVERSITY_ALIASES = {
  ub: ["University of Botswana", "UB"],
  biust: ["BIUST", "Botswana International University of Science and Technology"],
  bac: ["Botswana School of Business Sciences", "BAC", "BSBS"],
  botho: ["Botho University", "Botho"],
  "ba-isago": ["BA ISAGO University", "BA ISAGO"],
  abm: ["ABM University College", "ABM"],
  limkokwing: ["Limkokwing University of Creative Technology", "Limkokwing"],
  "francistown-coe": ["Francistown College of Education"],
  gtc: ["Gaborone Technical College"],
  bou: ["Botswana Open University", "BOU"],
  boitekanelo: ["Boitekanelo College"],
  "new-era": ["New Era College"],
  gips: ["Gaborone Institute of Professional Studies", "GIPS"],
  bocodol: ["Botswana College of Distance and Open Learning", "BOCODOL"],
  bca: ["Botswana College of Agriculture"],
  "botswana-accountancy-training": ["Botswana Institute of Chartered Accountants Training Centre"],
  "chobe-brigade": ["Chobe Vocational Training Centre"],
  kgale: ["Kgale College"],
  bohss: ["Botswana Harvard Health Sciences"],
  idm: ["Institute of Development Management (IDM) Botswana", "Institute of Development Management", "IDM"],
  "fire-college": ["College of Fire & Safety (Fire College)", "College of Fire and Safety", "Fire College", "COFS"],
  lcibs: [
    "London College of International Business Studies (LCIBS) Botswana",
    "London College of International Business Studies",
    "LCIBS",
  ],
  bcet: ["Botswana College of Engineering and Technology (BCET)", "Botswana College of Engineering and Technology", "BCET"],
  fctve: [
    "Francistown College of Technical and Vocational Education",
    "Francistown College of Technical & Vocational Education",
  ],
  ihs: ["Institute of Health Sciences (IHS)", "Institute of Health Sciences", "IHS"],
  guc: ["Gaborone University College (GUC)", "Gaborone University College", "GUC"],
  "pillar-of-success": [
    "Pillar of Success Training Institute",
    "Pillar of Success",
    "Pillar of Success Training Institute Botswana",
  ],
  oodi: [
    "Oodi College of Applied Arts and Technology",
    "Oodi College of Applied Arts & Technology",
    "Oodi College of Applied Arts and Technology (OCAAT)",
    "OCAAT",
  ],
};

export function programmeBelongsToUniversity(programme, university) {
  const aliases = UNIVERSITY_ALIASES[university.id] ?? [university.name];
  const aliasSet = new Set(aliases.map(normalize));
  const short = normalize(programme.universityShort);
  const full = normalize(programme.university);
  return aliasSet.has(short) || aliasSet.has(full);
}
