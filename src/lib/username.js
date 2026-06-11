const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

const RESERVED_USERNAMES = new Set([
  "admin",
  "thuto",
  "support",
  "help",
  "feed",
  "official",
  "moderator",
  "system",
  "null",
  "undefined",
]);

/**
 * @param {string} value
 */
export function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9_]/g, "");
}

/**
 * @param {string} value
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateUsername(value) {
  const normalized = normalizeUsername(value);
  if (!normalized) return { valid: false, error: "Username is required." };
  if (normalized.length < 3) return { valid: false, error: "Username must be at least 3 characters." };
  if (normalized.length > 30) return { valid: false, error: "Username must be 30 characters or fewer." };
  if (!USERNAME_PATTERN.test(normalized)) {
    return { valid: false, error: "Use only lowercase letters, numbers, and underscores." };
  }
  if (RESERVED_USERNAMES.has(normalized)) {
    return { valid: false, error: "This username is reserved." };
  }
  return { valid: true, error: null };
}

/**
 * @param {string} username
 * @param {string | null | undefined} currentUserId
 */
export async function checkUsernameAvailable(supabase, username, currentUserId) {
  const normalized = normalizeUsername(username);
  const validation = validateUsername(normalized);
  if (!validation.valid) return { available: false, error: validation.error };

  const { data, error } = await supabase.rpc("is_username_available", {
    p_username: normalized,
    p_exclude_user_id: currentUserId || null,
  });
  if (error) throw error;
  if (data === false) return { available: false, error: "This username is already taken." };
  return { available: true, error: null };
}
