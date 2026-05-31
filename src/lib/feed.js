import { getSupabase, isSupabaseConfigured } from "./supabase.js";

export { isSupabaseConfigured };

export const FEED_CATEGORIES = [
  { value: "graduate_programme", label: "Graduate programme" },
  { value: "opportunity", label: "Opportunity" },
  { value: "scholarship", label: "Scholarship" },
  { value: "internship", label: "Internship" },
  { value: "deadline", label: "Deadline" },
  { value: "study_tip", label: "Study tip" },
  { value: "event", label: "Event" },
  { value: "notice", label: "Notice" },
  { value: "question", label: "Question" },
  { value: "story", label: "Story" },
  { value: "campus_life", label: "Campus life" },
  { value: "general", label: "General" },
];

export const FEED_REACTIONS = [
  { value: "like", label: "Like", shortLabel: "Like" },
  { value: "celebrate", label: "Celebrate", shortLabel: "Bravo" },
  { value: "support", label: "Support", shortLabel: "Support" },
  { value: "insightful", label: "Insightful", shortLabel: "Insight" },
  { value: "curious", label: "Curious", shortLabel: "Curious" },
];

export const FEED_STATUS_LABELS = {
  pending_ai: "AI review",
  published: "Published",
  pending_review: "Needs admin",
  rejected: "Rejected",
  removed: "Removed",
};

export const FEED_REPORT_REASONS = [
  { value: "spam", label: "Spam or scam" },
  { value: "unsafe", label: "Unsafe content" },
  { value: "harassment", label: "Harassment" },
  { value: "misleading", label: "Misleading notice" },
  { value: "irrelevant", label: "Not useful here" },
  { value: "other", label: "Other" },
];

const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function assertSupabase() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Feed is unavailable until Supabase is configured.");
  return supabase;
}

function randomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function safeFileName(name) {
  const clean = String(name || "feed-image")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return clean || "feed-image";
}

function reactionCountMap() {
  return Object.fromEntries(FEED_REACTIONS.map((reaction) => [reaction.value, 0]));
}

function groupBy(items, key) {
  const map = new Map();
  for (const item of items || []) {
    const value = item?.[key];
    if (!value) continue;
    if (!map.has(value)) map.set(value, []);
    map.get(value).push(item);
  }
  return map;
}

function normalizePost(post, { images = [], comments = [], reactions = [], viewerUserId = null } = {}) {
  const counts = reactionCountMap();
  let viewerReaction = null;
  for (const reaction of reactions) {
    if (reaction?.reaction in counts) counts[reaction.reaction] += 1;
    if (viewerUserId && reaction?.user_id === viewerUserId) viewerReaction = reaction.reaction;
  }

  return {
    id: post.id,
    authorId: post.author_id,
    authorDisplayName: post.author_display_name || "Student",
    authorAvatarUrl: post.author_avatar_url || "",
    authorUniversityName: post.author_university_name || "",
    authorUniversityStatus: post.author_university_status || "",
    authorDistinction: post.author_distinction || "",
    isOfficial: Boolean(post.is_official),
    category: post.category || "general",
    title: post.title || "",
    body: post.body || "",
    linkUrl: post.link_url || "",
    status: post.status || "published",
    moderationDecision: post.moderation_decision || "",
    moderationReason: post.moderation_reason || "",
    moderationCategories: Array.isArray(post.moderation_categories) ? post.moderation_categories : [],
    moderationScore: typeof post.moderation_score === "number" ? post.moderation_score : null,
    aiModel: post.ai_model || "",
    reportCount: Number(post.report_count || 0),
    adminNote: post.admin_note || "",
    publishedAt: post.published_at || "",
    createdAt: post.created_at || "",
    updatedAt: post.updated_at || "",
    removedAt: post.removed_at || "",
    images: (images || [])
      .slice()
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
      .map((image) => ({
        id: image.id,
        publicUrl: image.public_url,
        altText: image.alt_text || "",
        sortOrder: Number(image.sort_order || 0),
      })),
    comments: (comments || []).map((comment) => ({
      id: comment.id,
      postId: comment.post_id,
      authorId: comment.author_id,
      authorDisplayName: comment.author_display_name || "Student",
      authorAvatarUrl: comment.author_avatar_url || "",
      authorUniversityName: comment.author_university_name || "",
      authorUniversityStatus: comment.author_university_status || "",
      authorDistinction: comment.author_distinction || "",
      body: comment.body || "",
      status: comment.status || "published",
      moderationReason: comment.moderation_reason || "",
      reportCount: Number(comment.report_count || 0),
      adminNote: comment.admin_note || "",
      publishedAt: comment.published_at || "",
      createdAt: comment.created_at || "",
      updatedAt: comment.updated_at || "",
      removedAt: comment.removed_at || "",
    })),
    reactionCounts: counts,
    viewerReaction,
  };
}

