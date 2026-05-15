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
  buan: "university-logos/buan.jpg",
  "naledi-training-institute": "university-logos/naledi.jpg",
  gips: "university-logos/gips.jpeg",
  idm: "university-logos/idm.jpeg",
  guc: "university-logos/guc.jpeg",
  oodi: "university-logos/oodi.jpeg",
  "botswana-accountancy-training": "university-logos/botswana-accountancy-training.jpeg",
  "serowe-coe": "university-logos/serowe-coe.jpeg",
  "tlokweng-coe": "university-logos/tlokweng-coe.jpeg",
  "molepolole-coe": "university-logos/molepolole-coe.jpeg",
  "cep-training": "university-logos/cep-training.jpeg",
  gcca: "university-logos/gcca.jpeg",
  tebelopele: "university-logos/tebelopele.jpeg",
  "insurance-training-institute": "university-logos/insurance-training-institute.jpeg",
  realic: "university-logos/realic.jpeg",
  bibf: "university-logos/bibf.jpeg",
  "awil-college": "university-logos/awil-college.jpeg",
  "elsimate-institute": "university-logos/elsimate-institute.jpeg",
  "nampol-college-of-education": "university-logos/nampol-college-of-education.jpeg",
};

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
  if (university?.logo) return university.logo;
  return UNIVERSITY_LOGO_BY_ID[university?.id] || "";
}
