import { BGCSE_SUBJECTS, SCIENCE_DOUBLE_SUBJECT_ID, SUBJECTS_BY_ID } from "./bgcseSubjects.js";

const GRADE_ALIASES = {
  "A+": "A*",
  "A STAR": "A*",
  ASTAR: "A*",
  "A-": "A",
  "B-": "B",
  "C-": "C",
  "D-": "D",
  "E-": "E",
  "F-": "F",
  "G-": "G",
  O: "D",
};

const VALID_GRADES = new Set(["A*", "A", "B", "C", "D", "E", "F", "G", "U"]);
const MIN_READY_IMPORT_ROWS = 6;
const MIN_AUTO_IMPORT_ROWS = 2;
const MIN_PDF_TEXT_CHARS = 50;
const MIN_SUBJECT_LABEL_LENGTH = 4;

const CERTIFICATE_POSITIVE_SIGNALS = [
  "bgcse",
  "igcse",
  "bec",
  "certificate",
  "statement of results",
  "examination",
  "exam results",
  "candidate",
  "cambridge",
  "pearson",
  "grade",
  "subject",
  "botswana examinations",
  "syllabus",
  "principal",
  "provisional",
];

const CERTIFICATE_NEGATIVE_SIGNALS = [
  "receipt",
  "invoice",
  "payment",
  "vat",
  "total due",
  "merchant",
  "transaction",
  "subtotal",
  "amount paid",
  "billing",
  "order number",
  "qty",
  "quantity",
  "unit price",
];

const HEADER_BLOCKLIST = new Set([
  "receipt",
  "details",
  "total",
  "invoice",
  "payment",
  "subtotal",
  "amount",
  "date",
  "qty",
  "quantity",
  "price",
  "paid",
  "balance",
  "merchant",
  "transaction",
  "customer",
  "item",
]);

const WRONG_DOCUMENT_WARNING =
  "This file does not look like a BGCSE or IGCSE results certificate. Upload your exam results slip, or add grades manually.";

const OCR_OPTIONS = {
  tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789*&-/.:() ",
  preserve_interword_spaces: "1",
  user_defined_dpi: "300",
};

let ocrWorkerPromise = null;