async function getCurrentUser(supabase) {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data?.user || null;
}

async function requireCurrentUser(supabase) {
  const user = await getCurrentUser(supabase);
  if (!user) throw new Error("Sign in to use the feed.");
  return user;
}

async function getFeedAuthHeaders(supabase) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data?.session?.access_token;
  if (!token) throw new Error("Sign in to use the feed.");
  return { Authorization: `Bearer ${token}` };
}

async function parseFunctionInvokeError(error, data) {
  if (data?.error) return new Error(String(data.error));

  if (!error || typeof error !== "object") {
    return new Error("Could not reach feed moderation. Check that feed-moderation is deployed.");
  }

  const context = error.context;
  if (context && typeof context.json === "function") {
    try {
      const payload = await context.json();
      if (payload?.error) return new Error(String(payload.error));
    } catch {
      /* fall through */
    }
  }

  const message = String(error.message || "").trim();
  if (/failed to send a request to the edge function/i.test(message)) {
    return new Error("Feed posting is unavailable. Deploy the feed-moderation Edge Function in Supabase.");
  }

  return new Error(message || "Could not complete the feed request.");
}

async function invokeFeedModeration(body) {
  const supabase = assertSupabase();
  const headers = await getFeedAuthHeaders(supabase);
  const { data, error } = await supabase.functions.invoke("feed-moderation", { body, headers });
  if (error) throw await parseFunctionInvokeError(error, data);
  if (data?.error) throw new Error(data.error);
  return data;
}

async function uploadFeedImages(supabase, user, files) {
  const selected = Array.from(files || []).slice(0, MAX_IMAGES);
  const uploaded = [];

  for (const file of selected) {
    if (!file.type?.startsWith("image/")) {
      throw new Error(`${file.name} is not an image.`);
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error(`${file.name} is larger than 5MB.`);
    }

    const path = `${user.id}/${Date.now()}-${randomId()}-${safeFileName(file.name)}`;
    const { error } = await supabase.storage.from("feed-images").upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });
    if (error) throw error;

    const { data } = supabase.storage.from("feed-images").getPublicUrl(path);
    uploaded.push({
      storagePath: path,
      publicUrl: data.publicUrl,
      altText: file.name,
    });
  }

  return uploaded;
}

export async function fetchFeedPosts({ limit = 30 } = {}) {
  const supabase = getSupabase();
  if (!supabase) return [];

  const viewer = await getCurrentUser(supabase).catch(() => null);
  let postsQuery = supabase.from("feed_posts").select(
    "id,author_id,author_display_name,author_avatar_url,author_university_name,author_university_status,author_distinction,is_official,category,title,body,link_url,status,moderation_decision,moderation_reason,moderation_categories,moderation_score,ai_model,report_count,admin_note,published_at,created_at,updated_at,removed_at",
  );

  if (viewer?.id) {
    postsQuery = postsQuery.or(`status.eq.published,author_id.eq.${viewer.id}`);
  } else {
    postsQuery = postsQuery.eq("status", "published");
  }

  const { data: posts, error } = await postsQuery
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  const ids = (posts || []).map((post) => post.id);
  if (!ids.length) return [];

  const [imagesResult, commentsResult, reactionsResult] = await Promise.all([
    supabase
      .from("feed_post_images")
      .select("id,post_id,public_url,alt_text,sort_order")
      .in("post_id", ids)
      .order("sort_order", { ascending: true }),
    supabase
      .from("feed_comments")
      .select("id,post_id,author_id,author_display_name,author_avatar_url,author_university_name,author_university_status,author_distinction,body,status,moderation_reason,report_count,admin_note,published_at,created_at,updated_at,removed_at")
      .in("post_id", ids)
      .eq("status", "published")
      .order("created_at", { ascending: true }),
    supabase.from("feed_reactions").select("post_id,user_id,reaction").in("post_id", ids),
  ]);

  if (imagesResult.error) throw imagesResult.error;
  if (commentsResult.error) throw commentsResult.error;
  if (reactionsResult.error) throw reactionsResult.error;

  const imagesByPost = groupBy(imagesResult.data, "post_id");
  const commentsByPost = groupBy(commentsResult.data, "post_id");
  const reactionsByPost = groupBy(reactionsResult.data, "post_id");

  return posts.map((post) =>
    normalizePost(post, {
      images: imagesByPost.get(post.id) || [],
      comments: commentsByPost.get(post.id) || [],
      reactions: reactionsByPost.get(post.id) || [],
      viewerUserId: viewer?.id || null,
    }),
  );
}

