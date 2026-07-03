export function getSiteUrl() {
  const url = (Deno.env.get("SITE_URL") || Deno.env.get("VITE_SITE_URL") || "http://localhost:5173").trim();
  return url.endsWith("/") ? url.slice(0, -1) : url;
}
