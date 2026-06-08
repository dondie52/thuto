import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "./supabase.js";
import { isPremiumActive } from "./premium.js";
import { normalizeProfileRow, updateUserProfile } from "./profile.js";

const LEGACY_ACCOUNT_MODE_KEY = "thuto-account-mode";

/** @typedef {import("./profile.js").Profile} Profile */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(() => isSupabaseConfigured());
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [isSuperuserLoading, setIsSuperuserLoading] = useState(() => isSupabaseConfigured());
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
        "id, full_name, username, bio, avatar_url, university_id, university_name, university_status, distinction, syllabus_type, sponsorship_intent, fields_of_interest, onboarding_completed_at, onboarding_skipped_at, stripe_customer_id, payment_provider, premium_status, premium_plan, premium_until",
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

  const refreshSuperuserStatus = useCallback(async () => {
    const supabase = getSupabase();
    const userId = session?.user?.id;
    if (!supabase || !userId) {
      setIsSuperuser(false);
      setIsSuperuserLoading(false);
      return false;
    }

    setIsSuperuserLoading(true);
    const { data, error } = await supabase
      .from("feed_admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    setIsSuperuserLoading(false);

    if (error) {
      console.warn("Superuser status fetch failed:", error.message);
      setIsSuperuser(false);
      return false;
    }

    const nextIsSuperuser = Boolean(data);
    setIsSuperuser(nextIsSuperuser);
    return nextIsSuperuser;
  }, [session?.user?.id]);

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
      setIsSuperuserLoading(Boolean(nextSession?.user?.id));
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setIsSuperuser(false);
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

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabase();
    const userId = session?.user?.id;
    if (!supabase || !userId) {
      setIsSuperuser(false);
      setIsSuperuserLoading(false);
      return undefined;
    }

    async function checkSuperuserStatus() {
      setIsSuperuserLoading(true);
      const { data, error } = await supabase
        .from("feed_admins")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.warn("Superuser status fetch failed:", error.message);
        setIsSuperuser(false);
      } else {
        setIsSuperuser(Boolean(data));
      }
      setIsSuperuserLoading(false);
    }

    checkSuperuserStatus();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

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
      setIsSuperuserLoading(Boolean(data.session.user?.id));
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
    setIsSuperuserLoading(Boolean(data?.session?.user?.id));
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
    setIsSuperuser(false);
    setIsSuperuserLoading(false);
  }

  const isPremium = useMemo(() => isPremiumActive(profile), [profile]);

  const value = useMemo(
    () => ({
      authError,
      isLoading,
      isProfileLoading,
      isSuperuser,
      isSuperuserLoading,
      logout,
      profile,
      refreshProfile,
      refreshSuperuserStatus,
      saveProfile,
      session,
      signIn,
      signUp,
      supabaseConfigured,
      user: session?.user || null,
      isPremium,
    }),
    [
      authError,
      isLoading,
      isProfileLoading,
      isSuperuser,
      isSuperuserLoading,
      profile,
      refreshProfile,
      refreshSuperuserStatus,
      saveProfile,
      session,
      supabaseConfigured,
      isPremium,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
