/**
 * Re-download programme theme JPEGs from Unsplash (see public/programme-themes/attribution.json).
 * Run: node scripts/fetch-programme-themes.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const themesDir = join(root, "public/programme-themes");
const attribution = JSON.parse(readFileSync(join(themesDir, "attribution.json"), "utf8"));

const PARAMS = {
  "landing-hero-bw.jpg": "auto=format&fit=crop&w=1920&h=1080&q=80",
  default: "auto=format&fit=crop&w=1200&h=500&q=80",
};

for (const entry of attribution.images) {
  const file = entry.file;
  const photoId = entry.source.replace(/.*\/photos\//, "").replace(/\/$/, "");
  const params = PARAMS[file] || PARAMS.default;
  const url = `https://images.unsplash.com/photo-${photoId}?${params}`;
  const out = join(themesDir, file);
  const result = spawnSync("curl", ["-fsSL", "-o", out, url], { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`Failed: ${file}`);
    process.exitCode = 1;
  } else {
    console.log(`ok: ${file}`);
  }
}
