/**
 * Storage path helpers, shared by content asset uploads and applicant document uploads.
 */

export function randomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** @param {string} name */
export function safeFileName(name) {
  return (
    String(name || "asset")
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100) || "asset"
  );
}
