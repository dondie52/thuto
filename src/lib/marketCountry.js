/** Supported market countries for catalogue filtering. */
export const MARKET_COUNTRIES = [
  { code: "bw", label: "Botswana" },
  { code: "na", label: "Namibia" },
  { code: "zw", label: "Zimbabwe" },
  { code: "zm", label: "Zambia" },
  { code: "za", label: "South Africa" },
  { code: "ls", label: "Lesotho" },
  { code: "sz", label: "Eswatini" },
];

export const DEFAULT_MARKET_COUNTRY = "bw";

export const MARKET_COUNTRY_STORAGE_KEY = "thuto_country";

const VALID = new Set(MARKET_COUNTRIES.map((c) => c.code));

/**
 * @param {unknown} value
 * @returns {'bw' | 'na' | 'zw' | 'zm' | 'za' | 'ls' | 'sz' | null}
 */
export function normalizeMarketCountry(value) {
  const code = String(value || "")
    .trim()
    .toLowerCase();
  if (VALID.has(code)) return /** @type {'bw' | 'na' | 'zw' | 'zm' | 'za' | 'ls' | 'sz'} */ (code);
  return null;
}

/**
 * @param {string} code
 */
export function marketCountryLabel(code) {
  return MARKET_COUNTRIES.find((c) => c.code === code)?.label || code;
}

function readGuestCountry() {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    return normalizeMarketCountry(window.localStorage.getItem(MARKET_COUNTRY_STORAGE_KEY));
  } catch {
    return null;
  }
}

/**
 * Persist guest (and post-login sync) market country for catalogue filtering.
 * @param {unknown} value
 * @returns {'bw' | 'na' | 'zw' | 'zm' | 'za' | 'ls' | 'sz'}
 */
export function setMarketCountry(value) {
  const code = normalizeMarketCountry(value) || DEFAULT_MARKET_COUNTRY;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(MARKET_COUNTRY_STORAGE_KEY, code);
    } catch {
      /* ignore quota / private mode */
    }
  }
  return code;
}

/**
 * Resolve active market country.
 * Preference: explicit profile country → guest localStorage → Botswana.
 * @param {{ country?: string | null } | string | null | undefined} [profileOrCountry]
 * @returns {'bw' | 'na' | 'zw' | 'zm' | 'za' | 'ls' | 'sz'}
 */
export function resolveMarketCountry(profileOrCountry) {
  const fromProfile =
    typeof profileOrCountry === "string" || profileOrCountry == null
      ? normalizeMarketCountry(profileOrCountry)
      : normalizeMarketCountry(profileOrCountry?.country);
  if (fromProfile) return fromProfile;
  return readGuestCountry() || DEFAULT_MARKET_COUNTRY;
}

/**
 * @param {Record<string, unknown> | null | undefined} item
 * @returns {'bw' | 'na' | 'zw' | 'zm' | 'za' | 'ls' | 'sz'}
 */
export function itemMarketCountry(item) {
  return normalizeMarketCountry(item?.country) || DEFAULT_MARKET_COUNTRY;
}

/**
 * @template {Record<string, unknown>} T
 * @param {T[]} list
 * @param {string | null | undefined} country
 * @param {{ includeAllCountries?: boolean }} [options]
 * @returns {T[]}
 */
export function filterByMarketCountry(list, country, options = {}) {
  if (options.includeAllCountries || country === "all") return list;
  const code = normalizeMarketCountry(country) || resolveMarketCountry();
  return list.filter((item) => itemMarketCountry(item) === code);
}