function makeKey() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `import-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeForOcr(value) {
  return normalize(value)
    .replace(/\b0f\b/g, "of")
    .replace(/\bln\b/g, "in")
    .replace(/\bcommunlcation\b/g, "communication")
    .replace(/\bco ordinated\b/g, "coordinated");
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  return matrix[a.length][b.length];
}

const SUBJECT_LOOKUPS = BGCSE_SUBJECTS.map((subjectMeta) => ({
  ...subjectMeta,
  tokens: [subjectMeta.label, ...subjectMeta.aliases].map(normalizeForOcr),
}));

function isHeaderLikeLabel(clean) {
  if (!clean) return true;
  if (HEADER_BLOCKLIST.has(clean)) return true;
  const words = clean.split(" ").filter(Boolean);
  if (!words.length) return true;
  return words.every((word) => HEADER_BLOCKLIST.has(word));
}

/**
 * @param {string} rawLabel
 * @returns {{ subjectId: string, confidence: "exact" | "alias" | "partial" | "fuzzy" | "" }}
 */
export function guessSubjectMatch(rawLabel) {
  const clean = normalizeForOcr(rawLabel);
  if (!clean || isHeaderLikeLabel(clean)) {
    return { subjectId: "", confidence: "" };
  }

  for (const subjectMeta of SUBJECT_LOOKUPS) {
    if (subjectMeta.tokens.includes(clean)) {
      const isPrimaryLabel = normalizeForOcr(subjectMeta.label) === clean;
      return { subjectId: subjectMeta.id, confidence: isPrimaryLabel ? "exact" : "alias" };
    }
  }

  if (clean.length >= 6) {
    for (const subjectMeta of SUBJECT_LOOKUPS) {
      for (const token of subjectMeta.tokens) {
        if (token.length < 6) continue;
        if (token.includes(clean) || clean.includes(token)) {
          return { subjectId: subjectMeta.id, confidence: "partial" };
        }
      }
    }
  }

  if (clean.length < MIN_SUBJECT_LABEL_LENGTH) {
    return { subjectId: "", confidence: "" };
  }

  let bestId = "";
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const subjectMeta of SUBJECT_LOOKUPS) {
    for (const token of subjectMeta.tokens) {
      if (token.length < MIN_SUBJECT_LABEL_LENGTH) continue;
      const distance = levenshtein(clean, token);
      const threshold = Math.max(2, Math.floor(token.length * 0.22));
      if (distance <= threshold && distance < bestDistance) {
        bestDistance = distance;
        bestId = subjectMeta.id;
      }
    }
  }
  if (bestId) return { subjectId: bestId, confidence: "fuzzy" };
  return { subjectId: "", confidence: "" };
}

/** @param {string} rawLabel */
function guessSubjectId(rawLabel) {
  return guessSubjectMatch(rawLabel).subjectId;
}

/**
 * @param {string} text
 * @returns {{ looksLikeCertificate: boolean, score: number, warning?: string, positive: number, negative: number }}
 */
export function assessImportedDocument(text) {
  const normalized = normalize(text);
  if (!normalized) {
    return { looksLikeCertificate: false, score: 0, warning: WRONG_DOCUMENT_WARNING, positive: 0, negative: 0 };
  }

  let positive = 0;
  let negative = 0;
  for (const signal of CERTIFICATE_POSITIVE_SIGNALS) {
    if (normalized.includes(signal)) positive += 1;
  }
  for (const signal of CERTIFICATE_NEGATIVE_SIGNALS) {
    if (normalized.includes(signal)) negative += 1;
  }

  const score = positive - negative * 2;
  const looksLikeCertificate =
    positive > 0 && negative <= positive && score >= 1 && !(negative >= 2 && positive === 0);

  return {
    looksLikeCertificate,
    score,
    warning: looksLikeCertificate ? undefined : WRONG_DOCUMENT_WARNING,
    positive,
    negative,
  };
}

function confidenceAllowsAutoRow(confidence) {
  return confidence === "exact" || confidence === "alias" || confidence === "partial" || confidence === "fuzzy";
}

function normalizeGrade(rawGrade) {
  const cleaned = String(rawGrade || "")
    .toUpperCase()
    .replace(/[^A-Z0-9*+]/g, "");
  if (!cleaned) return "";
  const alias = GRADE_ALIASES[cleaned] || cleaned;
  if (VALID_GRADES.has(alias)) return alias;
  if (alias.length === 1 && VALID_GRADES.has(alias)) return alias;
  return "";
}

function extractGradeFromLine(line) {
  const upper = String(line || "").toUpperCase();
  const patterns = [
    /\bA\*\b/,
    /\bA\s*STAR\b/,
    /\bA\b/,
    /\bB\b/,
    /\bC\b/,
    /\bD\b/,
    /\bE\b/,
    /\bF\b/,
    /\bG\b/,
    /\bU\b/,
  ];
  for (const pattern of patterns) {
    const match = upper.match(pattern);
    if (match) return normalizeGrade(match[0]);
  }
  return "";
}

function splitLabelAndGrade(line) {
  const grade = extractGradeFromLine(line);
  if (!grade) return { label: line, grade: "", grade2: "" };
  const upper = line.toUpperCase();
  const gradeIndex = upper.lastIndexOf(grade === "A*" ? "A*" : grade);
  const label = gradeIndex >= 0 ? line.slice(0, gradeIndex) : line;
  return { label, grade, grade2: "" };
}

function extractDoubleAwardGradesFromTail(line) {
  const tail = String(line || "").trim().toUpperCase();
  if (!tail) return null;
  if (tail.startsWith("A*") && tail.length >= 3 && gradeToPoints(tail[2]) != null) {
    return { grade1: "A*", grade2: tail[2] };
  }
  if (tail.length >= 2) {
    const g1 = tail[0];
    const g2 = tail[1];
    if (gradeToPoints(g1) != null && gradeToPoints(g2) != null) {
      return { grade1: g1, grade2: g2 };
    }
  }
  return null;
}

function gradeToPoints(grade) {
  const g = String(grade || "").trim().toUpperCase();
  return VALID_GRADES.has(g) ? 1 : null;
}

function extractScienceDoubleAwardFromLine(line) {
  const upper = String(line || "").toUpperCase();
  const marker = /(?:SCIENCE\s+DOUBLE\s+AWARD|DOUBLE\s+AWARD\s+SCIENCE|DOUBLE\s+SCIENCE)/;
  const match = upper.match(marker);
  if (!match) return null;
  const tail = upper.slice(match.index + match[0].length).trim();
  return extractDoubleAwardGradesFromTail(tail);
}

function cleanOcrLine(line) {
  return String(line || "")
    .replace(/[|]/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** @param {string} text */
export function parseRowsFromText(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map(cleanOcrLine)
    .filter(Boolean);
  const rows = [];
  const seen = new Set();

  for (const line of lines) {
    const lower = normalize(line);
    if (!lower || seen.has(lower)) continue;
    seen.add(lower);

    const scienceDouble = extractScienceDoubleAwardFromLine(line);
    if (scienceDouble) {
      rows.push({
        key: makeKey(),
        subjectId: SCIENCE_DOUBLE_SUBJECT_ID,
        grade: scienceDouble.grade1,
        grade2: scienceDouble.grade2,
        sourceLabel: "Science Double Award",
      });
      continue;
    }

    const { label, grade } = splitLabelAndGrade(line);
    if (!grade || !VALID_GRADES.has(grade)) continue;

    const sourceLabel = cleanOcrLine(label);
    const { subjectId, confidence } = guessSubjectMatch(sourceLabel);
    if (!subjectId || !confidenceAllowsAutoRow(confidence)) continue;

    rows.push({
      key: makeKey(),
      subjectId,
      grade,
      grade2: "",
      sourceLabel: sourceLabel || line,
    });
  }
  return rows;
}

function createIssues(rows) {
  const issues = [];
  const seenSubjects = new Set();
  for (const row of rows) {
    if (!row.subjectId) {
      issues.push({ rowKey: row.key, type: "unknown_subject" });
    } else if (seenSubjects.has(row.subjectId)) {
      issues.push({ rowKey: row.key, type: "duplicate_subject" });
    } else {
      seenSubjects.add(row.subjectId);
    }

    if (!row.grade) {
      issues.push({ rowKey: row.key, type: "missing_grade" });
    } else if (!VALID_GRADES.has(row.grade)) {
      issues.push({ rowKey: row.key, type: "invalid_grade" });
    } else if (row.subjectId === SCIENCE_DOUBLE_SUBJECT_ID && !row.grade2) {
      issues.push({ rowKey: row.key, type: "missing_grade2" });
    } else if (row.grade2 && !VALID_GRADES.has(row.grade2)) {
      issues.push({ rowKey: row.key, type: "invalid_grade2" });
    }
  }
  return issues;
}

function countReadyRows(rows) {
  const seenSubjects = new Set();
  let count = 0;

  for (const row of rows) {
    if (!row.subjectId || !VALID_GRADES.has(row.grade) || seenSubjects.has(row.subjectId)) continue;
    if (row.subjectId === SCIENCE_DOUBLE_SUBJECT_ID && !VALID_GRADES.has(row.grade2)) continue;
    seenSubjects.add(row.subjectId);
    count += 1;
  }

  return count;
}

function hasEnoughReadyRows(rows) {
  return countReadyRows(rows) >= MIN_READY_IMPORT_ROWS;
}

async function ensureOcrWorker(onProgress) {
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = import("tesseract.js").then(async ({ createWorker }) => {
      const worker = await createWorker("eng", 1, {
        logger: (message) => {
          if (message?.status && typeof onProgress === "function") onProgress(message);
        },
      });
      await worker.setParameters(OCR_OPTIONS);
      return worker;
    });
  }
  const worker = await ocrWorkerPromise;
  return worker;
}

async function preprocessImage(fileOrUrl) {
  const sourceUrl = typeof fileOrUrl === "string" ? fileOrUrl : URL.createObjectURL(fileOrUrl);
  try {
    const img = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Could not read that image."));
      element.src = sourceUrl;
    });
    const maxWidth = Math.max(1800, img.width);
    const scale = maxWidth / img.width;
    const width = Math.round(img.width * scale);
    const height = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Could not prepare the uploaded image.");
    context.filter = "grayscale(1) contrast(1.35) brightness(1.05)";
    context.drawImage(img, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let index = 0; index < data.length; index += 4) {
      const average = (data[index] + data[index + 1] + data[index + 2]) / 3;
      const value = average > 170 ? 255 : average < 90 ? 0 : average;
      data[index] = value;
      data[index + 1] = value;
      data[index + 2] = value;
    }
    context.putImageData(imageData, 0, 0);
    return canvas;
  } finally {
    if (typeof fileOrUrl !== "string") URL.revokeObjectURL(sourceUrl);
  }
}

async function recognizeCanvas(canvas, onProgress) {
  const worker = await ensureOcrWorker(onProgress);
  const result = await worker.recognize(canvas);
  return result?.data?.text || "";
}

async function loadPdfJs() {
  const [pdfjsLib, workerModule] = await Promise.all([
    import("pdfjs-dist/legacy/build/pdf.mjs"),
    import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url"),
  ]);
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;
  return pdfjsLib;
}

async function renderPdfPageToCanvas(page) {
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas;
}

async function extractPdfText(file, onProgress) {
  const pdfjsLib = await loadPdfJs();
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const chunks = [];
  const pagesNeedingOcr = [];

  if (typeof onProgress === "function") {
    onProgress({ status: "Reading PDF text...", progress: 0 });
  }

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    if (typeof onProgress === "function") {
      onProgress({ status: "Reading PDF text...", progress: pageNumber / pdf.numPages });
    }
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent().catch(() => null);
    const text = content?.items?.map((item) => item.str).join("\n").trim() || "";
    if (text) chunks.push(text);
    if (!text || text.length < MIN_PDF_TEXT_CHARS) {
      pagesNeedingOcr.push({ pageNumber, page });
    }
  }

  return { text: chunks.join("\n"), pagesNeedingOcr, pageCount: pdf.numPages };
}

export function reviewIssueLabel(type) {
  if (type === "unknown_subject") return "Choose the subject";
  if (type === "missing_grade") return "Choose a grade";
  if (type === "invalid_grade") return "Grade is not valid";
  if (type === "duplicate_subject") return "Subject appears more than once";
  return "Check this row";
}

export function buildImportReview(rows, sourceMeta = {}, ocrText = "", extra = {}) {
  return {
    rows,
    issues: createIssues(rows),
    sourceMeta,
    ocrText,
    documentWarning: extra.documentWarning || "",
  };
}

function finalizeImportReview(ocrText, sourceMeta) {
  const assessment = assessImportedDocument(ocrText);
  if (!assessment.looksLikeCertificate) {
    return buildImportReview([], sourceMeta, ocrText, { documentWarning: assessment.warning || WRONG_DOCUMENT_WARNING });
  }

  const rows = parseRowsFromText(ocrText);
  if (countReadyRows(rows) < MIN_AUTO_IMPORT_ROWS) {
    return buildImportReview([], sourceMeta, ocrText, {
      documentWarning:
        "Thuto could not find enough clear subject and grade lines. Try a clearer certificate photo, or add rows manually.",
    });
  }

  return buildImportReview(rows, sourceMeta, ocrText);
}

export function updateReviewRows(rows) {
  return buildImportReview(
    rows.map((row) => ({
      ...row,
      sourceLabel: row.sourceLabel || SUBJECTS_BY_ID[row.subjectId]?.label || "",
    })),
  );
}

export async function importCertificateFile(file, onProgress) {
  if (!(file instanceof File)) throw new Error("Choose an image or PDF certificate first.");
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);

  if (isPdf) {
    const { text, pagesNeedingOcr, pageCount } = await extractPdfText(file, onProgress);
    let ocrText = text;
    const sourceMeta = { kind: "pdf", pageCount, fileName: file.name };

    if (hasEnoughReadyRows(parseRowsFromText(ocrText))) {
      if (typeof onProgress === "function") onProgress({ status: "Found subjects, preparing review...", progress: 1 });
      return finalizeImportReview(ocrText, sourceMeta);
    }

    for (let index = 0; index < pagesNeedingOcr.length; index += 1) {
      const { page } = pagesNeedingOcr[index];
      if (typeof onProgress === "function") {
        onProgress({
          status: `Scanning page ${index + 1} of ${pagesNeedingOcr.length}...`,
          progress: index / Math.max(pagesNeedingOcr.length, 1),
        });
      }
      const canvas = await renderPdfPageToCanvas(page);
      if (!canvas) continue;
      const nextText = await recognizeCanvas(canvas, (message) => {
        if (typeof onProgress !== "function") return;
        onProgress({
          ...message,
          status: `Scanning page ${index + 1} of ${pagesNeedingOcr.length}...`,
        });
      });
      ocrText = [ocrText, nextText].filter(Boolean).join("\n");
      if (hasEnoughReadyRows(parseRowsFromText(ocrText))) break;
    }

    if (typeof onProgress === "function") onProgress({ status: "Preparing review...", progress: 1 });
    return finalizeImportReview(ocrText, sourceMeta);
  }

  const previewUrl = URL.createObjectURL(file);
  const canvas = await preprocessImage(file);
  const ocrText = await recognizeCanvas(canvas, onProgress);
  return finalizeImportReview(ocrText, { kind: "image", fileName: file.name, previewUrl });
}
