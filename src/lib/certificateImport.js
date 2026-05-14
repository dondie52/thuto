import { BGCSE_SUBJECTS, SUBJECTS_BY_ID } from "./bgcseSubjects.js";

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

function guessSubjectId(rawLabel) {
  const clean = normalizeForOcr(rawLabel);
  if (!clean) return "";

  for (const subjectMeta of SUBJECT_LOOKUPS) {
    if (subjectMeta.tokens.includes(clean)) return subjectMeta.id;
  }

  for (const subjectMeta of SUBJECT_LOOKUPS) {
    if (subjectMeta.tokens.some((token) => token.includes(clean) || clean.includes(token))) {
      return subjectMeta.id;
    }
  }

  let bestId = "";
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const subjectMeta of SUBJECT_LOOKUPS) {
    for (const token of subjectMeta.tokens) {
      const distance = levenshtein(clean, token);
      const threshold = Math.max(2, Math.floor(token.length * 0.22));
      if (distance <= threshold && distance < bestDistance) {
        bestDistance = distance;
        bestId = subjectMeta.id;
      }
    }
  }
  return bestId;
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
  if (!grade) return { label: line, grade: "" };
  const upper = line.toUpperCase();
  const gradeIndex = upper.lastIndexOf(grade === "A*" ? "A*" : grade);
  const label = gradeIndex >= 0 ? line.slice(0, gradeIndex) : line;
  return { label, grade };
}

function cleanOcrLine(line) {
  return String(line || "")
    .replace(/[|]/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseRowsFromText(text) {
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

    const { label, grade } = splitLabelAndGrade(line);
    const sourceLabel = cleanOcrLine(label);
    const subjectId = guessSubjectId(sourceLabel);
    if (!subjectId && !grade) continue;
    rows.push({
      key: makeKey(),
      subjectId,
      grade,
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
    }
  }
  return issues;
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

async function extractPdfText(file, onProgress) {
  const pdfjsLib = await loadPdfJs();
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const chunks = [];
  const pageCanvases = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    if (typeof onProgress === "function") {
      onProgress({ status: `Reading page ${pageNumber} of ${pdf.numPages}`, progress: pageNumber / pdf.numPages });
    }
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent().catch(() => null);
    const text = content?.items?.map((item) => item.str).join("\n").trim() || "";
    if (text) chunks.push(text);
    if (!text || text.length < 50) {
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (context) {
        await page.render({ canvasContext: context, viewport }).promise;
        pageCanvases.push(canvas);
      }
    }
  }

  return { text: chunks.join("\n"), pageCanvases, pageCount: pdf.numPages };
}

export function reviewIssueLabel(type) {
  if (type === "unknown_subject") return "Choose the subject";
  if (type === "missing_grade") return "Choose a grade";
  if (type === "invalid_grade") return "Grade is not valid";
  if (type === "duplicate_subject") return "Subject appears more than once";
  return "Check this row";
}

export function buildImportReview(rows, sourceMeta = {}, ocrText = "") {
  return {
    rows,
    issues: createIssues(rows),
    sourceMeta,
    ocrText,
  };
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
    const { text, pageCanvases, pageCount } = await extractPdfText(file, onProgress);
    let ocrText = text;
    for (let index = 0; index < pageCanvases.length; index += 1) {
      if (typeof onProgress === "function") {
        onProgress({
          status: `Scanning PDF page ${index + 1} of ${pageCanvases.length}`,
          progress: (index + 1) / Math.max(pageCanvases.length, 1),
        });
      }
      const nextText = await recognizeCanvas(pageCanvases[index], onProgress);
      ocrText = [ocrText, nextText].filter(Boolean).join("\n");
    }
    const rows = parseRowsFromText(ocrText);
    return buildImportReview(rows, { kind: "pdf", pageCount, fileName: file.name }, ocrText);
  }

  const previewUrl = URL.createObjectURL(file);
  const canvas = await preprocessImage(file);
  const ocrText = await recognizeCanvas(canvas, onProgress);
  const rows = parseRowsFromText(ocrText);
  return buildImportReview(rows, { kind: "image", fileName: file.name, previewUrl }, ocrText);
}
