import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "./supabase.js";
import { isPremiumActive } from "./premium.js";
import { normalizeProfileRow, updateUserProfile } from "./profile.js";

const LEGACY_ACCOUNT_MODE_KEY = "thuto-account-mode";

/** @typedef {Object} Profile
 * @property {string} id
 * @property {string | null} full_name
 * @property {string | null} avatar_url
 * @property {string | null} university_id
 * @property {string | null} university_name
 * @property {'studying' | 'aspiring' | null} university_status
 * @property {string | null} distinction
 * @property {string | null} stripe_customer_id
 * @property {string} payment_provider
 * @property {'free' | 'active' | 'past_due' | 'canceled'} premium_status
 * @property {'monthly' | 'annual' | 'season_pass' | null} premium_plan
 * @property {string | null} premium_until
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(() => isSupabaseConfigured());
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const supabaseConfigured = isSupabaseConfigured();

  const fetchProfile = useCallback(async (userId) => {
    const supabase = getSupabase();
    if (!supabase || !userId) {
      setProfile(null);
      return null;
    }
    setIsProfileLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, avatar_url, university_id, university_name, university_status, distinction, stripe_customer_id, payment_provider, premium_status, premium_plan, premium_until",
      )
      .eq("id", userId)
      .maybeSingle();
    setIsProfileLoading(false);
    if (error) {
      console.warn("Profile fetch failed:", error.message);
      setProfile(null);
      return null;
    }
    const normalized = normalizeProfileRow(data);
    setProfile(normalized);
    return normalized;
  }, []);

  const refreshProfile = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setProfile(null);
      return null;
    }
    return fetchProfile(userId);
  }, [fetchProfile, session?.user?.id]);

  const saveProfile = useCallback(
    async (patch) => {
      const updated = await updateUserProfile(patch);
      setProfile(updated);
      return updated;
    },
    [],
  );

  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_ACCOUNT_MODE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setIsLoading(false);
      return undefined;
    }

    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setAuthError(error.message);
      setSession(data?.session || null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setAuthError("");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setProfile(null);
      return;
    }
    fetchProfile(userId);
  }, [session?.user?.id, fetchProfile]);

  async function signUp({ email, password, fullName }) {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error("Account sign up is unavailable until Supabase is configured.");
    }
    setAuthError("");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || "",
        },
      },
    });
    if (error) {
      setAuthError(error.message);
      throw error;
    }
    if (data?.session) {
      setSession(data.session);
    }
    return data;
  }

  async function signIn({ email, password }) {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error("Account login is unavailable until Supabase is configured.");
    }
    setAuthError("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
      throw error;
    }
    setSession(data?.session || null);
    return data;
  }

  async function logout() {
    const supabase = getSupabase();
    setAuthError("");
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setAuthError(error.message);
        throw error;
      }
    }
    setSession(null);
    setProfile(null);
  }

  const isPremium = useMemo(() => isPremiumActive(profile), [profile]);

  const value = useMemo(
    () => ({
      authError,
      isLoading,
      isProfileLoading,
      logout,
      profile,
      refreshProfile,
      saveProfile,
      session,
      signIn,
      signUp,
      supabaseConfigured,
      user: session?.user || null,
      isPremium,
    }),
    [authError, isLoading, isProfileLoading, profile, refreshProfile, saveProfile, session, supabaseConfigured, isPremium],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
