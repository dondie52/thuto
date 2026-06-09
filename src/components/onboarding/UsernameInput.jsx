import { useEffect, useState } from "react";
import { getSupabase } from "../../lib/supabase.js";
import { checkUsernameAvailable, normalizeUsername, validateUsername } from "../../lib/username.js";

/**
 * @param {{
 *   value: string,
 *   onChange: (value: string) => void,
 *   currentUserId?: string | null,
 *   disabled?: boolean,
 *   onValidityChange?: (valid: boolean) => void,
 * }} props
 */
export default function UsernameInput({ value, onChange, currentUserId, disabled = false, onValidityChange }) {
  const [checking, setChecking] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  const normalized = normalizeUsername(value);
  const formatValidation = validateUsername(normalized);
  const formatError = value.trim() ? formatValidation.error : null;

  useEffect(() => {
    if (!normalized || !formatValidation.valid) {
      setAvailabilityError("");
      onValidityChange?.(false);
      return undefined;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      const supabase = getSupabase();
      if (!supabase) {
        onValidityChange?.(formatValidation.valid);
        return;
      }
      setChecking(true);
      try {
        const result = await checkUsernameAvailable(supabase, normalized, currentUserId);
        if (!active) return;
        setAvailabilityError(result.available ? "" : result.error || "Username unavailable.");
        onValidityChange?.(result.available);
      } catch {
        if (!active) return;
        setAvailabilityError("");
        onValidityChange?.(formatValidation.valid);
      } finally {
        if (active) setChecking(false);
      }
    }, 400);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [normalized, formatValidation.valid, currentUserId, onValidityChange]);

  const displayError = formatError || availabilityError;

  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600">Username</span>
      <div className="relative mt-1">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-stone-400">
          @
        </span>
        <input
          value={value}
          onChange={(event) => onChange(normalizeUsername(event.target.value))}
          disabled={disabled}
          autoComplete="username"
          maxLength={30}
          required
          placeholder="your_handle"
          className="w-full rounded-xl border border-brand-200 bg-white py-2.5 pl-8 pr-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-60"
        />
      </div>
      <p className="mt-1 text-xs text-stone-500">
        {checking ? "Checking availability..." : "Lowercase letters, numbers, and underscores only."}
      </p>
      {displayError ? (
        <p className="mt-1 text-xs text-red-700" role="alert">
          {displayError}
        </p>
      ) : null}
      {!displayError && normalized && formatValidation.valid && !checking ? (
        <p className="mt-1 text-xs text-emerald-700" role="status">
          @{normalized} is available.
        </p>
      ) : null}
    </label>
  );
}
