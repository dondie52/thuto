import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSupabase } from "../../lib/supabase.js";
import { documentTypeLabel, fetchTopCenterSpotlights } from "../../lib/thutoCenter.js";

function profileInitial(name) {
  const letter = String(name || "S")
    .trim()
    .charAt(0)
    .toUpperCase();
  return letter || "S";
}

const RANK_LABELS = ["Gold", "Silver", "Bronze"];

/**
 * @param {number} index
 */
function rankBadgeClass(index) {
  if (index === 0) return "bg-amber-100 text-amber-950 ring-amber-200";
  if (index === 1) return "bg-stone-200 text-stone-800 ring-stone-300";
  if (index === 2) return "bg-orange-100 text-orange-950 ring-orange-200";
  return "bg-brand-100 text-brand-800 ring-brand-200";
}

/**
 * @param {{ heading?: string, body?: string, kicker?: string, emptyTitle?: string, emptyBody?: string }} props
 */
export default function HomeCenterCreators({
  kicker = "Winners",
  heading = "Best Thuto Centre creators",
  body = "Top study materials from students helping their campus.",
  emptyTitle = "Creators coming soon",
  emptyBody = "Upload notes or past papers to Thuto Centre to be featured here.",
}) {
  const [spotlights, setSpotlights] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const documents = await fetchTopCenterSpotlights(3);
      if (cancelled || !documents.length) {
        if (!cancelled) {
          setSpotlights([]);
          setReady(true);
        }
        return;
      }

      const supabase = getSupabase();
      const profileById = new Map();
      if (supabase) {
        const uploaderIds = [...new Set(documents.map((doc) => doc.uploaderId).filter(Boolean))];
        if (uploaderIds.length) {
          const { data } = await supabase
            .from("profiles")
            .select("id, full_name, username, avatar_url, university_name")
            .in("id", uploaderIds);
          for (const row of data || []) {
            profileById.set(row.id, row);
          }
        }
      }

      if (!cancelled) {
        setSpotlights(
          documents.map((document) => ({
            document,
            profile: profileById.get(document.uploaderId) || null,
          })),
        );
        setReady(true);
      }
    }

    load().catch(() => {
      if (!cancelled) {
        setSpotlights([]);
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-4" aria-labelledby="home-center-creators-heading">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">{kicker}</p>
        <h2 id="home-center-creators-heading" className="font-display text-2xl font-bold text-brand-900">
          {heading}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-stone-600">{body}</p>
      </div>

      {!ready ? (
        <ul className="space-y-3" aria-busy="true">
          {[0, 1].map((index) => (
            <li key={index} className="h-28 animate-pulse rounded-2xl border border-stone-200 bg-stone-100/80" />
          ))}
        </ul>
      ) : spotlights.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 px-4 py-6 text-center">
          <p className="font-display text-lg font-semibold text-brand-900">{emptyTitle}</p>
          <p className="mt-2 text-sm text-stone-600">{emptyBody}</p>
          <Link
            to="/center/upload"
            className="focus-ring mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Upload to Thuto Centre
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {spotlights.map(({ document, profile }, index) => {
            const displayName = profile?.full_name || profile?.username || "Thuto student";
            const rankLabel = RANK_LABELS[index] || `#${index + 1}`;
            const isTop = index === 0;
            return (
              <li key={document.id} className="animate-fade-up" style={{ animationDelay: `${index * 40}ms` }}>
                <Link
                  to={`/center/${document.id}`}
                  className={[
                    "focus-ring group flex gap-3 rounded-2xl border p-4 shadow-card transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover",
                    isTop
                      ? "border-amber-300/90 bg-gradient-to-br from-white to-amber-50/50"
                      : "border-stone-200/90 bg-white",
                  ].join(" ")}
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt=""
                      className={[
                        "shrink-0 rounded-full object-cover ring-2",
                        isTop ? "h-14 w-14 ring-amber-200" : "h-12 w-12 ring-brand-100",
                      ].join(" ")}
                    />
                  ) : (
                    <div
                      className={[
                        "flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2",
                        isTop ? "h-14 w-14 bg-amber-600 text-base ring-amber-200" : "h-12 w-12 bg-brand-700 text-sm ring-brand-100",
                      ].join(" ")}
                    >
                      {profileInitial(displayName)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                        rankBadgeClass(index),
                      ].join(" ")}
                    >
                      {isTop ? "🏆 " : ""}
                      {rankLabel} · #{index + 1} creator
                    </span>
                    <h3 className="mt-1 font-display text-base font-semibold text-brand-900 group-hover:text-brand-700">
                      {displayName}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-stone-700">{document.title}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      {document.courseCode}
                      {document.universityName ? ` · ${document.universityName}` : ""}
                      {document.helpfulCount ? ` · ${document.helpfulCount} helpful` : ""}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-brand-700">
                      {documentTypeLabel(document.documentType)} · View material →
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        to="/center"
        className="focus-ring inline-flex text-sm font-semibold text-brand-800 underline decoration-brand-300 underline-offset-2 hover:text-brand-950"
      >
        Open Thuto Centre
      </Link>
    </section>
  );
}
