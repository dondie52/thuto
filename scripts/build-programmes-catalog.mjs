/**
 * Merges stub programme rows into public/data/programmes.json.
 * Run from repo root: node scripts/build-programmes-catalog.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const mainPath = path.join(root, "public/data/programmes.json");

function fieldForUb(name, urlPath) {
  const n = name.toLowerCase();
  const p = urlPath.toLowerCase();
  if (p.includes("/law/") || n.includes("llb") || n.includes("laws")) return "Humanities";
  if (p.includes("/medicine/")) return "Health";
  if (p.includes("/health-sciences/")) return "Health";
  if (p.includes("/education/")) return "Education";
  if (p.includes("/engineering-and-technology/")) return "Engineering";
  if (p.includes("/business/")) return "Business";
  if (
    n.includes("computer science") ||
    n.includes("information technology") ||
    (n.includes("computing") && n.includes("finance")) ||
    (n.includes("information systems") && p.includes("/science/"))
  ) {
    return "Technology";
  }
  if (p.includes("/science/")) return "Natural Sciences";
  if (p.includes("/social-sciences/")) return "Humanities";
  if (p.includes("/humanities/")) return "Humanities";
  return "Humanities";
}

function durationForName(name) {
  const n = name.toLowerCase();
  if (n.startsWith("diploma in") || n.startsWith("diploma ")) return { duration: "2 years", durationYears: 2 };
  if (n.startsWith("certificate")) return { duration: "1 year", durationYears: 1 };
  if (n.includes("post graduate diploma")) return { duration: "1 year", durationYears: 1 };
  return { duration: "4 years", durationYears: 4 };
}

function parseUbFromDump() {
  const dumpPath = path.join(__dirname, "ub-programmes-page.txt");
  if (!fs.existsSync(dumpPath)) return [];
  const text = fs.readFileSync(dumpPath, "utf8");
  const gradIdx = text.indexOf("\nGraduate\n");
  const undergrad = gradIdx >= 0 ? text.slice(0, gradIdx) : text;
  const re = /\[([^\]]+)\]\((https:\/\/www\.ub\.bw\/programmes[^)]+)\)/g;
  const rows = [];
  let m;
  while ((m = re.exec(undergrad)) !== null) {
    rows.push({ name: m[1].trim(), url: m[2].trim() });
  }
  const skipNames = new Set(["bsc computer science", "ba economics", "bsc biology"]);
  const out = [];
  const seenId = new Set();
  for (const { name, url } of rows) {
    if (skipNames.has(name.toLowerCase())) continue;
    if (/\/(master-|mphil|executive-)/i.test(url)) continue;
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    const slug = parts[parts.length - 1] || "programme";
    const id = `ub-${slug}`
      .replace(/[^a-z0-9-]/gi, "-")
      .replace(/-+/g, "-")
      .toLowerCase();
    if (seenId.has(id)) continue;
    seenId.add(id);
    const field = fieldForUb(name, url);
    const { duration, durationYears } = durationForName(name);
    const facultySeg = parts[1] ? parts[1].replace(/-/g, " ") : "";
    out.push({
      id,
      name,
      field,
      university: "University of Botswana",
      universityShort: "UB",
      minPoints: null,
      subjectRequirements: {},
      duration,
      durationYears,
      description:
        "Undergraduate programme at the University of Botswana. Confirm entry requirements and duration on the official page.",
      officialUrl: url,
      applyUrl: "https://www.ub.bw/admissions",
      faculty: facultySeg ? facultySeg.replace(/\b\w/g, (c) => c.toUpperCase()) : undefined,
      modules: [],
      careers: [],
    });
  }
  return out;
}

function otherInstitutionStubs() {
  const bothoBase = "https://www.bothouniversity.ac.bw/";
  const bothoApply = "https://www.bothouniversity.ac.bw/admissions";
  const botho = [
    ["botho-bcom-supply-chain", "Bachelor of Commerce in Supply Chain Management", "Business"],
    ["botho-bcom-hospitality", "Bachelor of Commerce in Hospitality Management", "Business"],
    ["botho-bcom-investment-banking", "Bachelor of Commerce in Investment and Banking", "Business"],
    ["botho-bcom-finance", "Bachelor of Commerce in Finance", "Business"],
    ["botho-bcom-general-accounting", "Bachelor of Commerce in General Accounting", "Business"],
    ["botho-bba-business-mgmt", "Bachelor of Business Administration in Business Management", "Business"],
    ["botho-beng-electronics-comm", "Bachelor of Engineering in Electronics and Communication Engineering", "Engineering"],
    ["botho-btech-software-eng", "Bachelor of Technology in Software Engineering", "Technology"],
    ["botho-beng-electrical", "Bachelor of Engineering in Electrical Engineering", "Engineering"],
    ["botho-bsc-network-security-forensics", "Bachelor of Science in Network Security and Computer Forensics", "Technology"],
    ["botho-bsc-cyber-security-risk", "Bachelor of Science in Cyber Security and Risk Management", "Technology"],
    ["botho-bsc-analytics", "Bachelor of Science in Analytics", "Technology"],
    ["botho-bsc-health-info-mgmt", "Bachelor of Science in Health Information Management", "Health"],
    ["botho-bsc-she", "Bachelor of Science in Safety, Health and Environmental Management", "Health"],
    ["botho-bsc-health-informatics", "Bachelor of Science in Health Informatics", "Health"],
    ["botho-bsc-hospital-admin", "Bachelor of Science in Hospital Administration", "Health"],
    ["botho-bsc-public-health", "Bachelor of Science in Public Health", "Health"],
    ["botho-bed-secondary", "Bachelor of Education (Secondary)", "Education"],
    ["botho-bed-primary", "Bachelor of Education (Primary)", "Education"],
    ["botho-bcom-marketing", "Bachelor of Commerce in Marketing", "Business"],
    ["botho-bcom-hrm", "Bachelor of Commerce in Human Resource Management", "Business"],
    ["botho-bcom-entrepreneurship", "Bachelor of Commerce in Entrepreneurship", "Business"],
  ].map(([id, name, field]) => ({
    id,
    name,
    field,
    university: "Botho University",
    universityShort: "Botho",
    minPoints: null,
    subjectRequirements: {},
    duration: "4 years",
    durationYears: 4,
    description: "Programme at Botho University. Confirm entry requirements on the official prospectus.",
    officialUrl: bothoBase,
    applyUrl: bothoApply,
    modules: [],
    careers: [],
  }));

  const biustApply = "https://www.biust.ac.bw/admissions";
  const biustSite = "https://www.biust.ac.bw/";
  const biust = [
    ["biust-bsc-mathematics", "BSc Mathematics", "Natural Sciences"],
    ["biust-bsc-biological-sciences", "BSc Biological Sciences", "Natural Sciences"],
    ["biust-bsc-chemistry", "BSc Chemistry", "Natural Sciences"],
    ["biust-bsc-physics-general", "BSc Physics", "Natural Sciences"],
    ["biust-bsc-geology", "BSc Geology", "Natural Sciences"],
    ["biust-beng-civil", "BEng Civil Engineering", "Engineering"],
    ["biust-beng-mining", "BEng Mining Engineering", "Engineering"],
    ["biust-beng-industrial", "BEng Industrial Engineering", "Engineering"],
    ["biust-bsc-statistics", "BSc Statistics", "Natural Sciences"],
    ["biust-bsc-information-systems", "BSc Information Systems", "Technology"],
    ["biust-bsc-software-eng", "BSc Software Engineering", "Technology"],
    ["biust-bsc-finance", "BSc Finance", "Business"],
    ["biust-bsc-economics", "BSc Economics", "Business"],
    ["biust-bsc-business-admin", "BSc Business Administration", "Business"],
  ].map(([id, name, field]) => ({
    id,
    name,
    field,
    university: "BIUST",
    universityShort: "BIUST",
    minPoints: null,
    subjectRequirements: {},
    duration: "4 years",
    durationYears: 4,
    description: "Programme at BIUST. Confirm entry requirements with the institution.",
    officialUrl: biustSite,
    applyUrl: biustApply,
    modules: [],
    careers: [],
  }));

  const bacApply = "https://thitoacademics.bac.ac.bw/";
  const bacSite = "https://www.bac.ac.bw/";
  const bacDescription =
    "Programme at Botswana School of Business Sciences (BSBS). Teaching is blended (face-to-face and online). Prospectus cut-off points are guides only—confirm entry requirements on official materials.";
  const bac = [
    ["bac-bcom-finance", "BCom Finance", "Business"],
    ["bac-bcom-marketing", "BCom Marketing", "Business"],
    ["bac-bcom-hrm", "BCom Human Resource Management", "Business"],
    ["bac-bcom-economics", "BCom Economics", "Business"],
    ["bac-diploma-accounting", "Diploma in Accounting", "Business"],
    ["bac-diploma-business", "Diploma in Business Management", "Business"],
    ["bac-bsc-it", "BSc Information Technology", "Technology"],
  ].map(([id, name, field]) => ({
    id,
    name,
    field,
    university: "Botswana School of Business Sciences",
    universityShort: "BAC",
    minPoints: null,
    subjectRequirements: {},
    duration: name.includes("Diploma") ? "2 years" : "3 years",
    durationYears: name.includes("Diploma") ? 2 : 3,
    description: bacDescription,
    officialUrl: bacSite,
    applyUrl: bacApply,
    modules: [],
    careers: [],
  }));

  const baisago = [
    ["baisago-bcom-accounting", "BCom Accounting", "Business"],
    ["baisago-bcom-finance", "BCom Finance", "Business"],
    ["baisago-bba-general", "BBA General Management", "Business"],
    ["baisago-bcom-marketing", "BCom Marketing", "Business"],
    ["baisago-diploma-hrm", "Diploma in Human Resource Management", "Business"],
  ].map(([id, name, field]) => ({
    id,
    name,
    field,
    university: "BA ISAGO University",
    universityShort: "BA ISAGO",
    minPoints: null,
    subjectRequirements: {},
    duration: "4 years",
    durationYears: 4,
    description: "Programme at BA ISAGO University. Confirm entry requirements with the institution.",
    officialUrl: "https://www.baisago.ac.bw/",
    applyUrl: "https://www.baisago.ac.bw/admissions",
    modules: [],
    careers: [],
  }));

  const abm = [
    ["abm-bed-secondary", "BEd Secondary Education", "Education"],
    ["abm-bba", "BBA Business Administration", "Business"],
    ["abm-bcom-accounting", "BCom Accounting", "Business"],
    ["abm-diploma-nursing", "Diploma in Nursing", "Health"],
    ["abm-bsc-midwifery", "BSc Midwifery", "Health"],
    ["abm-diploma-pharmacy-tech", "Diploma in Pharmacy Technology", "Health"],
  ].map(([id, name, field]) => ({
    id,
    name,
    field,
    university: "ABM University College",
    universityShort: "ABM",
    minPoints: null,
    subjectRequirements: {},
    duration: name.includes("Diploma") ? "3 years" : "4 years",
    durationYears: name.includes("Diploma") ? 3 : 4,
    description: "Programme at ABM University College. Confirm entry requirements with the institution.",
    officialUrl: "https://www.abm.ac.bw/",
    applyUrl: "https://www.abm.ac.bw/",
    modules: [],
    careers: [],
  }));

  const limkokwing = [
    ["limkokwing-ba-multimedia", "BA Multimedia Design", "Humanities"],
    ["limkokwing-ba-fashion", "BA Fashion Design", "Humanities"],
    ["limkokwing-ba-animation", "BA Animation", "Humanities"],
    ["limkokwing-bba-entrepreneurship", "BBA Entrepreneurship", "Business"],
    ["limkokwing-bsc-architecture", "BSc Architectural Technology", "Engineering"],
    ["limkokwing-diploma-graphic", "Diploma in Graphic Design", "Humanities"],
  ].map(([id, name, field]) => ({
    id,
    name,
    field,
    university: "Limkokwing University of Creative Technology",
    universityShort: "Limkokwing",
    minPoints: null,
    subjectRequirements: {},
    duration: "3 years",
    durationYears: 3,
    description: "Programme at Limkokwing Botswana. Confirm entry requirements with the institution.",
    officialUrl: "https://www.limkokwing.net/botswana/",
    applyUrl: "https://www.limkokwing.net/botswana/admissions",
    modules: [],
    careers: [],
  }));

  const gtc = [
    ["gtc-diploma-civil", "National Diploma in Civil Engineering", "Engineering"],
    ["gtc-diploma-mechanical", "National Diploma in Mechanical Engineering", "Engineering"],
    ["gtc-diploma-automotive", "National Diploma in Automotive Engineering", "Engineering"],
    ["gtc-diploma-construction", "National Diploma in Construction Technology", "Engineering"],
    ["gtc-cert-electrical", "Certificate in Electrical Engineering", "Engineering"],
    ["gtc-diploma-welding", "National Diploma in Welding and Fabrication", "Engineering"],
    ["gtc-cert-carpentry", "Certificate in Carpentry and Joinery", "Engineering"],
  ].map(([id, name, field]) => ({
    id,
    name,
    field,
    university: "Gaborone Technical College",
    universityShort: "GTC",
    minPoints: null,
    subjectRequirements: {},
    duration: name.includes("Certificate") ? "1 year" : "3 years",
    durationYears: name.includes("Certificate") ? 1 : 3,
    description: "TVET programme at GTC. Confirm entry requirements with the institution.",
    officialUrl: "https://www.gtc.ac.bw/",
    applyUrl: "https://www.gtc.ac.bw/",
    modules: [],
    careers: [],
  }));

  return [...botho, ...biust, ...bac, ...baisago, ...abm, ...limkokwing, ...gtc];
}

function main() {
  const main = JSON.parse(fs.readFileSync(mainPath, "utf8"));
  const existingIds = new Set(main.map((p) => p.id));

  const ub = parseUbFromDump();
  const other = otherInstitutionStubs();
  const merged = [...main];
  let added = 0;

  for (const row of [...ub, ...other]) {
    if (existingIds.has(row.id)) continue;
    merged.push(row);
    existingIds.add(row.id);
    added += 1;
  }

  fs.writeFileSync(mainPath, `${JSON.stringify(merged, null, 2)}\n`);
  console.error(`Merged programmes: ${main.length} -> ${merged.length} (+${added})`);
}

main();
