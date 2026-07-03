/**
 * Upserts BIUST and Limkokwing campaign programmes into Supabase
 * content_programme_overrides so they are live before the next static deploy.
 *
 * Usage:
 *   node scripts/push-campaign-programmes-to-supabase.mjs --dry-run
 *   node scripts/push-campaign-programmes-to-supabase.mjs --write-sql /tmp/campaign-programmes.sql
 *   SUPABASE_ACCESS_TOKEN=... node scripts/push-campaign-programmes-to-supabase.mjs --apply
 *
 * Apply generated SQL with --apply (Management API), Supabase MCP execute_sql, or Dashboard SQL editor.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "cytqacoqyqqijwsdcrpt";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const progPath = path.join(root, "public/data/programmes.json");

/** Programme ids touched by merge-campaign-programmes.mjs */
const CAMPAIGN_PROGRAMME_IDS = [
  "biust-bsc-chemistry-materials",
  "biust-bsc-chemistry-drug-discovery",
  "biust-bsc-chemistry-environmental",
  "biust-bsc-forensic-science",
  "biust-bsc-mathematical-sciences",
  "biust-bsc-industrial-mathematics",
  "biust-bsc-statistics",
  "biust-bsc-cyber-security-digital-forensics",
  "biust-beng-computer-telecommunications",
  "biust-beng-electrical-communications",
  "biust-beng-mechatronics-industrial-instrumentation",
  "biust-beng-chemical-engineering",
  "biust-beng-materials-metallurgical",
  "biust-beng-geological-engineering",
  "biust-bsc-ecology-evolutionary-biology",
  "biust-bsc-physics-general",
  "biust-bsc-data",
  "biust-beng-civil",
  "biust-beng-mining",
  "biust-beng-industrial",
  "biust-beng-mechanical",
  "biust-beng-mechanical-engineering",
  "biust-bsc-geology",
  "biust-bsc-env",
  "limkokwing-bsc-it-security",
  "limkokwing-bsc-information-systems",
  "limkokwing-diploma-information-technology",
  "limkokwing-ba-visual-communication",
  "limkokwing-ba-industrial-design",
  "limkokwing-diploma-fashion-design",
  "limkokwing-bbus-international-business",
  "limkokwing-bbus-finance-banking",
  "limkokwing-bbus-tourism-management",
  "limkokwing-bbus-hospitality-management",
  "limkokwing-ba-interior-architecture",
  "limkokwing-associate-architectural-technology",
  "limkokwing-cert-construction-management",
  "limkokwing-ba-professional-communication",
  "limkokwing-ba-digital-film-television",
  "limkokwing-ba-broadcasting-journalism",
  "limkokwing-ba-events-management",
  "limkokwing-bsc-software",
  "limkokwing-bachelor-creative-multimedia",
  "limkokwing-diploma-graphic",
];

/** @param {string} id */
function institutionIdForProgramme(id) {
  if (id.startsWith("biust-")) return "biust";
  if (id.startsWith("limkokwing-")) return "limkokwing";
  return null;
}

/** @param {object[]} rows */
function buildUpsertSql(rows) {
  if (!rows.length) return "-- no rows\n";

  const values = rows
    .map((programme) => {
      const institutionId = institutionIdForProgramme(programme.id);
      const patch = JSON.stringify({ ...programme, id: programme.id });
      const instSql = institutionId ? `'${institutionId}'` : "null";
      return `  ('${programme.id.replace(/'/g, "''")}', ${instSql}, '${patch.replace(/'/g, "''")}'::jsonb, true)`;
    })
    .join(",\n");

  return `insert into public.content_programme_overrides (id, institution_id, patch, published)
values
${values}
on conflict (id) do update set
  institution_id = excluded.institution_id,
  patch = excluded.patch,
  published = excluded.published,
  updated_at = now();
`;
}

/** @param {object[]} rows @param {number} size */
function chunk(rows, size) {
  /** @type {object[][]} */
  const out = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const apply = args.includes("--apply");
  const writeIdx = args.indexOf("--write-sql");
  const writePath = writeIdx >= 0 ? args[writeIdx + 1] : null;

  const programmes = JSON.parse(fs.readFileSync(progPath, "utf8"));
  const idSet = new Set(CAMPAIGN_PROGRAMME_IDS);
  const rows = programmes.filter((p) => idSet.has(p.id));

  const missing = CAMPAIGN_PROGRAMME_IDS.filter((id) => !rows.some((p) => p.id === id));
  if (missing.length) {
    console.error(`Missing ${missing.length} programme(s) in programmes.json: ${missing.join(", ")}`);
    process.exit(1);
  }

  const batches = chunk(rows, 10);
  const sql = batches.map((batch) => buildUpsertSql(batch)).join("\n\n");

  if (dryRun) {
    console.log(`Would upsert ${rows.length} programme override(s) in ${batches.length} batch(es).`);
    return;
  }

  if (writePath) {
    fs.writeFileSync(writePath, `${sql}\n`);
    console.error(`Wrote ${rows.length} programme override(s) to ${writePath}`);
    return;
  }

  if (apply) {
    const token = process.env.SUPABASE_ACCESS_TOKEN;
    if (!token) {
      console.error("SUPABASE_ACCESS_TOKEN is required for --apply");
      process.exit(1);
    }
    fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    })
      .then(async (res) => {
        const body = await res.text();
        if (!res.ok) {
          console.error(`Supabase query failed (${res.status}): ${body}`);
          process.exit(1);
        }
        console.error(`Applied ${rows.length} programme override(s) to ${PROJECT_REF}.`);
      })
      .catch((err) => {
        console.error(err.message || err);
        process.exit(1);
      });
    return;
  }

  process.stdout.write(sql);
}

main();
