import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "./supabase.js";

const LEGACY_ACCOUNT_MODE_KEY = "thuto-account-mode";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(() => isSupabaseConfigured());
  const [authError, setAuthError] = useState("");
  const supabaseConfigured = isSupabaseConfigured();

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
      if (!nextSession) setAuthError("");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

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
  }

  const value = useMemo(
    () => ({
      authError,
      isLoading,
      logout,
      session,
      signIn,
      signUp,
      supabaseConfigured,
      user: session?.user || null,
    }),
    [authError, isLoading, session, supabaseConfigured],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
