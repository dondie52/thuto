import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { useEntitlements } from "../hooks/useEntitlements.js";
import { usePageContent } from "../hooks/usePageContent.js";
import { PAGE_CONTENT_DEFAULTS } from "../lib/pageContentDefaults.js";
import { isSupabaseConfigured, submitSupportFeedback } from "../lib/supportFeedback.js";
import UpgradePrompt from "../components/UpgradePrompt.jsx";

const FAQ_ITEMS = [
  {
    question: "How do I save programmes?",
    answer: "Tap the bookmark icon on any programme. Free accounts can save up to 2 programmes; Thuto Pro allows unlimited saves with cloud sync.",
  },
  {
    question: "What is the admission predictor?",
    answer: "Enter your BGCSE grades (or estimates) to see programmes you may qualify for. Acceptance chance labels are a Thuto Pro feature.",
  },
  {
    question: "How do I compare universities?",
    answer: "Use the Compare page to view programmes side by side. Free accounts can compare 2 programmes; Pro allows 3.",
  },
  {
    question: "Does Thuto process applications?",
    answer: "No. Thuto helps you explore and plan. You still apply directly through each institution's official website or admissions office.",
  },
  {
    question: "How do Pro payments work?",
    answer: "Thuto Pro is a one-time payment — P59 for one year or P199 for five years. There is no monthly subscription.",
  },
];

export default function Support() {
  useDocumentTitle("Support and Feedback | Thuto");
  const { user } = useAuth();
  const { entitlements } = useEntitlements();
  const { content } = usePageContent("support", PAGE_CONTENT_DEFAULTS.support);
  const topics = Array.isArray(content.form?.topics) ? content.form.topics : [];
  const [topic, setTopic] = useState("feedback");
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isProSupport = entitlements.supportTier === "priority";

  async function submitFeedback(event) {
    event.preventDefault();
    setError("");
    setStatus("");
    if (!isSupabaseConfigured()) {
      setStatus(content.form?.offlineStatus);
      setMessage("");
      return;
    }
    setIsSubmitting(true);
    try {
      await submitSupportFeedback({ topic, message, contactEmail, userId: user?.id });
      setStatus(content.form?.onlineStatus);
      setMessage("");
      setContactEmail("");
    } catch (err) {
      setError(err.message || "Could not send feedback.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">{content.hero?.kicker}</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-brand-900">{content.hero?.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{content.hero?.body}</p>
      </div>

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-brand-900">Frequently asked questions</h2>
        <ul className="mt-3 space-y-3">
          {FAQ_ITEMS.map((item) => (
            <li key={item.question} className="rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-3">
              <p className="text-sm font-semibold text-brand-900">{item.question}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.answer}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/feed"
            className="rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
          >
            Community feed
          </Link>
          <Link
            to="/upgrade"
            className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
          >
            View Thuto Pro
          </Link>
        </div>
      </section>

      {isProSupport ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-emerald-950">Pro support channels</h2>
          <p className="mt-2 text-sm text-emerald-900">
            Email <a className="font-semibold underline" href="mailto:support@thuto.app">support@thuto.app</a> — we aim to
            respond within 24 hours.
          </p>
          <p className="mt-2 text-sm text-emerald-900">
            WhatsApp team support:{" "}
            <a className="font-semibold underline" href="https://wa.me/26770000000" target="_blank" rel="noreferrer">
              Message on WhatsApp
            </a>
          </p>
        </section>
      ) : (
        <UpgradePrompt
          message="Free accounts use community support and FAQs. Thuto Pro adds email support (24hr response) and WhatsApp team help."
        />
      )}

      {isProSupport ? (
        <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-brand-900">Email the team</h2>
          <form className="mt-3 space-y-3" onSubmit={submitFeedback}>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">{content.form?.topicLabel}</span>
              <select
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                className="mt-1 w-full rounded-xl border border-brand-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {topics.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-600">{content.form?.messageLabel}</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                required
                rows={5}
                className="mt-1 w-full rounded-xl border border-brand-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
                placeholder={content.form?.messagePlaceholder}
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-600">{content.form?.contactLabel}</span>
              <input
                type="email"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                className="mt-1 w-full rounded-xl border border-brand-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
                placeholder={content.form?.contactPlaceholder}
              />
            </label>

            {error ? <p className="text-sm text-red-800">{error}</p> : null}
            {status ? <p className="text-sm text-emerald-800">{status}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
            >
              {isSubmitting ? "Sending..." : content.form?.buttonLabel}
            </button>
          </form>
        </section>
      ) : null}

      <section className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4 text-sm text-slate-600">
        <h2 className="font-semibold text-brand-900">{content.account?.heading}</h2>
        {user ? (
          <p className="mt-1">Signed in as {user.email}.</p>
        ) : (
          <p className="mt-1">
            {content.account?.signedOut}{" "}
            <Link to="/auth?mode=login&next=/support" className="font-semibold text-brand-700 underline">
              {content.account?.loginLabel}
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}
