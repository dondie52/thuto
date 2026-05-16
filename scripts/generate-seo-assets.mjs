import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const distDir = resolve(root, "dist");
const programmesPath = resolve(root, "public/data/programmes.json");
const universitiesPath = resolve(root, "public/data/universities.json");

const basePath = process.env.VITE_BASE_PATH || "/thuto/";
const defaultSiteUrl = basePath === "/" ? "https://thuto.bw/" : "https://dondie52.github.io/thuto/";
const rawSiteUrl = process.env.VITE_SITE_URL || defaultSiteUrl;
const siteUrl = rawSiteUrl.endsWith("/") ? rawSiteUrl : `${rawSiteUrl}/`;

const staticRoutes = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/predictor", priority: "0.9", changefreq: "weekly" },
  { path: "/programmes", priority: "0.9", changefreq: "weekly" },
  { path: "/universities", priority: "0.8", changefreq: "weekly" },
  { path: "/fit-finder", priority: "0.7", changefreq: "monthly" },
  { path: "/compare", priority: "0.6", changefreq: "monthly" },
  { path: "/sponsorships", priority: "0.6", changefreq: "monthly" },
  { path: "/support", priority: "0.4", changefreq: "yearly" },
  { path: "/disclaimer", priority: "0.3", changefreq: "yearly" },
  { path: "/privacy", priority: "0.3", changefreq: "yearly" },
];

function absoluteUrl(pathname = "/") {
  const cleanPath = String(pathname).replace(/^\/+/, "");
  return cleanPath ? new URL(cleanPath, siteUrl).toString() : siteUrl;
}

function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function readJsonArray(path) {
  const raw = await readFile(path, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    throw new Error(`${path} must contain a JSON array.`);
  }
  return data;
}

async function newestMtimeDate(paths) {
  const stats = await Promise.all(paths.map((path) => stat(path)));
  const newest = Math.max(...stats.map((entry) => entry.mtimeMs));
  return new Date(newest).toISOString().slice(0, 10);
}

function urlEntry({ path, priority, changefreq, lastmod }) {
  return [
    "  <url>",
    `    <loc>${xmlEscape(absoluteUrl(path))}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n");
}

const [programmes, universities, lastmod] = await Promise.all([
  readJsonArray(programmesPath),
  readJsonArray(universitiesPath),
  newestMtimeDate([programmesPath, universitiesPath, resolve(root, "index.html")]),
]);

const programmeRoutes = programmes
  .filter((programme) => programme?.id)
  .map((programme) => ({
    path: `/programmes/${encodeURIComponent(programme.id)}`,
    priority: programme.profileCompleteness === "full" ? "0.7" : "0.5",
    changefreq: "monthly",
    lastmod,
  }));

const universityRoutes = universities
  .filter((university) => university?.id)
  .map((university) => ({
    path: `/universities/${encodeURIComponent(university.id)}`,
    priority: university.featured ? "0.7" : "0.6",
    changefreq: "monthly",
    lastmod,
  }));

const routes = [
  ...staticRoutes.map((route) => ({ ...route, lastmod })),
  ...programmeRoutes,
  ...universityRoutes,
];

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...routes.map(urlEntry),
  "</urlset>",
  "",
].join("\n");

const robots = [
  "User-agent: *",
  "Allow: /",
  "",
  `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
  "",
].join("\n");

await mkdir(distDir, { recursive: true });
await Promise.all([
  writeFile(resolve(distDir, "sitemap.xml"), sitemap, "utf8"),
  writeFile(resolve(distDir, "robots.txt"), robots, "utf8"),
]);

console.log(
  `[generate-seo-assets] dist/sitemap.xml written with ${routes.length} URLs; robots.txt points to ${absoluteUrl(
    "/sitemap.xml",
  )}`,
);
