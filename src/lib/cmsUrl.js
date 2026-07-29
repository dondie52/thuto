function withBase(path) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}${path}`;
}

export function normalizeCmsPath(path = "") {
  const raw = typeof path === "string" ? path.trim() : "";
  const match = raw.match(/^([^?#]*)(.*)$/);
  const pathname = (match?.[1] || "").trim();
  const suffix = match?.[2] || "";

  if (!pathname || pathname === "/" || pathname === "/app" || pathname === "/onboarding") {
    return `/cms/${suffix}`;
  }
  if (pathname === "/partner" || pathname === "/cms" || pathname === "/cms/") {
    return `/cms/${suffix}`;
  }
  if (pathname.startsWith("/partner/")) {
    return `/cms/#/${pathname.slice("/partner/".length)}${suffix}`;
  }
  if (pathname.startsWith("/cms/")) {
    const rest = pathname.slice("/cms/".length);
    return rest ? `/cms/#/${rest}${suffix}` : `/cms/${suffix}`;
  }
  return `/cms/${suffix}`;
}

export function buildCmsUrl(path = "") {
  return withBase(normalizeCmsPath(path));
}

export function buildAppUrl(path = "/") {
  const safePath = typeof path === "string" && path.startsWith("/") ? path : `/${path || ""}`;
  return withBase(safePath);
}
