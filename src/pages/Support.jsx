import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export default function Support() {
  useDocumentTitle("Support and Feedback | Thuto");
  const { user } = useAuth();
  const [topic, setTopic] = useState("feedback");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  function submitFeedback(event) {
    event.preventDefault();
    setStatus("Feedback saved locally for now. Send it to the Thuto team when support intake is connected.");
    setMessage("");
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Support</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-brand-900">Support and feedback</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Share what is confusing, missing, or useful as Thuto grows into a stronger university companion.
        </p>
      </div>

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
        <form className="space-y-3" onSubmit={submitFeedback}>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Topic</span>
            <select
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              className="mt-1 w-full rounded-xl border border-brand-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              <option value="feedback">General feedback</option>
              <option value="bug">Something is not working</option>
              <option value="data">Programme or deadline data</option>
              <option value="account">Account help</option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Message</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
              rows={5}
              className="mt-1 w-full rounded-xl border border-brand-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="Tell us what happened or what would help."
            />
          </label>

          <button
            type="submit"
            className="focus-ring rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
          >
            Save feedback
          </button>
        </form>

        {status ? <p className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-900">{status}</p> : null}
      </section>

      <section className="rounded-2xl border border-brand-100 bg-brand-50/70 p-4">
        <p className="text-sm font-semibold text-brand-900">Account context</p>
        <p className="mt-1 text-sm text-slate-600">
          {user?.email ? `Signed in as ${user.email}.` : "You are not signed in. Feedback is still welcome."}
        </p>
        {!user ? (
          <Link to="/auth?mode=login" className="mt-3 inline-flex text-sm font-semibold text-brand-800 underline">
            Log in
          </Link>
        ) : null}
      </section>
    </div>
  );
}
