import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "./supabase.js";

export const ACCOUNT_MODE_KEY = "thuto-account-mode";

const AuthContext = createContext(null);

function readAccountMode() {
  try {
    return localStorage.getItem(ACCOUNT_MODE_KEY) || "guest";
  } catch {
    return "guest";
  }
}

function writeAccountMode(mode) {
  try {
    localStorage.setItem(ACCOUNT_MODE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(() => isSupabaseConfigured());
  const [authError, setAuthError] = useState("");
  const [accountMode, setAccountMode] = useState(() => readAccountMode());
  const supabaseConfigured = isSupabaseConfigured();

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
      const nextSession = data?.session || null;
      setSession(nextSession);
      if (nextSession) {
        writeAccountMode("account");
        setAccountMode("account");
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        writeAccountMode("account");
        setAccountMode("account");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  function setGuestMode() {
    writeAccountMode("guest");
    setAccountMode("guest");
    setAuthError("");
  }

  async function continueAsGuest() {
    const supabase = getSupabase();
    if (supabase && session) {
      await supabase.auth.signOut();
      setSession(null);
    }
    setGuestMode();
  }

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
      writeAccountMode("account");
      setAccountMode("account");
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
    writeAccountMode("account");
    setAccountMode("account");
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
    setGuestMode();
  }

  const value = useMemo(
    () => ({
      accountMode: session ? "account" : accountMode,
      authError,
      continueAsGuest,
      isGuest: !session && accountMode === "guest",
      isLoading,
      logout,
      session,
      setGuestMode,
      signIn,
      signUp,
      supabaseConfigured,
      user: session?.user || null,
    }),
    [accountMode, authError, isLoading, session, supabaseConfigured],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
