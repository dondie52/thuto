import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

function cleanMode(value) {
  return value === "login" ? "login" : "signup";
}

export default function Auth() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = cleanMode(searchParams.get("mode"));
  const { signIn, signUp, supabaseConfigured, user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useDocumentTitle(`${mode === "login" ? "Log in" : "Sign up"} | Thuto`);

  useEffect(() => {
    if (user) navigate("/app", { replace: true });
  }, [navigate, user]);

  const title = mode === "login" ? "Log in to Thuto" : "Create your Thuto account";
  const submitLabel = useMemo(() => {
    if (isSubmitting) return mode === "login" ? "Logging in..." : "Creating account...";
    return mode === "login" ? "Log in" : "Sign up";
  }, [isSubmitting, mode]);

  function switchMode(nextMode) {
    setMessage("");
    setError("");
    setSearchParams({ mode: nextMode });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setError("");
    try {
      if (mode === "login") {
        await signIn({ email, password });
        navigate("/app");
      } else {
        const data = await signUp({ email, password, fullName });
        if (data?.session) {
          navigate("/app");
        } else {
          setMessage("Check your email to finish setting up your Thuto account.");
        }
      }
    } catch (err) {
      setError(err.message || "Account request failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Thuto account</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-brand-900">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Sign in to save your pathway and keep your preferences across visits.
        </p>
      </div>

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-stone-100 p-1">
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
              mode === "signup" ? "bg-white text-brand-900 shadow-sm" : "text-stone-600 hover:text-brand-900"
            }`}
          >
            Sign up
          </button>
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
              mode === "login" ? "bg-white text-brand-900 shadow-sm" : "text-stone-600 hover:text-brand-900"
            }`}
          >
            Log in
          </button>
        </div>

        {!supabaseConfigured ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Account login is unavailable until Supabase environment variables are configured.
          </p>
        ) : null}

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          {mode === "signup" ? (
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Full name</span>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
                className="mt-1 w-full rounded-xl border border-brand-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
                placeholder="Your name"
              />
            </label>
          ) : null}

          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-xl border border-brand-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="mt-1 w-full rounded-xl border border-brand-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="At least 6 characters"
            />
          </label>

          {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
          {message ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!supabaseConfigured || isSubmitting}
            className="focus-ring w-full rounded-xl bg-brand-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitLabel}
          </button>
        </form>
      </section>

      <Link to="/app" className="inline-flex text-sm font-semibold text-brand-700 underline hover:text-brand-900">
        Back to home
      </Link>
    </div>
  );
}
