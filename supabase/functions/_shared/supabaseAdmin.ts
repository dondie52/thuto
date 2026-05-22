import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export function getSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase admin credentials missing");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function getSupabaseUserClient(authHeader: string | null) {
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) throw new Error("Supabase URL/anon key missing");
  return createClient(url, anon, {
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
