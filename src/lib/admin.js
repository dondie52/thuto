import { fetchAdminFeedItems, isCurrentUserFeedAdmin } from "./feed.js";
import { fetchProgrammes } from "./programmesData.js";
import { getSupabase, isSupabaseConfigured } from "./supabase.js";
import { fetchUniversities } from "./universitiesData.js";

export { isCurrentUserFeedAdmin, isSupabaseConfigured };

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item) || "Unknown";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

async function summarizeLocalData() {
  const [programmes, universitiesResult] = await Promise.all([
    fetchProgrammes(),
    fetchUniversities(),
  ]);
  const universities = universitiesResult.list;
  const universityIds = new Set(universities.map((university) => university.id));
  const programmesMissingMinPoints = programmes.filter((programme) => !Number.isFinite(programme.minPoints)).length;
  const programmesMissingOfficialUrl = programmes.filter((programme) => !programme.officialUrl).length;
  const universitiesWithResources = universities.filter((university) => Array.isArray(university.resources) && university.resources.length).length;
  const universitiesWithOpenDates = universities.filter((university) => university.applicationOpen || university.applicationClose).length;

  return {
    programmesTotal: programmes.length,
    universitiesTotal: universities.length,
    universityIdsTotal: universityIds.size,
    fields: countBy(programmes, (programme) => programme.field),
    programmesMissingMinPoints,
    programmesMissingOfficialUrl,
    universitiesWithResources,
    universitiesWithOpenDates,
  };
}

async function countRows(table, filter) {
  const supabase = getSupabase();
  if (!supabase) return { count: 0, error: null };
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  if (typeof filter === "function") query = filter(query);
  const { count, error } = await query;
  return { count: count || 0, error };
}

async function fetchOpportunitySummary() {
  const supabase = getSupabase();
  if (!supabase) return { rows: [], error: null };
  const { data, error } = await supabase
    .from("opportunity_posts")
    .select("id, category, sponsor, title, body, image_url, source_url, published, published_at, expires_at, sort_order")
    .order("updated_at", { ascending: false })
    .limit(12);

  return { rows: data || [], error };
}

async function fetchProfileSummary() {
  const supabase = getSupabase();
  if (!supabase) return { rows: [], error: null };
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, university_name, premium_status, premium_plan, premium_until, updated_at")
    .order("updated_at", { ascending: false })
    .limit(10);

  return { rows: data || [], error };
}

export async function fetchAdminOverview() {
  const localData = await summarizeLocalData();
  if (!isSupabaseConfigured()) {
    return {
      localData,
      feed: { posts: [], comments: [], reports: [] },
      counts: {},
      opportunities: [],
      warnings: ["Supabase is not configured, so live admin controls are offline."],
    };
  }

  const warnings = [];
  const [feedResult, profilesResult, premiumResult, opportunityCountResult, opportunitiesResult, profileRowsResult] = await Promise.allSettled([
    fetchAdminFeedItems({ limit: 80 }),
    countRows("profiles"),
    countRows("profiles", (query) => query.eq("premium_status", "active")),
    countRows("opportunity_posts"),
    fetchOpportunitySummary(),
    fetchProfileSummary(),
  ]);

  const feed =
    feedResult.status === "fulfilled"
      ? feedResult.value
      : { posts: [], comments: [], reports: [] };
  if (feedResult.status === "rejected") warnings.push(feedResult.reason?.message || "Could not load feed queues.");

  const profileCount = profilesResult.status === "fulfilled" ? profilesResult.value : { count: 0, error: null };
  const premium = premiumResult.status === "fulfilled" ? premiumResult.value : { count: 0, error: null };
  const opportunityCount =
    opportunityCountResult.status === "fulfilled" ? opportunityCountResult.value : { count: 0, error: null };
  const opportunities =
    opportunitiesResult.status === "fulfilled" ? opportunitiesResult.value.rows : [];
  const profileRows =
    profileRowsResult.status === "fulfilled" ? profileRowsResult.value.rows : [];

  for (const result of [profileCount, premium, opportunityCount]) {
    if (result.error) warnings.push(result.error.message);
  }
  if (opportunitiesResult.status === "fulfilled" && opportunitiesResult.value.error) {
    warnings.push(opportunitiesResult.value.error.message);
  }
  if (profileRowsResult.status === "fulfilled" && profileRowsResult.value.error) {
    warnings.push(profileRowsResult.value.error.message);
  }

  const pendingPosts = feed.posts.filter((post) => post.status === "pending_review").length;
  const pendingComments = feed.comments.filter((comment) => comment.status === "pending_review").length;
  const reportedPosts = feed.posts.filter((post) => post.reportCount > 0).length;
  const reportedComments = feed.comments.filter((comment) => Number(comment.report_count || 0) > 0).length;

  return {
    localData,
    feed,
    counts: {
      profiles: profileCount.count,
      premiumProfiles: premium.count,
      opportunities: opportunityCount.count,
      pendingFeed: pendingPosts + pendingComments,
      reports: feed.reports.length,
      reportedItems: reportedPosts + reportedComments,
    },
    opportunities,
    profiles: profileRows,
    warnings,
  };
}

export async function saveOpportunityPost(post) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const payload = {
    category: post.category,
    sponsor: post.sponsor || "",
    title: post.title,
    body: post.body,
    image_url: post.imageUrl || null,
    source_url: post.sourceUrl || null,
    published: Boolean(post.published),
    published_at: post.published ? post.publishedAt || new Date().toISOString() : post.publishedAt || null,
    expires_at: post.expiresAt || null,
    sort_order: Number(post.sortOrder || 0),
  };

  const query = post.id
    ? supabase.from("opportunity_posts").update(payload).eq("id", post.id).select("id").single()
    : supabase.from("opportunity_posts").insert(payload).select("id").single();
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function setOpportunityPublished(id, published) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase
    .from("opportunity_posts")
    .update({
      published,
      published_at: published ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteOpportunityPost(id) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.from("opportunity_posts").delete().eq("id", id);
  if (error) throw error;
}

export async function updateProfilePremium({ id, premiumStatus, premiumPlan, premiumUntil }) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase
    .from("profiles")
    .update({
      premium_status: premiumStatus,
      premium_plan: premiumStatus === "active" ? premiumPlan || null : null,
      premium_until: premiumStatus === "active" ? premiumUntil || null : null,
    })
    .eq("id", id);
  if (error) throw error;
}
