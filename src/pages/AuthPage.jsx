import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import BrandMark from "../components/BrandMark.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { getSupabase, isSupabaseConfigured } from "../lib/supabase.js";
import { safeInternalPath } from "../lib/urlSafety.js";

const authLogoTiles = [
  { src: "university-logos/ub.jpg", alt: "University of Botswana" },
  { src: "university-logos/biust.jpg", alt: "BIUST" },
  { src: "university-logos/botho.jpg", alt: "Botho University" },
  { src: "university-logos/bac.jpg", alt: "Botswana Accountancy College" },
  { src: "university-logos/limkokwing.jpg", alt: "Limkokwing University" },
  { src: "university-logos/bou.jpg", alt: "Botswana Open University" },
];

function getSafeNext(searchParams) {
  return safeInternalPath(searchParams.get("next")) || "/predictor";
}

function authLink(path, next) {
  const params = new URLSearchParams();
  if (next) params.set("next", next);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export default function AuthPage({ mode }) {
  const isSignup = mode === "signup";
  useDocumentTitle(`${isSignup ? "Sign up" : "Log in"} | Thuto`);

  const baseUrl = import.meta.env.BASE_URL;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = useMemo(() => getSafeNext(searchParams), [searchParams]);
  const configured = isSupabaseConfigured();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const alternateHref = authLink(isSignup ? "/login" : "/signup", nextPath);

  useEffect(() => {
    if (!configured) return undefined;
    let cancelled = false;
    const sb = getSupabase();
    sb?.auth.getSession().then(({ data }) => {
      if (!cancelled && data?.session) {
        navigate(nextPath, { replace: true });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [configured, navigate, nextPath]);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setStatus(null);

    const sb = getSupabase();
    if (!sb) {
      setError("Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable accounts.");
      return;
    }

    setSubmitting(true);
    try {
      if (isSignup) {
        const { data, error: signUpError } = await sb.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (signUpError) throw signUpError;
        if (data?.session) {
          navigate(nextPath, { replace: true });
          return;
        }
        setStatus("Account created. Check your email to confirm your address, then log in to continue.");
      } else {
        const { error: signInError } = await sb.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) throw signInError;
        navigate(nextPath, { replace: true });
      }
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="thuto-page-bg min-h-dvh overflow-hidden text-slate-900">
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <BrandMark />
        <Link
          to="/"
          className="focus-ring rounded-xl border border-white/60 bg-white/45 px-3 py-2 text-sm font-semibold text-stone-600 shadow-sm backdrop-blur transition hover:bg-white/80 hover:text-brand-900"
        >
          Back home
        </Link>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100dvh-5.5rem)] w-full max-w-6xl items-center gap-8 px-4 pb-10 pt-3 sm:px-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden lg:block">
          <div className="thuto-auth-ribbon pointer-events-none absolute -left-16 top-1/2 h-72 w-[34rem] -translate-y-1/2 rotate-[-7deg] rounded-[3rem] opacity-70" aria-hidden />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-700">Thuto account</p>
            <h1 className="mt-4 max-w-lg font-display text-5xl font-semibold leading-tight text-brand-900 drop-shadow-[0_1px_0_rgba(255,255,255,0.65)]">
              Keep your university path in one calm place.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-stone-600">
              Save your shortlist, return to eligibility checks, and keep exploring programmes with a profile that follows
              your planning.
            </p>
            <div className="mt-8 max-w-lg overflow-hidden rounded-[2rem] border border-white/70 bg-white/50 p-3 shadow-card backdrop-blur">
              <div className="grid grid-cols-3 gap-3">
                {authLogoTiles.map((logo) => (
                  <div key={logo.src} className="flex h-24 items-center justify-center rounded-2xl border border-brand-100/70 bg-white/85 p-4 shadow-sm">
                    <img src={`${baseUrl}${logo.src}`} alt={logo.alt} className="max-h-full max-w-full object-contain" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8 grid max-w-md grid-cols-3 gap-3">
              {["Eligibility", "Shortlists", "Guidance"].map((label) => (
                <div key={label} className="rounded-2xl border border-white/70 bg-white/65 px-4 py-3 shadow-sm backdrop-blur">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="thuto-surface-panel mx-auto w-full max-w-md rounded-[1.75rem] border border-white/70 p-5 shadow-card backdrop-blur-xl sm:p-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Student portal</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-brand-900">
              {isSignup ? "Create your account" : "Log in to continue"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              {isSignup
                ? "Start with email and password. You can head straight to the eligibility checker after confirmation."
                : "Use your Thuto account to continue to the eligibility checker."}
            </p>
          </div>

          {!configured ? (
            <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              Accounts are not enabled in this environment yet. Add Supabase URL and anon key environment variables to
              activate login and sign up.
            </p>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            {isSignup ? (
              <label className="block">
                <span className="text-sm font-semibold text-stone-700">Full name</span>
                <input
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={!configured || submitting}
                  className="focus-ring mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm transition placeholder:text-stone-400 disabled:cursor-not-allowed disabled:bg-stone-100"
                  placeholder="Your name"
                />
              </label>
            ) : null}

            <label className="block">
              <span className="text-sm font-semibold text-stone-700">Email address</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!configured || submitting}
                className="focus-ring mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm transition placeholder:text-stone-400 disabled:cursor-not-allowed disabled:bg-stone-100"
                placeholder="you@example.com"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-stone-700">Password</span>
              <input
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={!configured || submitting}
                className="focus-ring mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm transition placeholder:text-stone-400 disabled:cursor-not-allowed disabled:bg-stone-100"
                placeholder={isSignup ? "Create a password" : "Enter your password"}
              />
            </label>

            {error ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800" role="alert">
                {error}
              </p>
            ) : null}

            {status ? (
              <p className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm leading-6 text-brand-900" role="status">
                {status}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={!configured || submitting}
              className="focus-ring inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-brand-700 px-5 py-3 text-base font-semibold text-white shadow-md transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600 disabled:shadow-none"
            >
              {submitting ? "Please wait..." : isSignup ? "Sign up" : "Log in"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-stone-600">
            {isSignup ? "Already have an account?" : "New to Thuto?"}{" "}
            <Link to={alternateHref} className="focus-ring rounded-lg font-semibold text-brand-700 underline-offset-4 hover:text-brand-900 hover:underline">
              {isSignup ? "Log in" : "Create account"}
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
