import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import UserDisplayName from "../components/UserDisplayName.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { useAuth } from "../lib/auth.jsx";
import { fetchConversations, fetchMessages, markConversationRead, sendMessage } from "../lib/messaging.js";

function formatWhen(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function IconBack({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function IconSend({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

export default function FeedMessageThread() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const { reloadBadges } = useOutletContext() || {};
  const [messages, setMessages] = useState([]);
  const [peerName, setPeerName] = useState("Chat");
  const [peerIsPro, setPeerIsPro] = useState(false);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useDocumentTitle(`${peerName} | Chats | Thuto`);

  const loadThread = useCallback(async () => {
    if (!user || !conversationId) return;
    setIsLoading(true);
    setError("");
    try {
      const [threadMessages, conversations] = await Promise.all([
        fetchMessages(conversationId),
        fetchConversations(),
      ]);
      setMessages(threadMessages);
      const match = conversations.find((item) => item.id === conversationId);
      if (match) {
        setPeerName(match.otherName);
        setPeerIsPro(Boolean(match.otherIsPro));
      }
      await markConversationRead(conversationId);
      reloadBadges?.();
    } catch (err) {
      setError(err.message || "Could not load this conversation.");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, reloadBadges, user]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const { documentElement, body } = document;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    documentElement.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      documentElement.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!conversationId || !draft.trim()) return;
    setIsSending(true);
    setError("");
    try {
      const message = await sendMessage(conversationId, draft);
      setMessages((current) => [...current, message]);
      setDraft("");
      reloadBadges?.();
    } catch (err) {
      setError(err.message || "Could not send message.");
    } finally {
      setIsSending(false);
    }
  }

  if (!user) {
    return (
      <div className="px-4 pt-2">
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
          <Link to="/auth?mode=login" className="font-semibold underline">
            Sign in
          </Link>{" "}
          to view this conversation.
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 flex flex-col overflow-hidden bg-white touch-pan-y">
      <header className="flex shrink-0 items-center gap-2 border-b border-brand-100 bg-white px-3 pb-2.5 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        <Link
          to="/feed/messages"
          className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand-800 hover:bg-brand-50"
          aria-label="Back to chats"
        >
          <IconBack />
        </Link>
        <UserDisplayName
          name={peerName}
          isPro={peerIsPro}
          nameClassName="font-display truncate text-base font-semibold text-brand-900"
          className="min-w-0 flex-1"
        />
      </header>

      {error ? (
        <p className="mx-4 mt-2 shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {isLoading ? <p className="text-sm text-stone-500">Loading conversation...</p> : null}
        {!isLoading && !messages.length ? (
          <p className="text-center text-sm text-stone-500">Say hello to start the chat.</p>
        ) : null}
        {messages.map((message) => {
          const mine = message.senderId === user.id;
          return (
            <div key={message.id} className={mine ? "flex justify-end" : "flex justify-start"}>
              <div
                className={[
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                  mine ? "bg-brand-700 text-white" : "bg-stone-100 text-stone-800",
                ].join(" ")}
              >
                <p className="whitespace-pre-wrap">{message.body}</p>
                <p className={["mt-1 text-[10px]", mine ? "text-white/75" : "text-stone-500"].join(" ")}>
                  {formatWhen(message.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex shrink-0 items-end gap-2 border-t border-brand-100 bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
      >
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={2}
          placeholder="Write a message..."
          className="focus-ring min-h-11 flex-1 rounded-2xl border border-brand-100 bg-white px-3 py-2 text-base"
        />
        <button
          type="submit"
          disabled={isSending || !draft.trim()}
          className="focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white hover:bg-brand-800 disabled:opacity-60"
          aria-label="Send message"
        >
          <IconSend />
        </button>
      </form>
    </div>
  );
}
