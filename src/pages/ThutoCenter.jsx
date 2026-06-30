import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import CenterDocumentCard from "../components/CenterDocumentCard.jsx";
import UpgradePrompt from "../components/UpgradePrompt.jsx";
import { useAuth } from "../lib/auth.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { useEntitlements } from "../hooks/useEntitlements.js";
import { fetchUniversities } from "../lib/universitiesData.js";
import {
  CENTER_DOCUMENT_TYPES,
  CENTER_FACULTIES,
  CENTER_UPLOAD_REWARD_CREDITS,
  CENTER_UNLOCK_COST_CREDITS,
  fetchCenterCredits,
  fetchCenterDocuments,
  fetchMyCenterDocuments,
  fetchUnlockedDocumentIds,
  isSupabaseConfigured,
} from "../lib/thutoCenter.js";

function useDebouncedValue(value, delayMs = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export default function ThutoCenter() {
  useDocumentTitle("Thuto Center | Thuto");
  const { user, profile, supabaseConfigured, isLoading: isAuthLoading, isProfileLoading } = useAuth();
  const { isPremium } = useEntitlements();
  const configured = supabaseConfigured && isSupabaseConfigured();
  const prefilledUniversity = useRef(false);

  const [universities, setUniversities] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [myUploads, setMyUploads] = useState([]);
  const [unlockedIds, setUnlockedIds] = useState(() => new Set());
  const [credits, setCredits] = useState({ balance: 0, lifetimeEarned: 0, lifetimeSpent: 0 });
  const [filters, setFilters] = useState({
    universityId: "",
    faculty: "",
    courseCode: "",
    documentType: "",
    search: "",
  });
  const debouncedSearch = useDebouncedValue(filters.search);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const hasLoadedOnce = useRef(false);

  const queryFilters = useMemo(
    () => ({
      universityId: filters.universityId,
      faculty: filters.faculty,
      courseCode: filters.courseCode,
      documentType: filters.documentType,
      search: debouncedSearch,
    }),
    [filters.universityId, filters.faculty, filters.courseCode, filters.documentType, debouncedSearch],
  );

  const queryKey = useMemo(() => JSON.stringify(queryFilters), [queryFilters]);

  useEffect(() => {
    fetchUniversities()
      .then(({ list }) => setUniversities(list))
      .catch(() => setUniversities([]));
  }, []);

  useEffect(() => {
    if (!profile?.university_id || prefilledUniversity.current) return;
    prefilledUniversity.current = true;
    setFilters((prev) => ({ ...prev, universityId: profile.university_id }));
  }, [profile?.university_id]);

  const readyToLoad = configured && !isAuthLoading && (!user?.id || !isProfileLoading);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!readyToLoad) {
        if (!configured) setInitialLoading(false);
        return;
      }

      if (hasLoadedOnce.current) {
        setIsRefreshing(true);
      } else {
        setInitialLoading(true);
      }
      setError("");

      try {
        const [docs, mine, unlocks, creditRow] = await Promise.all([
          fetchCenterDocuments(queryFilters),
          user?.id ? fetchMyCenterDocuments() : Promise.resolve([]),
          user?.id ? fetchUnlockedDocumentIds() : Promise.resolve(new Set()),
          user?.id ? fetchCenterCredits() : Promise.resolve({ balance: 0, lifetimeEarned: 0, lifetimeSpent: 0 }),
        ]);
        if (!cancelled) {
          setDocuments(docs);
          setMyUploads(mine);
          setUnlockedIds(unlocks);
          setCredits(creditRow);
          hasLoadedOnce.current = true;
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load Thuto Center.");
      } finally {
        if (!cancelled) {
          setInitialLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [readyToLoad, configured, user?.id, queryKey]);

  const pendingCount = useMemo(
    () => myUploads.filter((doc) => doc.status === "pending_review").length,
    [myUploads],
  );

  return (
    <div className="space-y-6">
      <header className="overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-800 to-[#1a4d48] p-5 text-white shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-200">Campus library</p>
        <h1 className="mt-1 font-display text-2xl font-bold">Thuto Center</h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-100">
          Share your notes and past papers with other Botswana students. Upload free — download with unlock credits or
          Thuto Pro.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/center/upload"
            className="focus-ring inline-flex min-h-11 items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-brand-50"
          >
            Upload material
          </Link>
          <Link
            to="/center/policy"
            className="focus-ring inline-flex min-h-11 items-center rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            Botswana policy
          </Link>
        </div>
      </header>

      {!configured ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Thuto Center needs Supabase to be configured before uploads and downloads can go live.
        </p>
      ) : null}

      {user ? (
        <section className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Unlock credits</p>
            <p className="mt-1 text-2xl font-bold text-brand-900">{credits.balance}</p>
            <p className="text-xs text-stone-500">
              Earn {CENTER_UPLOAD_REWARD_CREDITS} per approved upload · {CENTER_UNLOCK_COST_CREDITS} per download
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Your uploads</p>
            <p className="mt-1 text-2xl font-bold text-brand-900">{myUploads.length}</p>
            {pendingCount > 0 ? <p className="text-xs text-amber-700">{pendingCount} pending review</p> : null}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Access</p>
            <p className="mt-1 text-sm font-semibold text-brand-900">
              {isPremium ? "Thuto Pro — instant downloads" : "Free — unlock with credits"}
            </p>
          </div>
        </section>
      ) : (
        <p className="rounded-2xl border border-brand-200 bg-brand-50/60 px-4 py-3 text-sm text-brand-900">
          <Link to="/auth?mode=login" className="font-semibold underline">
            Sign in
          </Link>{" "}
          to upload, earn unlock credits, and download study materials.
        </p>
      )}

      {!isPremium && user ? (
        <UpgradePrompt
          feature="centerInstantAccess"
          message="Upgrade to Thuto Pro for instant access to every Thuto Center document — no unlock credits needed."
        />
      ) : null}

      <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-brand-900">Find materials</h2>
          {isRefreshing ? <span className="text-xs text-stone-500">Updating…</span> : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-stone-700">University</span>
            <select
              value={filters.universityId}
              onChange={(event) => setFilters((prev) => ({ ...prev, universityId: event.target.value }))}
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
            >
              <option value="">All institutions</option>
              {universities.map((uni) => (
                <option key={uni.id} value={uni.id}>
                  {uni.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-stone-700">Faculty</span>
            <select
              value={filters.faculty}
              onChange={(event) => setFilters((prev) => ({ ...prev, faculty: event.target.value }))}
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
            >
              <option value="">All faculties</option>
              {CENTER_FACULTIES.map((faculty) => (
                <option key={faculty} value={faculty}>
                  {faculty}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-stone-700">Course code</span>
            <input
              type="text"
              value={filters.courseCode}
              onChange={(event) => setFilters((prev) => ({ ...prev, courseCode: event.target.value }))}
              placeholder="e.g. MAT111"
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-stone-700">Type</span>
            <select
              value={filters.documentType}
              onChange={(event) => setFilters((prev) => ({ ...prev, documentType: event.target.value }))}
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
            >
              <option value="">All types</option>
              {CENTER_DOCUMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-stone-700">Search</span>
            <input
              type="search"
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              placeholder="Title, description, or course code"
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
            />
          </label>
        </div>
      </section>

      {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}

      {initialLoading ? (
        <p className="text-sm text-stone-500" role="status">
          Loading campus materials…
        </p>
      ) : documents.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center">
          <h2 className="font-display text-lg font-semibold text-brand-900">No materials yet</h2>
          <p className="mt-2 text-sm text-stone-600">
            Be the first to upload notes or officially released past papers for your course.
          </p>
          <Link
            to="/center/upload"
            className="focus-ring mt-4 inline-flex min-h-11 items-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Upload the first document
          </Link>
        </section>
      ) : (
        <section className="grid gap-4">
          {documents.map((document) => (
            <CenterDocumentCard
              key={document.id}
              document={document}
              unlocked={unlockedIds.has(document.id) || document.uploaderId === user?.id}
              isPro={isPremium}
            />
          ))}
        </section>
      )}

      {myUploads.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-brand-900">Your uploads</h2>
          <div className="grid gap-3">
            {myUploads.map((document) => (
              <div key={document.id} className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link to={`/center/${document.id}`} className="font-semibold text-brand-800 hover:underline">
                    {document.title}
                  </Link>
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700">
                    {document.status.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-1 text-stone-600">
                  {document.courseCode} · {document.faculty}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
