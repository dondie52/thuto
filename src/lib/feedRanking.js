export const FEED_RELEVANCE_LABELS = {
  official: "Official Thuto update",
  national_notice: "Nationwide notice",
  following: "From someone you follow",
  mutual_follow: "From a mutual connection",
  your_institution: "Relevant to your institutions",
  interest_match: "Matches your interests",
  trending: "Popular this week",
  discovery: "Suggested for you",
  your_post: "Your post",
};

/**
 * @param {string | null | undefined} reason
 * @returns {string}
 */
export function feedRelevanceLabel(reason) {
  if (!reason) return "";
  return FEED_RELEVANCE_LABELS[reason] || "";
}
