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

/** Matches SplashScreen background and PWA manifest background_color. */
const SPLASH_BG = "#effcf9";

const outputs = [
  { name: "favicon-16.png", size: 16, maskable: false },
  { name: "favicon-32.png", size: 32, maskable: false },
  { name: "apple-touch-icon.png", size: 180, maskable: false },
  { name: "icon-192.png", size: 192, maskable: false },
  { name: "icon-512.png", size: 512, maskable: false },
  { name: "icon-192-maskable.png", size: 192, maskable: true },
  { name: "icon-512-maskable.png", size: 512, maskable: true },
];

async function renderMark(size, maskable) {
  const inset = maskable ? Math.round(size * 0.12) : 0;
  const markSize = size - inset * 2;
  const mark = await sharp(svgPath).resize(markSize, markSize).png().toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: SPLASH_BG,
    },
  })
    .composite([{ input: mark, left: inset, top: inset }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function main() {
  await fs.access(svgPath);
  await fs.mkdir(outDir, { recursive: true });

  for (const { name, size, maskable } of outputs) {
    const buffer = await renderMark(size, maskable);
    await fs.writeFile(path.join(outDir, name), buffer);
    console.log(`wrote ${name} (${size}px${maskable ? ", maskable" : ""})`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
