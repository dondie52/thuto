import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { getEntitlements } from "../lib/entitlements.js";

export default function SupportHub() {
  const { profile } = useAuth();
  const { supportTier } = getEntitlements(profile);
  const isPriority = supportTier === "priority";

  return (
    <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-brand-900">Get help</h2>
      {isPriority ? (
        <div className="mt-3 space-y-3 text-sm text-slate-700">
          <p>Pro members get priority support during application season.</p>
          <a
            href="mailto:support@thuto.bw?subject=Thuto%20Pro%20support"
            className="inline-flex rounded-xl bg-brand-700 px-4 py-2 font-semibold text-white hover:bg-brand-800"
          >
            Email support (24hr response)
          </a>
          <a
            href="https://wa.me/?text=Hi%20Thuto%20Pro%20support"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 inline-flex rounded-xl border border-brand-200 bg-white px-4 py-2 font-semibold text-brand-800 hover:bg-brand-50"
          >
            WhatsApp
          </a>
        </div>
      ) : (
        <div className="mt-3 space-y-2 text-sm text-slate-700">
          <p>Free accounts can use the community feed and FAQ.</p>
          <Link to="/feed" className="font-semibold text-brand-800 underline">
            Community feed
          </Link>
          <span className="mx-2 text-slate-400">·</span>
          <Link to="/support" className="font-semibold text-brand-800 underline">
            FAQ & feedback
          </Link>
          <p className="mt-2 text-xs text-slate-500">
            Need faster help? <Link to="/upgrade" className="text-brand-700 underline">Upgrade to Pro</Link> for email and
            WhatsApp support.
          </p>
        </div>
      )}
    </section>
  );
}
