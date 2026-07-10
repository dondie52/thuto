#!/usr/bin/env node
/**
 * Bulk-publish official Thuto Centre documents from a CSV manifest.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/bulk-upload-center-docs.mjs --manifest path/to/manifest.csv
 *
 * CSV columns (header required):
 *   file_path,title,university_id,document_type,faculty,course_code,description,academic_year,exam_session,university_name
 *
 * Only run locally with a service role key — never commit credentials.
 */

import { createClient } from "@supabase/supabase-js";
import { createReadStream, existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { createInterface } from "node:readline";

const MIME_BY_EXT = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const ALLOWED_TYPES = new Set([
  "lecture_notes",
  "past_paper",
  "exam_answer",
  "study_summary",
  "assignment_guide",
  "other",
]);

function parseArgs(argv) {
  const args = { manifest: "", adminUserId: "", dryRun: false };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--manifest") args.manifest = argv[++i] || "";
    else if (argv[i] === "--admin-user-id") args.adminUserId = argv[++i] || "";
    else if (argv[i] === "--dry-run") args.dryRun = true;
  }
  return args;
}

function splitCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

async function readCsv(path) {
  const stream = createReadStream(path, { encoding: "utf8" });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  /** @type {string[][]} */
  const rows = [];
  for await (const line of rl) {
    if (!line.trim()) continue;
    rows.push(splitCsvLine(line));
  }
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.toLowerCase());
  return rows.slice(1).map((cells) => {
    /** @type {Record<string, string>} */
    const record = {};
    headers.forEach((header, index) => {
      record[header] = cells[index] || "";
    });
    return record;
  });
}

function safeFileName(name) {
  return String(name || "document")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "document";
}

function mimeForPath(filePath) {
  const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
  return MIME_BY_EXT[ext] || "application/octet-stream";
}

async function main() {
  const { manifest, adminUserId, dryRun } = parseArgs(process.argv);
  if (!manifest) {
    console.error("Missing --manifest path/to/manifest.csv");
    process.exit(1);
  }
  if (!existsSync(manifest)) {
    console.error(`Manifest not found: ${manifest}`);
    process.exit(1);
  }

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const uploaderId = adminUserId || process.env.CENTER_ADMIN_USER_ID;

  if (!url || !serviceKey || !uploaderId) {
    console.error("Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and CENTER_ADMIN_USER_ID (or --admin-user-id).");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  const entries = await readCsv(manifest);
  if (!entries.length) {
    console.error("Manifest has no data rows.");
    process.exit(1);
  }

  let published = 0;
  let failed = 0;

  for (const [index, row] of entries.entries()) {
    const filePath = row.file_path;
    const title = row.title;
    const universityId = row.university_id;
    const documentType = row.document_type || "other";
    const faculty = row.faculty;
    const courseCode = row.course_code;

    if (!filePath || !title || !universityId || !faculty || !courseCode) {
      console.error(`Row ${index + 2}: missing required fields`);
      failed += 1;
      continue;
    }
    if (!existsSync(filePath)) {
      console.error(`Row ${index + 2}: file not found — ${filePath}`);
      failed += 1;
      continue;
    }
    if (!ALLOWED_TYPES.has(documentType)) {
      console.error(`Row ${index + 2}: invalid document_type — ${documentType}`);
      failed += 1;
      continue;
    }

    if (dryRun) {
      console.log(`[dry-run] would publish: ${title} (${filePath})`);
      published += 1;
      continue;
    }

    const documentId = crypto.randomUUID();
    const storagePath = `${uploaderId}/${documentId}/${safeFileName(basename(filePath))}`;
    const fileBuffer = await readFile(filePath);
    const mimeType = mimeForPath(filePath);
    const now = new Date().toISOString();

    const { error: uploadError } = await supabase.storage
      .from("thuto-center-docs")
      .upload(storagePath, fileBuffer, { contentType: mimeType, upsert: false });
    if (uploadError) {
      console.error(`Row ${index + 2}: storage upload failed — ${uploadError.message}`);
      failed += 1;
      continue;
    }

    const { error: insertError } = await supabase.from("center_documents").insert({
      id: documentId,
      uploader_id: uploaderId,
      title: title.trim(),
      description: (row.description || "").trim(),
      document_type: documentType,
      university_id: universityId.trim(),
      university_name: (row.university_name || "").trim(),
      faculty: faculty.trim(),
      course_code: courseCode.trim().toUpperCase(),
      academic_year: row.academic_year?.trim() || null,
      exam_session: row.exam_session?.trim() || null,
      storage_path: storagePath,
      file_name: basename(filePath),
      file_size: fileBuffer.byteLength,
      mime_type: mimeType,
      status: "published",
      source: "official",
      published_at: now,
      policy_version: "bw-v1",
      policy_accepted_at: now,
      copyright_declaration: true,
    });

    if (insertError) {
      await supabase.storage.from("thuto-center-docs").remove([storagePath]);
      console.error(`Row ${index + 2}: insert failed — ${insertError.message}`);
      failed += 1;
      continue;
    }

    console.log(`Published: ${title} → ${documentId}`);
    published += 1;
  }

  console.log(`Done. Published ${published}, failed ${failed}.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
