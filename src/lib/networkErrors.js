/**
 * Detect low-level fetch failures (Safari: "Load failed", Chrome: "Failed to fetch").
 * @param {unknown} error
 */
export function isNetworkError(error) {
  if (!error) return false;
  const message = String(error?.message || error || "").toLowerCase();
  const name = String(error?.name || "").toLowerCase();
  return (
    name === "typeerror" &&
    (message.includes("load failed") ||
      message.includes("failed to fetch") ||
      message.includes("networkerror") ||
      message.includes("network request failed"))
  );
}

/**
 * @param {unknown} error
 * @param {string} [fallback]
 */
export function formatNetworkErrorMessage(error, fallback = "Could not reach the server. Check your connection and try again.") {
  if (isNetworkError(error)) return fallback;
  const message = String(error?.message || error || "").trim();
  if (!message) return fallback;
  if (/^typeerror:\s*/i.test(message)) {
    return fallback;
  }
  return message;
}

/**
 * @template T
 * @param {() => Promise<T>} fn
 * @param {{ attempts?: number, baseDelayMs?: number }} [options]
 */
export async function withNetworkRetry(fn, { attempts = 3, baseDelayMs = 400 } = {}) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isNetworkError(error) || attempt === attempts) throw error;
      await new Promise((resolve) => window.setTimeout(resolve, baseDelayMs * attempt));
    }
  }
  throw lastError;
}
