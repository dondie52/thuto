import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import UserDisplayName from "../components/UserDisplayName.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { useAuth } from "../lib/auth.jsx";
import {
  fetchAcceptedConnectionProfiles,
  fetchConnectionStatusMap,
  sendConnectionRequest,
} from "../lib/connections.js";
import { toggleFollowUser } from "../lib/feedFollows.js";
import { getOrCreateConversation } from "../lib/messaging.js";
import { profilePath } from "../lib/profileLinks.js";
import {
  fetchDiscoverProfiles,
  fetchFollowerProfiles,
  fetchFollowingProfiles,
  fetchFollowingSetForUsers,
} from "../lib/people.js";

const TABS = [
  { id: "discover", label: "Discover" },
  { id: "following", label: "Following" },
  { id: "followers", label: "Followers" },
  { id: "connections", label: "Connections" },
];

function profileInitial(name) {
  const letter = String(name || "S")
    .trim()
    .charAt(0)
    .toUpperCase();
  return letter || "S";
}

function connectLabel(status) {
  if (status === "accepted") return "Connected";
  if (status === "pending_outgoing") return "Requested";
  if (status === "pending_incoming") return "Respond";
  return "Connect";
}

function PersonRow({ person, isFollowing, connectionStatus, onFollow, onConnect, onMessage, showActions }) {
  const path = profilePath(person.username);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-white p-3 shadow-sm">
      {path ? (
        <Link to={path} className="focus-ring shrink-0 rounded-full">
          {person.avatarUrl ? (
            <img src={person.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
          ) : (
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
              {profileInitial(person.fullName)}
            </span>
          )}
        </Link>
      ) : person.avatarUrl ? (
        <img src={person.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
      ) : (
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
          {profileInitial(person.fullName)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        {path ? (
          <Link to={path} className="focus-ring block truncate font-semibold text-brand-900 hover:underline">
            <UserDisplayName name={person.fullName} isPro={person.isPro} className="max-w-full" />
          </Link>
        ) : (
          <p className="truncate font-semibold text-brand-900">
            <UserDisplayName name={person.fullName} isPro={person.isPro} className="max-w-full" />
          </p>
        )}
        <p className="truncate text-xs text-stone-500">
          {person.username ? `@${person.username}` : "Student"}
          {person.universityLine ? ` · ${person.universityLine}` : ""}
        </p>
        {person.bio ? <p className="mt-1 line-clamp-2 text-xs text-stone-600">{person.bio}</p> : null}
      </div>
      {showActions ? (
        <div className="flex shrink-0 flex-col gap-2">
          <button
            type="button"
            onClick={() => onFollow(person.id)}
            className={[
              "focus-ring rounded-full px-3 py-2 text-xs font-semibold",
              isFollowing ? "border border-brand-200 bg-white text-brand-800" : "bg-brand-700 text-white hover:bg-brand-800",
            ].join(" ")}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
          <button
            type="button"
            onClick={() => onConnect(person.id, connectionStatus)}
            disabled={connectionStatus === "pending_outgoing" || connectionStatus === "accepted"}
            className="focus-ring rounded-full border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-50 disabled:opacity-60"
          >
            {connectLabel(connectionStatus)}
          </button>
          <button
            type="button"
            onClick={() => onMessage(person)}
            className="focus-ring rounded-full border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-50"
          >
            Message
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function FeedPeople() {
  useDocumentTitle("People | Thuto");
  const navigate = useNavigate();
  const { user, supabaseConfigured } = useAuth();
  const [tab, setTab] = useState("discover");
  const [people, setPeople] = useState([]);
  const [followingIds, setFollowingIds] = useState(() => new Set());
  const [connectionStatusById, setConnectionStatusById] = useState(() => new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPeople = useCallback(async () => {
    if (!user) {
      setPeople([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      let rows = [];
      if (tab === "following") rows = await fetchFollowingProfiles();
      else if (tab === "followers") rows = await fetchFollowerProfiles();
      else if (tab === "connections") rows = await fetchAcceptedConnectionProfiles();
      else rows = await fetchDiscoverProfiles();
      setPeople(rows);
      const ids = rows.map((row) => row.id);
      const [following, connectionMap] = await Promise.all([
        fetchFollowingSetForUsers(ids),
        fetchConnectionStatusMap(ids),
      ]);
      setFollowingIds(following);
      setConnectionStatusById(connectionMap);
    } catch (err) {
      setError(err.message || "Could not load people.");
      setPeople([]);
    } finally {
      setIsLoading(false);
    }
  }, [tab, user]);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  async function handleFollow(personId) {
    try {
      const nowFollowing = await toggleFollowUser(personId);
      setFollowingIds((current) => {
        const next = new Set(current);
        if (nowFollowing) next.add(personId);
        else next.delete(personId);
        return next;
      });
    } catch (err) {
      setError(err.message || "Could not update follow.");
    }
  }

  async function handleConnect(personId, status) {
    if (status === "pending_incoming") {
      navigate("/feed/notifications");
      return;
    }
    if (status && status !== "none") return;
    try {
      await sendConnectionRequest(personId);
      setConnectionStatusById((current) => new Map(current).set(personId, "pending_outgoing"));
    } catch (err) {
      setError(err.message || "Could not send connection request.");
    }
  }

  async function handleMessage(person) {
    try {
      const conversationId = await getOrCreateConversation(person.id);
      navigate(`/feed/messages/${conversationId}`);
    } catch (err) {
      setError(err.message || "Could not open messages.");
    }
  }

  if (!supabaseConfigured) {
    return (
      <div className="px-4 pt-2">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        People need Supabase to be configured on this build.
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-3 px-4 pt-2">
        <h1 className="font-display text-xl font-semibold text-brand-900">People</h1>
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
          <Link to="/auth?mode=login&next=%2Ffeed%2Fpeople" className="font-semibold underline">
            Sign in
          </Link>{" "}
          to continue.
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-white px-4 pt-2">
      <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold text-brand-900">People</h1>

      <div className="flex gap-0.5 rounded-full border border-brand-100 bg-white p-0.5 shadow-sm">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={[
              "focus-ring min-w-0 flex-1 rounded-full px-1.5 py-1.5 text-[11px] font-semibold leading-tight transition sm:px-2 sm:text-xs",
              tab === item.id ? "bg-brand-700 text-white" : "text-brand-800 hover:bg-brand-50",
            ].join(" ")}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      {isLoading ? <p className="text-sm text-stone-500">Loading people...</p> : null}

      {!isLoading && !people.length ? (
        <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-6 text-center text-sm text-stone-600">
          {tab === "discover" ? "No new people to discover right now." : tab === "connections" ? "No connections yet." : `No ${tab} yet.`}
        </div>
      ) : null}

      <div className="space-y-2">
        {people.map((person) => (
          <PersonRow
            key={person.id}
            person={person}
            isFollowing={followingIds.has(person.id)}
            connectionStatus={connectionStatusById.get(person.id) || "none"}
            onFollow={handleFollow}
            onConnect={handleConnect}
            onMessage={handleMessage}
            showActions={user.id !== person.id}
          />
        ))}
      </div>
      </div>
    </div>
  );
}
