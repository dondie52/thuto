import { getSupabase } from "./supabase.js";

const CONTENT_BUCKET = "content-assets";

function randomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function safeFileName(name) {
  return String(name || "asset")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "asset";
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function mergeContentOverrides(baseRows, overrideRows) {
  const byId = new Map((baseRows || []).map((row) => [row.id, { ...row }]));
  for (const override of overrideRows || []) {
    const id = override?.id || override?.patch?.id;
    if (!id || !isPlainObject(override.patch)) continue;
    const current = byId.get(id);
    const patch = { ...override.patch, id };
    byId.set(id, current ? { ...current, ...patch } : patch);
  }
  const ordered = (baseRows || []).map((row) => byId.get(row.id)).filter(Boolean);
  const baseIds = new Set((baseRows || []).map((row) => row.id));
  for (const override of overrideRows || []) {
    const id = override?.id || override?.patch?.id;
    if (id && !baseIds.has(id) && byId.has(id)) ordered.push(byId.get(id));
  }
  return ordered;
}

async function fetchOverrides(table, { includeDrafts = false } = {}) {
  const supabase = getSupabase();
  if (!supabase) return [];
  let query = supabase.from(table).select("id, patch, published, updated_at").order("updated_at", { ascending: false });
  if (!includeDrafts) query = query.eq("published", true);
  const { data, error } = await query;
  if (error) {
    console.warn(`Could not load ${table}:`, error.message);
    return [];
  }
  return data || [];
}

export function fetchUniversityOverrides(options) {
  return fetchOverrides("content_university_overrides", options);
}

export function fetchProgrammeOverrides(options) {
  return fetchOverrides("content_programme_overrides", options);
}

async function saveOverride(table, { id, patch, published = true }) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");
  const cleanId = String(id || patch?.id || "").trim();
  if (!cleanId) throw new Error("An id is required.");
  const payload = {
    id: cleanId,
    patch: { ...patch, id: cleanId },
    published: Boolean(published),
    updated_by: (await supabase.auth.getUser()).data?.user?.id || null,
  };
  const { data, error } = await supabase
    .from(table)
    .upsert(payload, { onConflict: "id" })
    .select("id, patch, published, updated_at")
    .single();
  if (error) throw error;
  return data;
}

export function saveUniversityOverride(input) {
  return saveOverride("content_university_overrides", input);
}

export function saveProgrammeOverride(input) {
  return saveOverride("content_programme_overrides", input);
}

export async function deleteUniversityOverride(id) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.from("content_university_overrides").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteProgrammeOverride(id) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.from("content_programme_overrides").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadContentAsset(file, folder = "general") {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");
  if (!file) throw new Error("Choose a file to upload.");
  const safeFolder = String(folder || "general").replace(/[^a-z0-9/_-]+/gi, "-").slice(0, 80) || "general";
  const path = `${safeFolder}/${Date.now()}-${randomId()}-${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from(CONTENT_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(CONTENT_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
