import { createClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

/**
 * @returns {boolean}
 */
export function isSupabaseConfigured() {
  return Boolean(url && anonKey);
}

let client = null;

/**
 * @returns {import("@supabase/supabase-js").SupabaseClient | null}
 */
export function getSupabase() {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(url, anonKey);
  }
  return client;
}
