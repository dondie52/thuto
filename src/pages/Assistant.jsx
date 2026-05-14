import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { buildLocalAssistantReply, getProviderStatus } from "../lib/assistantEngine.js";
import { readPredictorSession } from "../lib/admissions.js";
import { fetchProgrammes } from "../lib/programmesData.js";
import { fetchUniversities } from "../lib/universitiesData.js";

const STARTER_QUESTIONS = [
  "What can I study with my grades?",
  "Which programmes lead to software careers?",
  "When do applications close?",
  "Show programmes with modules listed",
];

export default function Assistant() {
  useDocumentTitle("Assistant | Thuto");
  const [mode, setMode] = useState("local");
  const [question, setQuestion] = useState("");
  const [programmes, setProgrammes] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [error, setError] = useState(null);
  const providerStatus = getProviderStatus();

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    Promise.all([fetchProgrammes({ signal: ac.signal }), fetchUniversities({ signal: ac.signal })])
      .then(([programmeRows, universityResult]) => {
        if (cancelled) return;
        setProgrammes(programmeRows);
        setUniversities(universityResult.list);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? "Could not load local data");
      });
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, []);

  const predictorSnap = useMemo(() => readPredictorSession(), []);
  const reply = useMemo(() => {
    if (mode === "ai") {
      return {
        title: providerStatus.label,
        answer:
          "Thuto does not call paid AI providers from the browser. Add a server-side provider later, keep keys on the server, and local mode will remain the fallback.",
        items: [],
        suggestions: ["Use local mode", "Open Fit Finder", "Check README AI setup"],
      };
    }
    return buildLocalAssistantReply({
      question,
      programmes,
      universities,
      predictorSnap,
    });
  }, [mode, providerStatus.label, question, programmes, universities, predictorSnap]);

  function submit(e) {
    e.preventDefault();
    const value = question.trim();
    if (!value) return;
    setQuestion(value);
  }

  function ask(text) {
    setMode("local");
    setQuestion(text);
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-brand-600">Offline-first guidance</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-brand-900">Assistant</h1>
        <p className="mt-2 text-sm text-slate-600">
          Ask about programmes, universities, requirements, modules, careers, application dates, or what may fit your
          saved grades. Local mode uses only Thuto&apos;s bundled data.
        </p>
      </header>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Assistant mode">
          <button
            type="button"
            onClick={() => setMode("local")}
            className={[
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              mode === "local" ? "bg-brand-700 text-white" : "bg-brand-50 text-brand-800 hover:bg-brand-100",
            ].join(" ")}
          >
            Local mode
          </button>
          <button
            type="button"
            onClick={() => setMode("ai")}
            className={[
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              mode === "ai" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
            ].join(" ")}
          >
            AI mode
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {mode === "local" ? "No API key needed. Works from cached local data." : providerStatus.note}
        </p>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <label htmlFor="assistant-question" className="block text-xs font-medium text-slate-600">
            Your question
          </label>
          <textarea
            id="assistant-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            placeholder="e.g. What can I study with my grades? Which programmes have accounting careers?"
            className="w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-800"
            >
              Ask
            </button>
            <Link
              to="/fit-finder"
              className="rounded-lg border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 hover:bg-brand-50"
            >
              Fit Finder
            </Link>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm" aria-live="polite">
        <h2 className="font-display text-lg font-semibold text-brand-900">{reply.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">{reply.answer}</p>

        {reply.items?.length ? (
          <ul className="mt-4 divide-y divide-brand-100 rounded-xl border border-brand-100">
            {reply.items.map((item, index) => (
              <li key={`${item.heading}-${index}`} className="px-3 py-3">
                <p className="text-sm font-semibold text-brand-900">{item.heading}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.body}</p>
                {item.href ? (
                  item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex text-xs font-semibold text-brand-700 underline"
                    >
                      Open official link
                    </a>
                  ) : (
                    <Link to={item.href} className="mt-2 inline-flex text-xs font-semibold text-brand-700 underline">
                      Open in Thuto
                    </Link>
                  )
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {reply.suggestions?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {reply.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => ask(suggestion)}
                className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800 hover:bg-brand-100"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <p className="text-xs leading-relaxed text-slate-500">
        Thuto avoids guessing. If a requirement, career, module, or application date is missing from the local JSON, the
        assistant will say it is missing and point you to the institution.
      </p>
    </div>
  );
}

