import { execFileSync } from "child_process";

/**
 * Convert a local PDF to plain text using `pdftotext`.
 * Requires poppler-utils to be installed in the environment (pdftotext binary).
 * @param {string} pdfPath
 * @param {{ layout?: boolean }} [opts]
 * @returns {string}
 */
export function pdfToText(pdfPath, opts = {}) {
  const args = [];
  if (opts.layout) args.push("-layout");
  args.push(pdfPath, "-");
  return execFileSync("pdftotext", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
}

/**
 * Light normalization for text extracted from PDFs.
 * @param {string} text
 */
export function normalizePdfText(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/\s+$/gm, "")
    .trim();
}

