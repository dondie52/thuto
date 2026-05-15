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
import { safeExternalUrl, safeInternalPath } from "../lib/urlSafety.js";

const STARTER_QUESTIONS = [
  "I have 36 APS. What can I study?",
  "Which programmes lead to software careers?",
  "Compare Computer Science and IT",
  "What can I study with Maths Literacy?",
  "Which applications are still open?",
];

const speechRecognition =
  typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

function MicrophoneIcon({ active = false }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 14.5a3.5 3.5 0 003.5-3.5V6a3.5 3.5 0 00-7 0v5a3.5 3.5 0 003.5 3.5z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 10.5a7 7 0 0014 0M12 17.5V21M9 21h6" />
      {active ? <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 5.5 20 4M5.5 5.5 4 4" /> : null}
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 9v6h4l5 4V5L8 9H4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 9.5a4 4 0 010 5M19 7a8 8 0 010 10" />
    </svg>
  );
}

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

export default function Assistant() {
  useDocumentTitle("Ask Thuto | Thuto");
  const [question, setQuestion] = useState("");
  const [programmes, setProgrammes] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
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
  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.();
      audioRef.current?.pause?.();
      if (audioRef.current?.src?.startsWith("blob:")) URL.revokeObjectURL(audioRef.current.src);
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  const predictorSnap = useMemo(() => readPredictorSession(), []);
  const canUseGemini = providerStatus.configured && Boolean(getSupabase());
  const canListen = Boolean(speechRecognition);
  const canSpeak = Boolean(getSupabase()) || (typeof window !== "undefined" && Boolean(window.speechSynthesis));

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
      setError("Thuto could not complete the live answer just now, so it used available programme information.");
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

  function playBrowserSpeech(text) {
    if (typeof window === "undefined" || !window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/\s+/g, " ").slice(0, 1200));
    utterance.lang = "en-BW";
    window.speechSynthesis.speak(utterance);
  }

  async function readAloud(message) {
    const text = message?.content;
    if (!canSpeak || !text || speakingMessageId) return;

    const supabase = getSupabase();
    if (!supabase) {
      playBrowserSpeech(text);
      return;
    }

    setSpeakingMessageId(message.id);
    setError(null);
    try {
      audioRef.current?.pause?.();
      if (audioRef.current?.src?.startsWith("blob:")) URL.revokeObjectURL(audioRef.current.src);

      const { data, error: functionError } = await supabase.functions.invoke("assistant", {
        body: { action: "speak", text },
      });
      if (functionError) throw functionError;
      if (data?.error) throw new Error(data.error);
      if (!data?.audioContent) throw new Error("ElevenLabs returned no audio");

      const binary = atob(data.audioContent);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }

      const url = URL.createObjectURL(new Blob([bytes], { type: data.mimeType || "audio/mpeg" }));
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setSpeakingMessageId(null);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        setSpeakingMessageId(null);
        playBrowserSpeech(text);
      };
      await audio.play();
    } catch (e) {
      setError("ElevenLabs speech is unavailable just now, so Thuto used browser speech instead.");
      playBrowserSpeech(text);
      setSpeakingMessageId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-brand-600">Student guidance</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-brand-900">Ask Thuto</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
          Ask about programmes, entry requirements, careers, modules, application dates, or what fits your saved grades.
        </p>
      </header>

      <section className="rounded-2xl border border-brand-200 bg-white shadow-sm">
        <div className="border-b border-brand-100 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-brand-900">What can I help you with?</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Use this page to explore study options, understand requirements, compare programmes, and prepare for
                applications.
              </p>
            </div>
            <Link
              to="/fit-finder"
              className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-50"
            >
              Fit Finder
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {STARTER_QUESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => ask(suggestion)}
                className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800 hover:bg-brand-100"
              >
                {suggestion}
              </button>
            ))}
          </div>
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
                    onClick={() => readAloud(message)}
                    disabled={!canSpeak || Boolean(speakingMessageId)}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-800 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={speakingMessageId === message.id ? "Reading aloud" : "Read aloud"}
                    title={canSpeak ? "Read aloud with ElevenLabs" : "Read aloud unavailable"}
                  >
                    <VolumeIcon />
                  </button>
                ) : null}
              </div>

              {message.references?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.references.map((reference, index) => {
                    if (!reference.href) return null;
                    const safeHref = reference.external ? safeExternalUrl(reference.href) : safeInternalPath(reference.href);
                    if (!safeHref) return null;
                    return reference.external ? (
                      <a
                        key={`${reference.href}-${index}`}
                        href={safeHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-800 underline"
                      >
                        {reference.title || "Open source"}
                      </a>
                    ) : (
                      <Link
                        key={`${reference.href}-${index}`}
                        to={safeHref}
                        className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-800 underline"
                      >
                        {reference.title || "Open in Thuto"}
                      </Link>
                    );
                  })}
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
              Checking programme information...
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>

        {error ? (
          <div className="mx-4 mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {error}
            {lastQuestion ? (
              <button type="button" onClick={retryLastQuestion} className="ml-2 font-semibold underline">
                Try again
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
              placeholder="Example: I have 33 APS and enjoy maths and coding. Which programmes should I consider?"
              className="min-h-24 w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <div className="flex gap-2 md:flex-col">
              <button
                type="button"
                onClick={startListening}
                disabled={!canListen || isListening}
                className={[
                  "inline-flex h-11 min-w-11 items-center justify-center rounded-lg border border-brand-200 bg-white px-3 text-brand-800 shadow-sm transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50",
                  isListening ? "border-brand-500 bg-brand-50 text-brand-900" : "",
                ].join(" ")}
                aria-label={isListening ? "Listening" : "Speak your question"}
                title={canListen ? (isListening ? "Listening" : "Speak your question") : "Speech entry unavailable"}
              >
                <MicrophoneIcon active={isListening} />
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
        Thuto provides guidance based on available programme information. Always confirm final requirements and dates
        with the university.
      </p>
    </div>
  );
}
