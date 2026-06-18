/**
 * Add University of Botswana graduate programmes from scripts/ub-programmes-page.txt
 * into public/data/programmes.json.
 *
 * Undergraduate UB programmes are built by build-programmes-catalog.mjs which skips
 * master-/mphil/ URLs. This script handles the Graduate section only.
 *
 * Usage: node scripts/merge-ub-graduate-programmes.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dumpPath = path.join(__dirname, "ub-programmes-page.txt");
const progPath = path.join(root, "public/data/programmes.json");

function fieldForUb(name, urlPath) {
  const n = name.toLowerCase();
  const p = urlPath.toLowerCase();
  if (p.includes("/law/") || n.includes("llm") || n.includes("laws")) return "Law";
  if (p.includes("/medicine/")) return "Health";
  if (p.includes("/health-sciences/")) return "Health";
  if (p.includes("/education/")) return "Education";
  if (p.includes("/engineering-and-technology/")) return "Engineering";
  if (p.includes("/business/")) return "Business";
  if (n.includes("computer") || n.includes("information systems")) return "Technology";
  if (p.includes("/science/")) return "Natural Sciences";
  if (p.includes("/social-sciences/")) return "Humanities";
  if (p.includes("/humanities/")) return "Humanities";
  if (p.includes("/okavango")) return "Natural Sciences";
  return "Humanities";
}

function qualificationMeta(name) {
  const n = name.toLowerCase();
  const tags = ["Postgraduate"];
  if (/mphil|phd|doctorate/i.test(n)) {
    tags.push("Research");
    if (/phd/i.test(n)) tags.push("PhD");
    if (/mphil/i.test(n)) tags.push("MPhil");
    return { qualification: "Postgraduate", duration: "3–4 years", durationYears: 3.5, tags };
  }
  if (/executive master|emba|empa/i.test(n)) {
    return { qualification: "Postgraduate", duration: "2 years", durationYears: 2, tags: [...tags, "Executive"] };
  }
  if (/master in medicine|mmed/i.test(n)) {
    return { qualification: "Postgraduate", duration: "4 years", durationYears: 4, tags: [...tags, "Clinical"] };
  }
  if (/master of laws|llm/i.test(n)) {
    return { qualification: "Postgraduate", duration: "1–2 years", durationYears: 1.5, tags: [...tags, "LLM"] };
  }
  if (/master of business|mba/i.test(n)) {
    return { qualification: "Postgraduate", duration: "2 years", durationYears: 2, tags: [...tags, "MBA"] };
  }
  if (/master of education|m\.?ed/i.test(n)) {
    return { qualification: "Postgraduate", duration: "2 years", durationYears: 2, tags: [...tags, "MEd"] };
  }
  if (/master of science|m\.?sc/i.test(n)) {
    return { qualification: "Postgraduate", duration: "2 years", durationYears: 2, tags: [...tags, "MSc"] };
  }
  if (/master of arts|ma\b/i.test(n)) {
    return { qualification: "Postgraduate", duration: "2 years", durationYears: 2, tags: [...tags, "MA"] };
  }
  if (/master of public|mpa|mrpp|mdp/i.test(n)) {
    return { qualification: "Postgraduate", duration: "2 years", durationYears: 2, tags };
  }
  if (/master in|master of|masters in/i.test(n)) {
    return { qualification: "Postgraduate", duration: "2 years", durationYears: 2, tags };
  }
  return { qualification: "Postgraduate", duration: "1–2 years", durationYears: 1.5, tags };
}

function isResearchDegree(name) {
  return /mphil|phd|doctorate/i.test(name);
}

/** Research-phase structure for MPhil/PhD (no invented course codes). */
export function researchPhaseModules() {
  return [
    {
      semester: "Year 1",
      modules: [
        "Research proposal and literature review",
        "Confirmation of candidature",
      ],
    },
    {
      semester: "Years 2–3",
      modules: [
        "Independent research under supervision",
        "Annual progress reviews and research seminars",
      ],
    },
    {
      semester: "Final",
      modules: ["Thesis writing and submission", "Viva voce examination"],
    },
  ];
}

