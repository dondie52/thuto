const DEFAULT_SITE_URL = "https://dondie52.github.io/thuto/";

function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}

export function getSiteUrl() {
  const raw = import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL;
  return ensureTrailingSlash(String(raw).trim() || DEFAULT_SITE_URL);
}

export function absoluteSiteUrl(pathname = "/") {
  const siteUrl = getSiteUrl();
  const cleanPath = String(pathname || "/").replace(/^\/+/, "");
  return cleanPath ? new URL(cleanPath, siteUrl).toString() : siteUrl;
}

export function upsertHeadElement(selector, createElement, updateElement) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = createElement();
    document.head.appendChild(element);
  }
  updateElement(element);
}
