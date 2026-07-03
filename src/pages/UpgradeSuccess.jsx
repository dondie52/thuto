import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { syncFromCloud } from "../lib/cloudSync.js";
import { verifyFlutterwavePayment } from "../lib/billing.js";

export default function UpgradeSuccess() {
  useDocumentTitle("Pro activated | Thuto");
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const provider = searchParams.get("provider");
  const txRef = searchParams.get("tx_ref");
  const transactionId = searchParams.get("transaction_id");
  const paymentStatus = searchParams.get("status");
  const { refreshProfile } = useAuth();
  const [verifyState, setVerifyState] = useState("idle");
  const [verifyError, setVerifyError] = useState("");

  useEffect(() => {
    refreshProfile().then((p) => {
      if (p) syncFromCloud(p);
    });
  }, [refreshProfile]);

  useEffect(() => {
    if (provider !== "flutterwave" || !txRef || !transactionId) return;

    let cancelled = false;
    setVerifyState("loading");
    setVerifyError("");

    verifyFlutterwavePayment({
      txRef,
      transactionId,
      status: paymentStatus,
    })
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
  }, [provider, txRef, transactionId, paymentStatus, refreshProfile]);

  const isFlutterwaveReturn = provider === "flutterwave" && txRef;
  const paymentCancelled = paymentStatus === "cancelled";

  let message = "Thank you. If you just completed checkout, Pro will activate shortly.";
  if (sessionId) {
    message = "Your payment was received. Pro may take a minute to activate while we confirm with Stripe.";
  } else if (paymentCancelled) {
    message = "Checkout was cancelled. You can try again anytime from the upgrade page.";
  } else if (isFlutterwaveReturn && verifyState === "loading") {
    message = "Confirming your payment with Flutterwave…";
  } else if (isFlutterwaveReturn && verifyState === "done") {
    message = "Payment confirmed. Your Pro benefits should be active now.";
  } else if (isFlutterwaveReturn && verifyState === "error") {
    message =
      verifyError ||
      "We could not confirm payment yet. Pro may still activate shortly — try refreshing your profile.";
  } else if (isFlutterwaveReturn) {
    message = "Your payment was received. Pro may take a minute to activate.";
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
        <h1 className="font-display text-2xl font-bold text-emerald-950">
          {paymentCancelled ? "Checkout cancelled" : "Welcome to Thuto Pro"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-emerald-900">{message}</p>
        {!paymentCancelled ? (
          <p className="mt-2 text-sm text-emerald-800">
            Refresh your profile if benefits do not appear right away.
          </p>
        ) : null}
      </section>
      <div className="flex flex-wrap gap-2">
        {paymentCancelled ? (
          <Link
            to="/upgrade"
            className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
          >
            Back to plans
          </Link>
        ) : (
          <Link
            to="/app"
            className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
          >
            Back to home
          </Link>
        )}
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
