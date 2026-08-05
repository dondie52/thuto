import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { useAuth } from "../lib/auth.jsx";
import {
  buildGeminiAssistantContext,
  buildLocalAssistantReply,
  getProviderStatus,
} from "../lib/assistantEngine.js";
import { readPredictorSession } from "../lib/admissions.js";
import { fetchProgrammes } from "../lib/programmesData.js";
import { getSupabase } from "../lib/supabase.js";
import { fetchUniversities } from "../lib/universitiesData.js";
import { useEntitlements } from "../hooks/useEntitlements.js";
import { getAssistantUsageToday, recordAssistantUsage } from "../lib/premium.js";
import { safeExternalUrl, safeInternalPath } from "../lib/urlSafety.js";

const ASSISTANT_DISCLAIMER =
  "Thuto provides guidance based on available programme information. Always confirm final requirements and dates with the university.";

const EXAMPLE_QUESTION = "Which programmes lead to software careers?";

const STARTER_QUESTIONS = [
  "I have 36 APS. What can I study?",
  "Which programmes lead to software careers?",
  "Compare Computer Science and IT",
  "What can I study with Maths Literacy?",
  "Which applications are still open?",
  "Show entry requirements for engineering",
  "What careers fit a business degree?",
];

const speechRecognition =
  typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

function IconSend({ className = "h-[18px] w-[18px]" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function SparkleIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.2 4.2L17.5 7.5 13.2 8.7 12 13l-1.2-4.3L6.5 7.5l4.3-1.3L12 2z" />
      <path d="M19 11l.7 2.5L22 14.2l-2.3.7L19 17.2l-.7-2.3L16 14.2l2.3-.7L19 11z" opacity="0.85" />
    </svg>
  );
}

function ChatBubbleEmpty({ className = "h-20 w-20" }) {
  return (
    <svg className={className} viewBox="0 0 96 96" fill="none" aria-hidden>
      <ellipse cx="52" cy="72" rx="22" ry="6" fill="rgba(15, 118, 110, 0.12)" />
      <path
        d="M24 28c0-8.837 7.163-16 16-16h16c8.837 0 16 7.163 16 16v18c0 8.837-7.163 16-16 16H44l-12 10v-10c-4.418 0-8-3.582-8-8V28z"
        fill="#99f6e4"
        stroke="#5eead4"
        strokeWidth="2"
      />
      <circle cx="40" cy="40" r="3" fill="white" />
      <circle cx="56" cy="40" r="3" fill="white" />
    </svg>
  );
}

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

function ExampleQuestionChip({ onPick }) {
  return (
    <div className="shrink-0 px-4 pb-2 sm:px-5">
      <button
        type="button"
        onClick={() => onPick(EXAMPLE_QUESTION)}
        className="focus-ring rounded-full border border-brand-100 bg-white px-3.5 py-1.5 text-xs font-medium text-brand-800 shadow-sm transition hover:border-brand-200 hover:bg-brand-50"
      >
        {EXAMPLE_QUESTION}
      </button>
    </div>
  );
}

function AskInputRow({
  question,
  onQuestionChange,
  onKeyDown,
  onListen,
  isListening,
  isSending,
  canListen,
  inputRef,
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onListen}
        disabled={!canListen || isListening}
        className={[
          "focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center text-brand-600 transition disabled:cursor-not-allowed disabled:opacity-40",
          isListening ? "text-brand-800" : "",
        ].join(" ")}
        aria-label={isListening ? "Listening" : "Speak your question"}
        title={canListen ? (isListening ? "Listening" : "Speak your question") : "Speech entry unavailable"}
      >
        <MicrophoneIcon active={isListening} />
      </button>
      <textarea
        ref={inputRef}
        id="assistant-question"
        value={question}
        onChange={onQuestionChange}
        onKeyDown={onKeyDown}
        rows={1}
        placeholder="Type your question…"
        className="focus-ring max-h-32 min-h-11 flex-1 resize-none rounded-full border border-brand-200 bg-white px-4 py-2.5 text-sm leading-relaxed shadow-sm focus:border-brand-500"
      />
      <button
        type="submit"
        disabled={isSending || !question.trim()}
        className="focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-700 p-0 text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="Send question"
      >
        <IconSend />
      </button>
    </div>
  );
}

function firstNameFromProfile(profile, user) {
  const raw = String(profile?.full_name || user?.user_metadata?.full_name || "").trim();
  if (!raw) return null;
  const first = raw.split(/\s+/)[0];
  return first || null;
}

function helpPromptName(profile, user) {
  const first = firstNameFromProfile(profile, user);
  return first ? `What can I help you with today, ${first}?` : "What can I help you with today?";
}

