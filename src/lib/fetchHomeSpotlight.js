import { getProviderStatus } from "./assistantEngine.js";
import { getSupabase } from "./supabase.js";

const STORAGE_PREFIX = "thuto-home-spotlight-v1:";

/**
 * @typedef {Object} HomeSpotlightPayload
 * @property {Array<{ id: string, teaser: string }>} [featuredProgrammes]
 * @property {{ title: string, body: string, groundingNote?: string, officialLink?: string | null }} [scholarship]
 * @property {boolean} [usedGoogleSearch]
 */

/**
 * @param {string} calendarDayKey
 * @returns {HomeSpotlightPayload | null}
 */
export function readCachedHomeSpotlight(calendarDayKey) {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + calendarDayKey);
    if (!raw) return null;
    const wrap = JSON.parse(raw);
    if (!wrap || wrap.calendarDayKey !== calendarDayKey || !wrap.payload) return null;
    return wrap.payload;
  } catch {
    return null;
  }
}

/**
 * @param {string} calendarDayKey
 * @param {HomeSpotlightPayload} payload
 */
export function writeCachedHomeSpotlight(calendarDayKey, payload) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(
      STORAGE_PREFIX + calendarDayKey,
      JSON.stringify({ calendarDayKey, payload, savedAt: Date.now() }),
    );
  } catch {
    /* quota or private mode */
  }
}

/**
 * True when Gemini home spotlight is allowed (same flags as assistant, optional opt-out).
 */
export function isHomeSpotlightAiEnabled() {
  const status = getProviderStatus();
  const optOut = String(import.meta.env.VITE_AI_HOME_SPOTLIGHT || "").toLowerCase() === "false";
  return Boolean(status.configured && !optOut);
}

/**
 * @param {object} input
 * @param {string} input.calendarDayKey
 * @param {Array<{ id: string, name: string, university?: string, minPoints?: number }>} input.programmeCandidates
 * @returns {Promise<HomeSpotlightPayload | null>}
 */
export async function fetchGeminiHomeSpotlight({ calendarDayKey, programmeCandidates }) {
  if (!isHomeSpotlightAiEnabled()) return null;

  const cached = readCachedHomeSpotlight(calendarDayKey);
  if (cached) return cached;

  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.functions.invoke("home-spotlight", {
    body: { calendarDayKey, programmeCandidates },
  });

  if (error) return null;
  if (!data || data.ok !== true) return null;

  /** @type {HomeSpotlightPayload} */
  const payload = {
    featuredProgrammes: Array.isArray(data.featuredProgrammes) ? data.featuredProgrammes : [],
    scholarship: data.scholarship,
    usedGoogleSearch: Boolean(data.usedGoogleSearch),
  };

  if (!payload.scholarship?.body) return null;

  writeCachedHomeSpotlight(calendarDayKey, payload);
  return payload;
}
