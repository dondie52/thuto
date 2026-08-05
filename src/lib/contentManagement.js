import { getSupabase } from "./supabase.js";
import { randomId, safeFileName } from "./fileNames.js";

const CONTENT_BUCKET = "content-assets";

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

/**
 * Institutions can rename themselves from the CMS, but programmes are matched to a university
 * by name (see `programmeBelongsToUniversity`), so the pre-override name has to survive the
 * merge or a rename silently detaches every programme.
 *
 * @param {Record<string, unknown>} current
 * @param {Record<string, unknown>} patch
 */
export function carryCanonicalName(current, patch) {
  if (current?.canonicalName) return { canonicalName: current.canonicalName };
  if (!patch?.name || !current?.name || patch.name === current.name) return {};
  return { canonicalName: current.name };
}

export function mergeContentOverrides(baseRows, overrideRows) {
  const byId = new Map((baseRows || []).map((row) => [row.id, { ...row }]));
  for (const override of overrideRows || []) {
    const id = override?.id || override?.patch?.id;
    if (!id || !isPlainObject(override.patch)) continue;
    const current = byId.get(id);
    const patch = { ...override.patch, id };
    byId.set(id, current ? { ...current, ...patch, ...carryCanonicalName(current, patch) } : patch);
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

export async function fetchPageContent(pageKey, { includeDrafts = false } = {}) {
  const supabase = getSupabase();
  const cleanPageKey = String(pageKey || "").trim();
  if (!supabase || !cleanPageKey) return [];
  let query = supabase
    .from("content_page_sections")
    .select("page_key, section_key, content, published, sort_order, schema_version, updated_at")
    .eq("page_key", cleanPageKey)
    .order("sort_order", { ascending: true })
    .order("section_key", { ascending: true });
  if (!includeDrafts) query = query.eq("published", true);
  const { data, error } = await query;
  if (error) {
    console.warn(`Could not load page content for ${cleanPageKey}:`, error.message);
    return [];
  }
  return data || [];
}

export function mergePageSections(defaults, rows) {
  const merged = { ...(defaults || {}) };
  for (const row of rows || []) {
    const sectionKey = row?.section_key;
    if (!sectionKey || !isPlainObject(row.content)) continue;
    const current = isPlainObject(merged[sectionKey]) ? merged[sectionKey] : {};
    merged[sectionKey] = { ...current, ...row.content };
  }
  return merged;
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

export async function savePageSection({ pageKey, sectionKey, content, published = true, sortOrder = 0, schemaVersion = 1 }) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");
  const cleanPageKey = String(pageKey || "").trim();
  const cleanSectionKey = String(sectionKey || "").trim();
  if (!cleanPageKey || !cleanSectionKey) throw new Error("A page and section are required.");
  if (!isPlainObject(content)) throw new Error("Section content must be an object.");
  const payload = {
    page_key: cleanPageKey,
    section_key: cleanSectionKey,
    content,
    published: Boolean(published),
    sort_order: Number(sortOrder || 0),
    schema_version: Number(schemaVersion || 1),
    updated_by: (await supabase.auth.getUser()).data?.user?.id || null,
  };
  const { data, error } = await supabase
    .from("content_page_sections")
    .upsert(payload, { onConflict: "page_key,section_key" })
    .select("page_key, section_key, content, published, sort_order, schema_version, updated_at")
    .single();
  if (error) throw error;
  return data;
}

export async function deletePageSection(pageKey, sectionKey) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase
    .from("content_page_sections")
    .delete()
    .eq("page_key", pageKey)
    .eq("section_key", sectionKey);
  if (error) throw error;
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