function parseGraduateFromDump() {
  if (!fs.existsSync(dumpPath)) {
    console.error(`Missing ${dumpPath}`);
    return [];
  }
  const text = fs.readFileSync(dumpPath, "utf8");
  const gradIdx = text.indexOf("\nGraduate\n");
  if (gradIdx < 0) {
    console.error("Graduate section not found in ub-programmes-page.txt");
    return [];
  }
  const graduate = text.slice(gradIdx);
  const re = /\[([^\]]+)\]\((https:\/\/www\.ub\.bw\/programmes[^)]+)\)/g;
  const rows = [];
  let m;
  while ((m = re.exec(graduate)) !== null) {
    rows.push({ name: m[1].trim(), url: m[2].trim() });
  }
  const out = [];
  const seenId = new Set();
  for (const { name, url } of rows) {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    const slug = parts[parts.length - 1] || "programme";
    const id = `ub-${slug}`.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").toLowerCase();
    if (seenId.has(id)) continue;
    seenId.add(id);
    const field = fieldForUb(name, url);
    const meta = qualificationMeta(name);
    const facultySeg = parts[1] ? parts[1].replace(/-/g, " ") : "";
    const research = isResearchDegree(name);
    out.push({
      id,
      name,
      field,
      university: "University of Botswana",
      universityShort: "UB",
      minPoints: null,
      subjectRequirements: {},
      duration: meta.duration,
      durationYears: meta.durationYears,
      description: research
        ? "Research degree at the University of Botswana. Entry requires a relevant Master's degree or equivalent. Confirm specialisation streams and supervision with the School of Graduate Studies."
        : "Postgraduate programme at the University of Botswana. Entry typically requires a relevant Bachelor's degree (minimum second class or equivalent). Confirm requirements on the official page.",
      officialUrl: url,
      applyUrl: "https://www.ub.bw/study/graduate-applications",
      faculty: facultySeg ? facultySeg.replace(/\b\w/g, (c) => c.toUpperCase()) : undefined,
      qualification: meta.qualification,
      tags: meta.tags,
      modules: research ? researchPhaseModules() : [],
      careers: [],
      profileCompleteness: research ? "partial" : "stub",
      minPointsScaleVersion: 2,
    });
  }
  return out;
}

function main() {
  const graduateRows = parseGraduateFromDump();
  if (!graduateRows.length) {
    process.exitCode = 1;
    return;
  }

  const programmes = JSON.parse(fs.readFileSync(progPath, "utf8"));
  const byId = new Map(programmes.map((p) => [p.id, p]));
  let added = 0;
  let updated = 0;

  for (const row of graduateRows) {
    const existing = byId.get(row.id);
    if (!existing) {
      programmes.push(row);
      byId.set(row.id, row);
      added++;
      continue;
    }
    // Enrich existing stub without wiping scraped modules.
    const hasModules =
      Array.isArray(existing.modules) &&
      existing.modules.some((s) => Array.isArray(s.modules) && s.modules.length > 0);
    existing.qualification = row.qualification;
    existing.tags = [...new Set([...(existing.tags || []), ...(row.tags || [])])];
    existing.officialUrl = row.officialUrl;
    existing.applyUrl = row.applyUrl;
    existing.duration = existing.duration || row.duration;
    existing.durationYears = existing.durationYears || row.durationYears;
    existing.description = row.description;
    existing.minPoints = null;
    if (!hasModules && isResearchDegree(row.name)) {
      existing.modules = row.modules;
    }
    if (!existing.profileCompleteness) existing.profileCompleteness = row.profileCompleteness;
    updated++;
  }

  programmes.sort((a, b) => {
    const ua = (a.universityShort || a.university || "").localeCompare(b.universityShort || b.university || "");
    if (ua !== 0) return ua;
    return (a.name || "").localeCompare(b.name || "");
  });

  fs.writeFileSync(progPath, `${JSON.stringify(programmes, null, 2)}\n`);
  console.log(`UB graduate merge: ${graduateRows.length} parsed, ${added} added, ${updated} updated.`);
}

main();
