import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import {
  buildGeminiAssistantContext,
  buildLocalAssistantReply,
  getProviderStatus,
} from "../lib/assistantEngine.js";
import { readPredictorSession } from "../lib/admissions.js";
import { fetchProgrammes } from "../lib/programmesData.js";
import { getSupabase } from "../lib/supabase.js";
import { fetchUniversities } from "../lib/universitiesData.js";

const STARTER_QUESTIONS = [
  "I have 36 points. What is the best programme for me?",
  "Which programmes lead to software careers?",
  "When do applications close?",
  "Show programmes with modules listed",
];

const speechRecognition =
  typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

function createMessage(role, content, extras = {}) {
  return {
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    role,
    content,
    ...extras,
  };
}

function localReplyToMessage(reply, source = "local") {
  const itemLines = (reply.items || []).map((item) => {
    const link = item.href ? `\n${item.href}` : "";
    return `${item.heading}: ${item.body}${link}`;
  });
  return createMessage("assistant", [reply.answer, ...itemLines].filter(Boolean).join("\n\n"), {
    source,
    suggestions: reply.suggestions || [],
    references: (reply.items || [])
      .filter((item) => item.href)
      .map((item) => ({ title: item.heading, href: item.href, external: item.external })),
  });
}

function normalizeAssistantPayload(data) {
  const answer = String(data?.answer || data?.message || "").trim();
  return {
    answer: answer || "I could not generate a useful answer this time. Try asking again with a programme or university name.",
    confidence: data?.confidence || "medium",
    usedLocalContext: Boolean(data?.usedLocalContext),
    suggestions: Array.isArray(data?.suggestions) ? data.suggestions.filter(Boolean).slice(0, 4) : [],
    references: Array.isArray(data?.references) ? data.references.filter(Boolean).slice(0, 5) : [],
  };
}

function getSpeechSupportLabel() {
  if (!speechRecognition && typeof window !== "undefined" && !window.speechSynthesis) {
    return "Voice input and read aloud are not supported in this browser.";
  }
  if (!speechRecognition) return "Voice input is not supported in this browser.";
  if (typeof window !== "undefined" && !window.speechSynthesis) return "Read aloud is not supported in this browser.";
  return "";
}

