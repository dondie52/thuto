import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { syncFromCloud } from "../lib/cloudSync.js";
import { verifyDpoPayment } from "../lib/billing.js";

export default function UpgradeSuccess() {
  useDocumentTitle("Pro activated | Thuto");
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const provider = searchParams.get("provider");
  const companyRef = searchParams.get("company_ref") || searchParams.get("CompanyRef");
  const transToken = searchParams.get("TransactionToken") || searchParams.get("transactionToken");
  const { refreshProfile } = useAuth();
  const [verifyState, setVerifyState] = useState("idle");
  const [verifyError, setVerifyError] = useState("");

  useEffect(() => {
    refreshProfile().then((p) => {
      if (p) syncFromCloud(p);
    });
  }, [refreshProfile]);

  useEffect(() => {
    if (provider !== "dpo" || !companyRef || !transToken) return;

    let cancelled = false;
    setVerifyState("loading");
    setVerifyError("");

    verifyDpoPayment({ companyRef, transToken })
      .then(async () => {
        if (cancelled) return;
        setVerifyState("done");
        const p = await refreshProfile();
        if (p) syncFromCloud(p);
      })
      .catch((err) => {
        if (cancelled) return;
        setVerifyState("error");
        setVerifyError(err instanceof Error ? err.message : "Verification failed.");
        refreshProfile().then((p) => {
          if (p) syncFromCloud(p);
        });
      });

    return () => {
      cancelled = true;
    };
  }, [provider, companyRef, transToken, refreshProfile]);

  const isDpoReturn = provider === "dpo" && companyRef;

  let message = "Thank you. If you just completed checkout, Pro will activate shortly.";
  if (sessionId) {
    message = "Your payment was received. Pro may take a minute to activate while we confirm with Stripe.";
  } else if (isDpoReturn && verifyState === "loading") {
    message = "Confirming your payment with DPO Pay…";
  } else if (isDpoReturn && verifyState === "done") {
    message = "Payment confirmed. Your Pro benefits should be active now.";
  } else if (isDpoReturn && verifyState === "error") {
    message =
      verifyError ||
      "We could not confirm payment yet. Pro may still activate shortly — try refreshing your profile.";
  } else if (isDpoReturn) {
    message = "Your payment was received. Pro may take a minute to activate.";
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
        <h1 className="font-display text-2xl font-bold text-emerald-950">Welcome to Thuto Pro</h1>
        <p className="mt-2 text-sm leading-relaxed text-emerald-900">{message}</p>
        <p className="mt-2 text-sm text-emerald-800">
          Refresh your profile if benefits do not appear right away.
        </p>
      </section>
      <div className="flex flex-wrap gap-2">
        <Link
          to="/app"
          className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
        >
          Back to home
        </Link>
        <Link
          to="/profile"
          className="rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
        >
          View profile
        </Link>
        <button
          type="button"
          onClick={() => refreshProfile().then((p) => p && syncFromCloud(p))}
          className="rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
        >
          Refresh status
        </button>
      </div>
    </div>
  );
}
