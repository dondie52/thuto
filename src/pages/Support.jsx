import { useState } from "react";
import { Link } from "react-router-dom";
import SupportHub from "../components/SupportHub.jsx";
import { useAuth } from "../lib/auth.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { usePageContent } from "../hooks/usePageContent.js";
import { PAGE_CONTENT_DEFAULTS } from "../lib/pageContentDefaults.js";
import { isSupabaseConfigured, submitSupportFeedback } from "../lib/supportFeedback.js";

export default function Support() {
  useDocumentTitle("Support and Feedback | Thuto");
  const { user } = useAuth();
  const { content } = usePageContent("support", PAGE_CONTENT_DEFAULTS.support);
  const topics = Array.isArray(content.form?.topics) ? content.form.topics : [];
  const [topic, setTopic] = useState("feedback");
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      <SupportHub />

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
        <form className="space-y-3" onSubmit={submitFeedback}>
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="focus-ring rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 disabled:opacity-60"
          >
            {isSubmitting ? "Sending..." : content.form?.buttonLabel}
          </button>
        </form>

        {status ? <p className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-900">{status}</p> : null}
        {error ? <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
      </section>

      <section className="rounded-2xl border border-brand-100 bg-brand-50/70 p-4">
        <p className="text-sm font-semibold text-brand-900">{content.account?.heading}</p>
        <p className="mt-1 text-sm text-slate-600">
          {user?.email ? `Signed in as ${user.email}.` : content.account?.signedOut}
        </p>
        {!user ? (
          <Link to="/auth?mode=login" className="mt-3 inline-flex text-sm font-semibold text-brand-800 underline">
            {content.account?.loginLabel}
          </Link>
        ) : null}
      </section>
    </div>
  );
}
