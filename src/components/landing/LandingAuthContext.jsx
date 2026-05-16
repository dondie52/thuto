import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "../../lib/supabase.js";

const LandingAuthContext = createContext({ isSignedIn: false });

export function LandingAuthProvider({ children }) {
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsSignedIn(false);
      return undefined;
    }

    let cancelled = false;
    const supabase = getSupabase();

    supabase?.auth.getSession().then(({ data }) => {
      if (!cancelled) setIsSignedIn(Boolean(data?.session));
    });

    const {
      data: { subscription } = {},
    } = supabase?.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session));
    }) ?? {};

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ isSignedIn }), [isSignedIn]);

  return <LandingAuthContext.Provider value={value}>{children}</LandingAuthContext.Provider>;
}

export function useLandingAuth() {
  return useContext(LandingAuthContext);
}

export function landingTo(isSignedIn, signedInPath, guestHash) {
  return isSignedIn ? signedInPath : `/${guestHash}`;
}
