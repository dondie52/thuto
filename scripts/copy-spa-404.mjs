// Copies dist/index.html to dist/404.html so GitHub Pages serves the SPA
// shell on deep-link reloads (client-side routes the browser doesn't know).
import { copyFile, access, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "dist");
const src = resolve(root, "index.html");
const dest = resolve(root, "404.html");

try {
  await access(src);
} catch {
  console.error("[copy-spa-404] dist/index.html not found; did `vite build` run?");
  process.exit(1);
}

await copyFile(src, dest);
await writeFile(resolve(root, ".nojekyll"), "");
console.log("[copy-spa-404] dist/404.html written");
console.log("[copy-spa-404] dist/.nojekyll written");
