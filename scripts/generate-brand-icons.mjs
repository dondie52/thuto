/**
 * Regenerate raster brand icons from public/icons/thuto-mark.svg.
 * Keeps the PWA install / launch splash aligned with the in-app splash (T mark, no legacy logo art).
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const svgPath = path.join(root, "public/icons/thuto-mark.svg");
const outDir = path.join(root, "public/icons");

/** Matches SplashScreen background (--thuto-surface) and PWA manifest background_color. */
const SPLASH_BG = "#f3f1ec";

/**
 * In-app splash uses a 64px mark (h-16). OS launch splashes scale the full icon canvas to
 * ~40–50% of the viewport, so a full-bleed mark looks huge. Padding the launch icons keeps
 * the standalone splash visually aligned with SplashScreen.jsx.
 */
const LAUNCH_MARK_RATIO = 64 / 192;

const outputs = [
  { name: "favicon-16.png", size: 16, maskable: false, fullBleed: true },
  { name: "favicon-32.png", size: 32, maskable: false, fullBleed: true },
  { name: "apple-touch-icon.png", size: 180, maskable: false },
  { name: "icon-192.png", size: 192, maskable: false },
  { name: "icon-512.png", size: 512, maskable: false },
  { name: "icon-192-maskable.png", size: 192, maskable: true },
  { name: "icon-512-maskable.png", size: 512, maskable: true },
];

async function renderMark(size, { fullBleed = false } = {}) {
  const markSize = fullBleed ? size : Math.max(1, Math.round(size * LAUNCH_MARK_RATIO));
  const mark = await sharp(svgPath).resize(markSize, markSize).png().toBuffer();
  const offset = Math.round((size - markSize) / 2);

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: SPLASH_BG,
    },
  })
    .composite([{ input: mark, left: offset, top: offset }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function main() {
  await fs.access(svgPath);
  await fs.mkdir(outDir, { recursive: true });

  for (const { name, size, maskable, fullBleed = false } of outputs) {
    const buffer = await renderMark(size, { fullBleed });
    await fs.writeFile(path.join(outDir, name), buffer);
    console.log(`wrote ${name} (${size}px${maskable ? ", maskable" : ""})`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
