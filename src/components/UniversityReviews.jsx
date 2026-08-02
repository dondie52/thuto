import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import {
  REVIEW_MAX_WORDS,
  REVIEW_STARS,
  clampToWordLimit,
  countWords,
  deleteOwnReview,
  fetchInstitutionReviews,
  saveOwnReview,
  summarizeReviews,
} from "../lib/institutionReviews.js";
import { isSupabaseConfigured } from "../lib/supabase.js";
import { useCollapsibleList } from "../hooks/useCollapsibleList.js";
import ShowMoreButton from "./ShowMoreButton.jsx";

const REVIEWS_PREVIEW = 4;

function Stars({ rating, className = "" }) {
  return (
    <span className={className} role="img" aria-label={`${rating} out of 5 stars`}>
      <span aria-hidden="true" className="text-amber-500">
        {"★".repeat(rating)}
        <span className="text-brand-100">{"★".repeat(5 - rating)}</span>
      </span>
    </span>
  );
}

function StarPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Your rating">
      {REVIEW_STARS.map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star === 1 ? "" : "s"}`}
          onClick={() => onChange(star)}
          className={`focus-ring rounded p-1 text-2xl leading-none transition ${
            star <= value ? "text-amber-500" : "text-brand-200 hover:text-amber-300"
          }`}
        >
          <span aria-hidden="true">★</span>
        </button>
      ))}
    </div>
  );
}

/**
 * @param {{ university: Record<string, unknown> }} props
 */
export default function UniversityReviews({ university }) {
  const { user } = useAuth();
  const institutionId = university?.id;
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const ownReview = user ? reviews.find((review) => review.user_id === user.id) : null;
  const others = reviews.filter((review) => review.id !== ownReview?.id);
  const summary = summarizeReviews(reviews);
  const list = useCollapsibleList(others, REVIEWS_PREVIEW, institutionId);
  const words = countWords(body);

  useEffect(() => {
    let cancelled = false;
    if (!institutionId) return undefined;
    setLoading(true);
    fetchInstitutionReviews(institutionId).then((rows) => {
      if (cancelled) return;
      setReviews(rows);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [institutionId]);

  // Load the reader's own review into the form so the same box edits it.
  useEffect(() => {
    if (!ownReview) return;
    setRating(ownReview.rating);
    setBody(ownReview.body || "");
  }, [ownReview?.id]);

  async function refresh() {
    setReviews(await fetchInstitutionReviews(institutionId));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setStatus("");
    setSaving(true);
    try {
      await saveOwnReview({ institutionId, rating, body });
      setStatus(ownReview ? "Your review was updated." : "Thanks — your review is live.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your review.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setError("");
    setStatus("");
    try {
      await deleteOwnReview(ownReview.id);
      setRating(0);
      setBody("");
      setStatus("Your review was removed.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove your review.");
    }
  }

  if (!isSupabaseConfigured()) return null;

  return (
    <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-brand-900">Student reviews</h2>
        {summary.count ? (
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <Stars rating={Math.round(summary.average)} />
            <span className="font-semibold text-brand-900">{summary.average}</span>
            <span>
              ({summary.count} review{summary.count === 1 ? "" : "s"})
            </span>
          </p>
        ) : null}
      </div>

      <p className="mt-1 text-sm text-slate-600">
        Reviews are written by students and are their own opinions, not Thuto&apos;s.
      </p>

      {user ? (
        <form onSubmit={submit} className="mt-4 rounded-xl border border-brand-100 bg-brand-50/40 p-4">
          <p className="text-sm font-semibold text-brand-900">
            {ownReview ? "Your review" : `Rate ${university?.name || "this institution"}`}
          </p>
          <div className="mt-2">
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <textarea
            value={body}
            onChange={(event) => setBody(clampToWordLimit(event.target.value))}
            rows={4}
            maxLength={900}
            placeholder="What was your experience? (optional)"
            className="mt-3 w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm"
          />
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            <p className={`text-xs ${words >= REVIEW_MAX_WORDS ? "text-amber-700" : "text-slate-500"}`}>
              {words}/{REVIEW_MAX_WORDS} words
            </p>
            <div className="flex flex-wrap gap-2">
              {ownReview ? (
                <button
                  type="button"
                  onClick={remove}
                  className="focus-ring rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:underline"
                >
                  Delete
                </button>
              ) : null}
              <button
                type="submit"
                disabled={saving || !rating}
                className="focus-ring rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving…" : ownReview ? "Update review" : "Post review"}
              </button>
            </div>
          </div>
          {error ? <p className="mt-2 text-sm text-red-800">{error}</p> : null}
          {status ? <p className="mt-2 text-sm text-emerald-800">{status}</p> : null}
        </form>
      ) : (
        <p className="mt-4 rounded-xl border border-brand-100 bg-brand-50/40 px-4 py-3 text-sm text-slate-600">
          <Link to="/auth?mode=login" className="font-semibold text-brand-700 hover:underline">
            Sign in
          </Link>{" "}
          to leave a review.
        </p>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Loading reviews…</p>
      ) : !others.length ? (
        <p className="mt-4 text-sm text-slate-500">
          {reviews.length ? "No other reviews yet." : "No reviews yet — be the first."}
        </p>
      ) : (
        <>
          <ul id={list.contentId} className="mt-4 grid gap-3">
            {list.visible.map((review) => (
              <li key={review.id} className="rounded-xl border border-brand-100 bg-brand-50/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Stars rating={review.rating} />
                  <p className="text-xs text-slate-500">{new Date(review.created_at).toLocaleDateString()}</p>
                </div>
                {review.body ? <p className="mt-2 text-sm leading-relaxed text-slate-700">{review.body}</p> : null}
                {review.reply ? (
                  <div className="mt-3 rounded-lg border-l-2 border-brand-300 bg-white px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                      Reply from {university?.shortName || university?.name || "the institution"}
                    </p>
                    <p className="mt-1 text-sm text-slate-700">{review.reply}</p>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
          {list.canCollapse ? (
            <ShowMoreButton
              expanded={list.expanded}
              onToggle={list.toggle}
              controls={list.contentId}
              total={list.total}
              noun="reviews"
            />
          ) : null}
        </>
      )}
    </section>
  );
}
