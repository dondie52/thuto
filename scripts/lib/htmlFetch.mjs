import { parse } from "node-html-parser";

/**
 * @param {string} html
 * @returns {string}
 */
function stripScriptsAndStyles(html) {
  return String(html || "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ");
}

/**
 * @param {string} text
 * @returns {string}
 */
export function normalizeText(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[\t\f\v]+/g, " ")
    .replace(/\s+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Fetch an HTML page and return both raw text and a parsed DOM.
 *
 * NOTE: This is best-effort scraping; we keep it conservative and do not execute JS.
 *
 * @param {string} url
 * @param {{ timeoutMs?: number }} [options]
 * @returns {Promise<{ url: string, html: string, dom: import('node-html-parser').HTMLElement, text: string }>}
 */
export async function fetchHtml(url, options = {}) {
  const timeoutMs = options.timeoutMs ?? 15000;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      signal: ac.signal,
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "User-Agent": "ThutoBot/0.1 (+https://github.com/dondie52/thuto)",
      },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
    const html = await r.text();
    const cleaned = stripScriptsAndStyles(html);
    const dom = parse(cleaned);
    const text = normalizeText(dom.textContent);
    return { url, html, dom, text };
  } finally {
    clearTimeout(t);
  }
}
