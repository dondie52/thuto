import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserDisplayName from "../components/UserDisplayName.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { useAuth } from "../lib/auth.jsx";
import { fetchConversations } from "../lib/messaging.js";

function profileInitial(name) {
  const letter = String(name || "S")
    .trim()
    .charAt(0)
    .toUpperCase();
  return letter || "S";
}

function formatWhen(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function FeedMessages() {
  useDocumentTitle("Chats | Thuto");
  const { user, supabaseConfigured } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      setConversations(await fetchConversations());
    } catch (err) {
      setError(err.message || "Could not load chats.");
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  if (!supabaseConfigured) {
    return (
      <div className="px-4 pt-2">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Chats need Supabase to be configured on this build.
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-3 px-4 pt-2">
        <h1 className="font-display text-xl font-semibold text-brand-900">Chats</h1>
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
          <Link to="/auth?mode=login&next=%2Ffeed%2Fmessages" className="font-semibold underline">
            Sign in
          </Link>{" "}
          to continue.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 pt-2">
      <h1 className="font-display text-xl font-semibold text-brand-900">Chats</h1>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      {isLoading ? <p className="text-sm text-stone-500">Loading chats...</p> : null}

      {!isLoading && !conversations.length ? (
        <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-6 text-center text-sm text-stone-600">
          No chats yet. Find someone in{" "}
          <Link to="/feed/people" className="font-semibold text-brand-800 underline">
            People
          </Link>{" "}
          or{" "}
          <Link to="/feed/search" className="font-semibold text-brand-800 underline">
            Search
          </Link>{" "}
          to start a chat.
        </div>
      ) : null}

      <div className="space-y-2">
        {conversations.map((conversation) => (
          <Link
            key={conversation.id}
            to={`/feed/messages/${conversation.id}`}
            className="focus-ring flex items-center gap-3 rounded-2xl border border-brand-100 bg-white p-3 shadow-sm hover:bg-brand-50/40"
          >
            {conversation.otherAvatarUrl ? (
              <img src={conversation.otherAvatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
            ) : (
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
                {profileInitial(conversation.otherName)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <UserDisplayName
                  name={conversation.otherName}
                  isPro={conversation.otherIsPro}
                  nameClassName="font-semibold text-brand-900"
                  className="min-w-0 flex-1"
                />
                <span className="shrink-0 text-xs text-stone-500">{formatWhen(conversation.lastMessageAt)}</span>
              </div>
              <p className="truncate text-sm text-stone-600">{conversation.lastMessage || "Start the conversation"}</p>
            </div>
            {conversation.unreadCount > 0 ? (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
