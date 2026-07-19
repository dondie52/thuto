import { MARKET_COUNTRIES, marketCountryLabel } from "../lib/marketCountry.js";

/**
 * Compact country selector for market catalogue switching.
 * @param {{
 *   value: string,
 *   onChange: (code: string) => void,
 *   disabled?: boolean,
 *   id?: string,
 *   label?: string,
 *   hint?: string,
 * }} props
 */
export default function MarketCountrySelect({
  value,
  onChange,
  disabled = false,
  id = "market-country",
  label = "Country",
  hint,
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-brand-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-60"
      >
        {MARKET_COUNTRIES.map((country) => (
          <option key={country.code} value={country.code}>
            {country.label}
          </option>
        ))}
      </select>
      {hint ? <p className="mt-1 text-xs text-stone-500">{hint}</p> : null}
      {!hint ? (
        <p className="mt-1 text-xs text-stone-500">
          Shows institutions and programmes for {marketCountryLabel(value)}.
        </p>
      ) : null}
    </label>
  );
}