function AssistantDailyLimitBadge({ usage, isPremium }) {
  if (isPremium) {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full bg-brand-100 px-3 py-1.5 text-xs font-semibold text-brand-800">
        Unlimited AI
      </span>
    );
  }

  const remaining = Math.max(0, usage.limit - usage.count);
  const exhausted = remaining === 0;

  return (
    <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
      <span
        className={[
          "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm",
          exhausted
            ? "border border-amber-200 bg-amber-50 text-amber-900"
            : "border border-brand-200 bg-white text-brand-900",
        ].join(" ")}
        aria-live="polite"
      >
        {remaining} of {usage.limit} AI questions left
      </span>
      <span className="text-[10px] text-slate-500">
        Resets daily ·{" "}
        <Link to="/upgrade" className="font-semibold text-brand-700 underline">
          Pro
        </Link>{" "}
        is unlimited
      </span>
    </div>
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
  const { isPremium, profile, user } = useAuth();
  const { entitlements } = useEntitlements();
  const [question, setQuestion] = useState("");
  const [programmes, setProgrammes] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [lastQuestion, setLastQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [usageVersion, setUsageVersion] = useState(0);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesScrollRef = useRef(null);
  const inputRef = useRef(null);
  const providerStatus = getProviderStatus();
  const [searchParams] = useSearchParams();

  // Programme and institution pages link here with a prefilled question when the institution
  // does not take inquiries through Thuto. The student still presses send themselves.
  const prefillQuestion = searchParams.get("q");
  useEffect(() => {
    const prefill = String(prefillQuestion || "").trim().slice(0, 300);
    if (!prefill) return;
    setQuestion(prefill);
    inputRef.current?.focus();
  }, [prefillQuestion]);

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
    const scrollNode = messagesScrollRef.current;
    if (!scrollNode) return;
    scrollNode.scrollTop = scrollNode.scrollHeight;
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
  const helpHeading = useMemo(() => helpPromptName(profile, user), [profile, user]);
  const canUseGemini = providerStatus.configured && Boolean(getSupabase());
  const canListen = Boolean(speechRecognition);
  const canSpeak = Boolean(getSupabase()) || (typeof window !== "undefined" && Boolean(window.speechSynthesis));
  const hasConversation = messages.length > 0;
  const assistantUsage = useMemo(
    () => getAssistantUsageToday(isPremium),
    [isPremium, messages.length, isSending, usageVersion],
  );
  const showDailyLimit = !isPremium && Number.isFinite(entitlements.assistantDailyLimit);
  const questionsRemaining = Math.max(0, assistantUsage.limit - assistantUsage.count);

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

    if (canUseGemini && !recordAssistantUsage(isPremium)) {
      setError(`You have reached today's limit of ${getAssistantUsageToday(isPremium).limit} AI questions on the free plan. Upgrade to Pro for unlimited questions.`);
      return;
    }

    if (canUseGemini) {
      setUsageVersion((current) => current + 1);
    }

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

  function handleInputKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendQuestion(question);
    }
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="mb-2 flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-600">Student guidance</p>
          <h1 className="mt-0.5 font-display text-xl font-bold text-brand-900">Ask Thuto</h1>
        </div>
        <AssistantDailyLimitBadge usage={assistantUsage} isPremium={isPremium} />
      </header>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm">
        <div className="flex shrink-0 items-start justify-between gap-3 px-4 pt-3 sm:px-5">
          <p className="font-display text-sm font-semibold leading-snug text-brand-900">{helpHeading}</p>
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
            <SparkleIcon className="h-4 w-4" />
          </span>
        </div>

        {!hasConversation && !isSending ? <ExampleQuestionChip onPick={ask} /> : null}

        <div
          ref={messagesScrollRef}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 pb-2 sm:px-5"
          aria-live="polite"
        >
          {!hasConversation && !isSending ? (
            <div className="flex flex-1 flex-col items-center justify-center py-4 text-center">
              <ChatBubbleEmpty className="h-14 w-14 sm:h-16 sm:w-16" />
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-500">
                Ask anything about your academic journey.
              </p>
            </div>
          ) : (
            <div className="space-y-3 py-1">
              {messages.map((message) => (
                <div key={message.id} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <article
                    className={[
                      "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm sm:max-w-[75%]",
                      message.role === "user"
                        ? "bg-brand-700 text-white"
                        : "border border-brand-100 bg-brand-50/70 text-brand-950",
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
                            className="focus-ring rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-800 hover:bg-brand-100"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </article>
                </div>
              ))}

              {isSending ? (
                <div className="flex justify-start">
                  <div className="max-w-[75%] rounded-2xl border border-brand-100 bg-brand-50/70 px-4 py-3 text-sm text-brand-800">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-flex gap-1" aria-hidden>
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500 [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500 [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500 [animation-delay:300ms]" />
                      </span>
                      Checking programme information…
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {error ? (
          <div className="mx-4 shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 sm:mx-5">
            {error}
            {lastQuestion ? (
              <button type="button" onClick={retryLastQuestion} className="ml-2 font-semibold underline">
                Try again
              </button>
            ) : null}
          </div>
        ) : null}

        <form onSubmit={submit} className="shrink-0 border-t border-brand-100 px-4 py-3 sm:px-5">
          {showDailyLimit ? (
            <p
              className={[
                "mb-2 text-center text-[11px] font-medium",
                questionsRemaining === 0 ? "text-amber-800" : "text-brand-800",
              ].join(" ")}
              aria-live="polite"
            >
              {questionsRemaining === 0
                ? "Daily AI limit reached. Upgrade to Pro for unlimited questions."
                : `${questionsRemaining} AI question${questionsRemaining === 1 ? "" : "s"} remaining today (${assistantUsage.count}/${assistantUsage.limit} used)`}
            </p>
          ) : null}
          <AskInputRow
            question={question}
            onQuestionChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleInputKeyDown}
            onListen={startListening}
            isListening={isListening}
            isSending={isSending}
            canListen={canListen}
            inputRef={inputRef}
          />
        </form>
      </section>

      <p className="mt-2 shrink-0 text-[11px] leading-snug text-slate-500">{ASSISTANT_DISCLAIMER}</p>
    </div>
  );
}