export default function Assistant() {
  useDocumentTitle("Assistant | Thuto");
  const [question, setQuestion] = useState("");
  const [programmes, setProgrammes] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastQuestion, setLastQuestion] = useState("");
  const [messages, setMessages] = useState(() => [
    createMessage(
      "assistant",
      "Ask me about programmes, entry requirements, careers, modules, application dates, or what fits your saved grades.",
      {
        source: "local",
        suggestions: STARTER_QUESTIONS.slice(0, 3),
      },
    ),
  ]);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const providerStatus = getProviderStatus();
  const speechSupportLabel = getSpeechSupportLabel();

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  const predictorSnap = useMemo(() => readPredictorSession(), []);
  const canUseGemini = providerStatus.configured && Boolean(getSupabase());
  const canListen = Boolean(speechRecognition);
  const canSpeak = typeof window !== "undefined" && Boolean(window.speechSynthesis);

  async function askGemini(value) {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase is not configured");

    const history = messages
      .filter((message) => message.role === "user" || message.role === "assistant")
      .slice(-8)
      .map((message) => ({
        role: message.role,
        content: message.content,
      }));
    const localContext = buildGeminiAssistantContext({
      question: value,
      programmes,
      universities,
      predictorSnap,
    });

    const { data, error: functionError } = await supabase.functions.invoke("assistant", {
      body: { question: value, history, localContext },
    });
    if (functionError) throw functionError;
    if (data?.error) throw new Error(data.error);
    return normalizeAssistantPayload(data);
  }

  function buildFallbackMessage(value, source = "local") {
    return localReplyToMessage(
      buildLocalAssistantReply({
        question: value,
        programmes,
        universities,
        predictorSnap,
      }),
      source,
    );
  }

  async function sendQuestion(value) {
    const clean = String(value || "").trim();
    if (!clean || isSending) return;
    setQuestion("");
    setLastQuestion(clean);
    setError(null);
    setMessages((current) => [...current, createMessage("user", clean)]);
    setIsSending(true);

    try {
      if (!canUseGemini || !navigator.onLine) {
        setMessages((current) => [...current, buildFallbackMessage(clean)]);
        return;
      }

      const payload = await askGemini(clean);
      setMessages((current) => [
        ...current,
        createMessage("assistant", payload.answer, {
          source: "gemini",
          confidence: payload.confidence,
          usedLocalContext: payload.usedLocalContext,
          suggestions: payload.suggestions.length ? payload.suggestions : STARTER_QUESTIONS.slice(0, 3),
          references: payload.references,
        }),
      ]);
    } catch (e) {
      const fallback = buildFallbackMessage(clean, "fallback");
      setError(`Gemini could not answer just now, so I used Thuto's local data. ${e.message || ""}`.trim());
      setMessages((current) => [...current, fallback]);
    } finally {
      setIsSending(false);
    }
  }

  function submit(e) {
    e.preventDefault();
    sendQuestion(question);
  }

  function ask(text) {
    sendQuestion(text);
  }

  function retryLastQuestion() {
    if (lastQuestion) sendQuestion(lastQuestion);
  }

  function startListening() {
    if (!speechRecognition || isListening) return;
    const recognition = new speechRecognition();
    recognition.lang = "en-BW";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join(" ")
        .trim();
      if (transcript) setQuestion(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  }

  function readAloud(text) {
    if (!canSpeak || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/\s+/g, " ").slice(0, 1200));
    utterance.lang = "en-BW";
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-brand-600">Gemini-guided support</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-brand-900">Assistant</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
          Ask about programmes, universities, requirements, modules, careers, application dates, or what may fit your
          saved grades. Thuto sends compact local context to Gemini when AI is configured, then falls back locally when
          needed.
        </p>
      </header>

      <section className="rounded-2xl border border-brand-200 bg-white shadow-sm">
        <div className="border-b border-brand-100 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-brand-900">
                {canUseGemini ? "Gemini chat is active" : "Local fallback is active"}
              </p>
              <p className="mt-1 text-xs text-slate-500">{providerStatus.note}</p>
            </div>
            <Link
              to="/fit-finder"
              className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-50"
            >
              Fit Finder
            </Link>
          </div>
          {speechSupportLabel ? <p className="mt-2 text-xs text-slate-500">{speechSupportLabel}</p> : null}
        </div>

        <div className="max-h-[34rem] space-y-4 overflow-y-auto px-4 py-5" aria-live="polite">
          {messages.map((message) => (
            <article
              key={message.id}
              className={[
                "max-w-[48rem] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                message.role === "user"
                  ? "ml-auto bg-brand-700 text-white"
                  : "border border-brand-100 bg-brand-50/70 text-slate-800",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="whitespace-pre-line">{message.content}</p>
                {message.role === "assistant" ? (
                  <button
                    type="button"
                    onClick={() => readAloud(message.content)}
                    disabled={!canSpeak}
                    className="shrink-0 rounded-full border border-brand-200 bg-white px-2 py-1 text-xs font-semibold text-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
                    title={canSpeak ? "Read aloud" : "Read aloud is not supported"}
                  >
                    Speak
                  </button>
                ) : null}
              </div>

              {message.role === "assistant" && message.source ? (
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                  {message.source === "gemini"
                    ? `Gemini${message.usedLocalContext ? " with Thuto context" : ""}`
                    : message.source === "fallback"
                      ? "Local fallback"
                      : "Local assistant"}
                </p>
              ) : null}

              {message.references?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.references.map((reference, index) =>
                    reference.href ? (
                      reference.external ? (
                        <a
                          key={`${reference.href}-${index}`}
                          href={reference.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-800 underline"
                        >
                          {reference.title || "Open source"}
                        </a>
                      ) : (
                        <Link
                          key={`${reference.href}-${index}`}
                          to={reference.href}
                          className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-800 underline"
                        >
                          {reference.title || "Open in Thuto"}
                        </Link>
                      )
                    ) : null,
                  )}
                </div>
              ) : null}

              {message.suggestions?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => ask(suggestion)}
                      className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-800 hover:bg-brand-100"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
          {isSending ? (
            <div className="max-w-[24rem] rounded-2xl border border-brand-100 bg-brand-50/70 px-4 py-3 text-sm text-slate-600">
              Thinking with Thuto context...
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>

        {error ? (
          <div className="mx-4 mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {error}
            {lastQuestion ? (
              <button type="button" onClick={retryLastQuestion} className="ml-2 font-semibold underline">
                Retry Gemini
              </button>
            ) : null}
          </div>
        ) : null}

        <form onSubmit={submit} className="border-t border-brand-100 p-4">
          <label htmlFor="assistant-question" className="block text-xs font-medium text-slate-600">
            Your question
          </label>
          <div className="mt-2 grid gap-2 md:grid-cols-[1fr_auto]">
            <textarea
              id="assistant-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              placeholder="e.g. I passed 36 points. Which programme is best for me?"
              className="min-h-24 w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <div className="flex gap-2 md:flex-col">
              <button
                type="button"
                onClick={startListening}
                disabled={!canListen || isListening}
                className="rounded-lg border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-800 shadow-sm hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
                title={canListen ? "Speak your question" : "Voice input is not supported"}
              >
                {isListening ? "Listening" : "Mic"}
              </button>
              <button
                type="submit"
                disabled={isSending || !question.trim()}
                className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Ask
              </button>
            </div>
          </div>
        </form>
      </section>

      <p className="text-xs leading-relaxed text-slate-500">
        Thuto avoids guessing. Gemini is asked to use local programme and university context first, and to say when
        official requirements or dates are missing.
      </p>
    </div>
  );
}
