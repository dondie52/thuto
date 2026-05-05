/**
 * One-off migration: shift programme `minPoints` from the legacy Thuto scale
 * (A=6, B=5, C=4, D=3, E=2, U=0) to the official Botswana BGCSE scale
 * (A*=8, A=8, B=7, C=6, D=5, E=4, F=3, G=2, U=0). Best-six max = 48.
 *
 * Rules:
 *   - For each numeric `minPoints`, set it to `min(minPoints + 12, 48)`.
 *   - Stamp `minPointsScaleVersion: 2` so re-runs are no-ops.
 *   - Programmes whose shifted value exceeded 48 are capped and reported
 *     for manual re-curation against authoritative sources.
 *
 * Usage: node scripts/migrate-grade-scale.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const progPath = path.join(root, "public/data/programmes.json");

const LEGACY_TO_OFFICIAL_OFFSET = 12;
const BEST_SIX_MAX = 48;
const TARGET_SCALE_VERSION = 2;

function migrate(programmes) {
  let migrated = 0;
  let alreadyMigrated = 0;
  let skippedNoPoints = 0;
  const capped = [];

  for (const p of programmes) {
    if (p.minPointsScaleVersion === TARGET_SCALE_VERSION) {
      alreadyMigrated++;
      continue;
    }

    if (typeof p.minPoints !== "number" || !Number.isFinite(p.minPoints)) {
      p.minPointsScaleVersion = TARGET_SCALE_VERSION;
      skippedNoPoints++;
      continue;
    }

    const shifted = p.minPoints + LEGACY_TO_OFFICIAL_OFFSET;
    if (shifted > BEST_SIX_MAX) {
      capped.push({ id: p.id, before: p.minPoints, shifted, capped: BEST_SIX_MAX, tier: p.minPointsTier ?? null });
      p.minPoints = BEST_SIX_MAX;
    } else {
      p.minPoints = shifted;
    }
    p.minPointsScaleVersion = TARGET_SCALE_VERSION;
    migrated++;
  }

  return { migrated, alreadyMigrated, skippedNoPoints, capped };
}

function main() {
  const programmes = JSON.parse(fs.readFileSync(progPath, "utf8"));
  const report = migrate(programmes);

  fs.writeFileSync(progPath, `${JSON.stringify(programmes, null, 2)}\n`);

  console.error(
    `Grade-scale migration -> v${TARGET_SCALE_VERSION}: ${report.migrated} shifted (+${LEGACY_TO_OFFICIAL_OFFSET}), ${report.alreadyMigrated} already at v${TARGET_SCALE_VERSION}, ${report.skippedNoPoints} stamped without numeric minPoints.`
  );

  if (report.capped.length > 0) {
    console.error(
      `\n${report.capped.length} programme(s) had shifted minPoints above the new max (${BEST_SIX_MAX}); capped and need manual re-curation:`
    );
    for (const row of report.capped) {
      console.error(`  - ${row.id} [${row.tier ?? "(no tier)"}]: ${row.before} -> ${row.shifted} (capped to ${row.capped})`);
    }
  }
}

main();
