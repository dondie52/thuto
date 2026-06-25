/**
 * Regenerate raster brand icons from public/icons/thuto-mark.svg.
 * Full-bleed teal squircle with white T and cyan accent (home screen / PWA icon).
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const svgPath = path.join(root, "public/icons/thuto-mark.svg");
const outDir = path.join(root, "public/icons");

const outputs = [
  { name: "favicon-16.png", size: 16 },
  { name: "favicon-32.png", size: 32 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "icon-192-maskable.png", size: 192 },
  { name: "icon-512-maskable.png", size: 512 },
];

async function renderMark(size) {
  return sharp(svgPath).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
}

async function main() {
  await fs.access(svgPath);
  await fs.mkdir(outDir, { recursive: true });

  for (const { name, size } of outputs) {
    const buffer = await renderMark(size);
    await fs.writeFile(path.join(outDir, name), buffer);
    console.log(`wrote ${name} (${size}px)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