export async function submitFeedPost({ category, title, body, linkUrl, imageFiles }) {
  const supabase = assertSupabase();
  const user = await requireCurrentUser(supabase);
  const images = await uploadFeedImages(supabase, user, imageFiles);
  return invokeFeedModeration({
    action: "submitPost",
    category,
    title,
    body,
    linkUrl,
    images,
  });
}

export async function submitFeedComment({ postId, body }) {
  return invokeFeedModeration({
    action: "submitComment",
    postId,
    body,
  });
}

export async function setFeedReaction({ postId, reaction }) {
  const supabase = assertSupabase();
  const user = await requireCurrentUser(supabase);

  if (!reaction) {
    const { error } = await supabase.from("feed_reactions").delete().eq("post_id", postId).eq("user_id", user.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("feed_reactions").upsert(
    {
      post_id: postId,
      user_id: user.id,
      reaction,
    },
    { onConflict: "post_id,user_id" },
  );
  if (error) throw error;
}

export async function reportFeedTarget({ targetType, targetId, reason, details = "" }) {
  const supabase = assertSupabase();
  const user = await requireCurrentUser(supabase);
  const { error } = await supabase.from("feed_reports").insert({
    target_type: targetType,
    target_id: targetId,
    reporter_id: user.id,
    reason,
    details,
  });
  if (error?.code === "23505") return { alreadyReported: true };
  if (error) throw error;
  return { alreadyReported: false };
}

export async function isCurrentUserFeedAdmin() {
  const supabase = getSupabase();
  if (!supabase) return false;
  const user = await getCurrentUser(supabase).catch(() => null);
  if (!user) return false;
  const { data, error } = await supabase.from("feed_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (error) return false;
  return Boolean(data);
}

export async function fetchAdminFeedItems({ limit = 120 } = {}) {
  const supabase = assertSupabase();

  const [postsResult, imagesResult, commentsResult, reactionsResult, reportsResult] = await Promise.all([
    supabase
      .from("feed_posts")
      .select(
        "id,author_id,author_display_name,author_avatar_url,author_university_name,author_university_status,author_distinction,category,title,body,link_url,status,moderation_decision,moderation_reason,moderation_categories,moderation_score,ai_model,report_count,admin_note,published_at,created_at,updated_at,removed_at",
      )
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase.from("feed_post_images").select("id,post_id,public_url,alt_text,sort_order"),
    supabase
      .from("feed_comments")
      .select("id,post_id,author_id,author_display_name,author_avatar_url,author_university_name,author_university_status,author_distinction,body,status,moderation_reason,report_count,admin_note,published_at,created_at,updated_at,removed_at")
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase.from("feed_reactions").select("post_id,user_id,reaction"),
    supabase
      .from("feed_reports")
      .select("id,target_type,target_id,reporter_id,reason,details,created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  if (postsResult.error) throw postsResult.error;
  if (imagesResult.error) throw imagesResult.error;
  if (commentsResult.error) throw commentsResult.error;
  if (reactionsResult.error) throw reactionsResult.error;
  if (reportsResult.error) throw reportsResult.error;

  const imagesByPost = groupBy(imagesResult.data, "post_id");
  const commentsByPost = groupBy(commentsResult.data, "post_id");
  const reactionsByPost = groupBy(reactionsResult.data, "post_id");
  const posts = (postsResult.data || []).map((post) =>
    normalizePost(post, {
      images: imagesByPost.get(post.id) || [],
      comments: commentsByPost.get(post.id) || [],
      reactions: reactionsByPost.get(post.id) || [],
    }),
  );

  return {
    posts,
    comments: commentsResult.data || [],
    reports: reportsResult.data || [],
  };
}

export async function moderateFeedTarget({ targetType, targetId, action, adminNote = "" }) {
  return invokeFeedModeration({
    action: "adminAction",
    targetType,
    targetId,
    adminAction: action,
    adminNote,
  });
}

export function categoryLabel(value) {
  return FEED_CATEGORIES.find((category) => category.value === value)?.label || "General";
}

export function reactionLabel(value) {
  return FEED_REACTIONS.find((reaction) => reaction.value === value)?.label || "Reaction";
}
