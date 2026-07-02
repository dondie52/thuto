/**
 * Build an absolute auth callback URL that respects the Vite base path.
 * @param {Record<string, string>} [params]
 */
export function buildAuthRedirectUrl(params = {}) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const search = new URLSearchParams(params);
  const query = search.toString();
  return `${window.location.origin}${base}/auth${query ? `?${query}` : ""}`;
}

/**
 * @param {import("@supabase/supabase-js").User | null | undefined} user
 */
export function getAuthProvider(user) {
  return user?.app_metadata?.provider || "email";
}

/**
 * @param {import("@supabase/supabase-js").User | null | undefined} user
 */
export function usesPasswordAuth(user) {
  const provider = getAuthProvider(user);
  return provider === "email" || provider === "supabase";
}

/**
 * @param {string | null | undefined} provider
 */
export function formatAuthProviderLabel(provider) {
  if (!provider || provider === "email" || provider === "supabase") {
    return "Email and password";
  }
  if (provider === "google") return "Google";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}
