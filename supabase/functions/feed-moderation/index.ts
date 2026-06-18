import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.1";

type FeedAction = "submitPost" | "submitComment" | "adminAction";

type ModerationDecision = "publish" | "review" | "reject";

type ModerationResult = {
  decision: ModerationDecision;
  score: number | null;
  categories: string[];
  reason: string;
  model: string;
};

type FeedImageInput = {
  storagePath?: string;
  publicUrl?: string;
  url?: string;
  altText?: string;
  width?: number;
  height?: number;
};

type FeedRequest = {
  action?: FeedAction;
  category?: string;
  title?: string;
  body?: string;
  linkUrl?: string;
  images?: FeedImageInput[];
  targetInstitutionIds?: string[];
  isNational?: boolean;
  postId?: string;
  targetType?: "post" | "comment";
  targetId?: string;
  adminAction?: "approve" | "reject" | "remove" | "restore";
  adminNote?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-api-version, accept, accept-profile, prefer, range",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FEED_CATEGORIES = new Set([
  "graduate_programme",
  "opportunity",
  "scholarship",
  "internship",
  "deadline",
  "study_tip",
  "event",
  "notice",
  "question",
  "story",
  "campus_life",
  "general",
]);

const MAX_POSTS_PER_DAY = 3;
const MAX_COMMENTS_PER_DAY = 30;
const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

class HttpError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cleanText(value: unknown, max = 4000) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, max);
}

function cleanBody(value: unknown, max = 2400) {
  return String(value || "").trim().slice(0, max);
}

function cleanUrl(value: unknown) {
  const raw = cleanText(value, 500);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function clampScore(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.max(0, Math.min(1, number));
}

function cleanDecisionText(value: unknown) {
  return cleanText(value, 80).toLowerCase().replace(/[^a-z_ -]/g, "").replace(/\s+/g, "_");
}

function normalizeModerationDecision(parsed: Record<string, unknown> | null): ModerationDecision {
  const candidates = [
    parsed?.decision,
    parsed?.verdict,
    parsed?.status,
    parsed?.action,
    parsed?.result,
  ].map(cleanDecisionText);

  if (
    candidates.some((decision) =>
      [
        "publish",
        "published",
        "approve",
        "approved",
        "allow",
        "allowed",
        "safe",
        "fine",
        "ok",
        "okay",
        "accept",
        "accepted",
        "pass",
        "passed",
      ].includes(decision),
    )
  ) {
    return "publish";
  }

  if (
    candidates.some((decision) =>
      [
        "reject",
        "rejected",
        "deny",
        "denied",
        "block",
        "blocked",
        "unsafe",
        "remove",
        "removed",
        "fail",
        "failed",
      ].includes(decision),
    )
  ) {
    return "reject";
  }

  if (
    candidates.some((decision) =>
      [
        "review",
        "needs_review",
        "pending_review",
        "manual_review",
        "admin_review",
        "uncertain",
        "unsure",
        "borderline",
      ].includes(decision),
    )
  ) {
    return "review";
  }

  if (parsed?.safe === true || parsed?.is_safe === true || parsed?.allowed === true || parsed?.approved === true) {
    return "publish";
  }

  if (parsed?.safe === false || parsed?.is_safe === false || parsed?.allowed === false || parsed?.approved === false) {
    return "reject";
  }

  return "review";
}

function toDisplayName(user: Record<string, unknown>) {
  const metadata = (user.user_metadata || {}) as Record<string, unknown>;
  const fullName = cleanText(metadata.full_name, 80);
  if (fullName) return fullName;
  const email = cleanText(user.email, 120);
  const local = email.split("@")[0]?.trim();
  return cleanText(local || "Student", 80);
}

type AuthorSnapshot = {
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  universityId: string | null;
  universityName: string | null;
  universityStatus: string | null;
  distinction: string | null;
};

const UNIVERSITY_CATEGORY_IDS = new Set([
  "ub",
  "biust",
  "bac",
  "botho",
  "ba-isago",
  "abm",
  "limkokwing",
  "bou",
  "boitekanelo",
  "new-era",
  "gips",
  "bocodol",
  "kgale",
  "isbs",
  "idm",
  "guc",
  "buan",
  "logan-business-college",
  "mega-size-college",
  "homeland-college",
  "gaborone-commercial-college",
  "byte-size-college",
  "awil-college",
]);

const TECHNICAL_COLLEGE_IDS = new Set([
  "gtc",
  "fctve",
  "oodi",
  "realic",
  "palapye-technical-college",
  "jwaneng-technical-college",
  "maun-technical-college",
  "selebi-phikwe-technical-college",
  "chobe-brigade",
  "krda",
]);

const SHORT_COURSE_IDS = new Set([
  "botswana-accountancy-training",
  "bosa-bosele",
  "roads-training-centre",
  "dawn-training",
  "cep-training",
  "learneasy",
  "stargems",
  "insurance-training-institute",
  "crackit",
  "aafm",
  "africa-insurance-training-institute",
  "delta-training-academy",
]);

function inferInstitutionCategory(institutionId: string | null) {
  const id = cleanText(institutionId, 120).toLowerCase();
  if (!id) return null;
  if (UNIVERSITY_CATEGORY_IDS.has(id)) return "universities";
  if (SHORT_COURSE_IDS.has(id)) return "short-courses";
  if (TECHNICAL_COLLEGE_IDS.has(id) || id.includes("brigade") || id.includes("technical")) {
    return "technical-colleges-brigades";
  }
  if (id.includes("university")) return "universities";
  return "specialised-academics";
}

function cleanInstitutionIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => cleanText(item, 120)).filter(Boolean))].slice(0, 10);
}

async function getAuthorSnapshot(
  adminClient: ReturnType<typeof createClient>,
  user: Record<string, unknown>,
): Promise<AuthorSnapshot> {
  const userId = String(user.id || "");
  const { data: profile } = await adminClient
    .from("profiles")
    .select("full_name, username, bio, avatar_url, university_id, university_name, university_status, distinction")
    .eq("id", userId)
    .maybeSingle();

  const profileName = cleanText(profile?.full_name, 80);
  const displayName = profileName || toDisplayName(user);
  const universityId = cleanText(profile?.university_id, 120) || null;

  return {
    displayName,
    username: cleanText(profile?.username, 30) || null,
    avatarUrl: cleanText(profile?.avatar_url, 1000) || null,
    universityId,
    universityName: cleanText(profile?.university_name, 120) || null,
    universityStatus:
      profile?.university_status === "studying" || profile?.university_status === "aspiring"
        ? profile.university_status
        : null,
    distinction: cleanText(profile?.bio, 150) || cleanText(profile?.distinction, 120) || null,
  };
}

function authorSnapshotFields(snapshot: AuthorSnapshot) {
  return {
    author_display_name: snapshot.displayName,
    author_username: snapshot.username,
    author_avatar_url: snapshot.avatarUrl,
    author_university_id: snapshot.universityId,
    author_institution_category: inferInstitutionCategory(snapshot.universityId),
    author_university_name: snapshot.universityName,
    author_university_status: snapshot.universityStatus,
    author_distinction: snapshot.distinction,
  };
}

function base64FromArrayBuffer(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function extractJson(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function env(name: string) {
  return Deno.env.get(name) || "";
}

function createClients(request: Request) {
  const supabaseUrl = env("SUPABASE_URL");
  const anonKey = env("SUPABASE_ANON_KEY");
  const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new HttpError("Supabase feed moderation is not configured.", 503);
  }

  const authorization = request.headers.get("Authorization") || "";
  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authorization } },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return { userClient, adminClient };
}

async function requireUser(userClient: ReturnType<typeof createClient>) {
  const { data, error } = await userClient.auth.getUser();
  if (error || !data?.user) {
    throw new HttpError("Sign in to use the feed.", 401);
  }
  return data.user as unknown as Record<string, unknown>;
}

async function requireAdmin(adminClient: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await adminClient
    .from("feed_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new HttpError(error.message, 500);
  if (!data) throw new HttpError("Feed admin access is required.", 403);
}

async function isFeedAdmin(adminClient: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await adminClient
    .from("feed_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}

async function enforceDailyLimit(
  adminClient: ReturnType<typeof createClient>,
  table: "feed_posts" | "feed_comments",
  userId: string,
  limit: number,
) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await adminClient
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("author_id", userId)
    .gte("created_at", since);

  if (error) throw new HttpError(error.message, 500);
  if ((count || 0) >= limit) {
    throw new HttpError(`Daily limit reached. Try again tomorrow.`, 429);
  }
}

async function imagePartFromUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) return null;

  const contentType = (response.headers.get("Content-Type") || "").split(";")[0].trim();
  const contentLength = Number(response.headers.get("Content-Length") || 0);
  if (!contentType.startsWith("image/")) return null;
  if (contentLength > MAX_IMAGE_BYTES) return null;

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_IMAGE_BYTES) return null;

  return {
    inline_data: {
      mime_type: contentType,
      data: base64FromArrayBuffer(buffer),
    },
  };
}

async function moderateContent({
  kind,
  category,
  title,
  body,
  linkUrl,
  imageUrls,
  parentPost,
}: {
  kind: "post" | "comment";
  category?: string;
  title?: string;
  body: string;
  linkUrl?: string | null;
  imageUrls?: string[];
  parentPost?: { title?: string; body?: string; category?: string };
}): Promise<ModerationResult> {
  const geminiKey = env("GEMINI_API_KEY");
  const model = env("GEMINI_MODEL") || "gemini-2.5-flash";
  if (!geminiKey) {
    return {
      decision: "review",
      score: null,
      categories: ["ai_unavailable"],
      reason: "AI moderation is not configured, so this needs admin review.",
      model: "unconfigured",
    };
  }

  const systemInstruction = `
You moderate Thuto's Botswana student scroll feed.
The feed allows broad student/community posts, but must block spam, scams, harassment, hate, explicit sexual content, graphic violence, dangerous instructions, doxxing, private personal information, irrelevant nonsense, and fake official notices.
Auto-publish only when content is clearly safe, student-relevant, and not misleading.
Use "review" for uncertainty, official-looking claims without a source, sensitive accusations, unclear images, borderline self-promotion, or anything that needs a human admin.
Use "reject" for clearly unsafe, abusive, scammy, or unrelated content.
Return only JSON:
{
  "decision": "publish|review|reject",
  "score": 0.0,
  "categories": ["string"],
  "reason": "short human-readable reason"
}
`;

  const prompt = [
    `Kind: ${kind}`,
    category ? `Category: ${category}` : "",
    title ? `Title: ${title}` : "",
    `Body: ${body}`,
    linkUrl ? `Link: ${linkUrl}` : "",
    parentPost ? `Parent post: ${parentPost.title || "(untitled)"} / ${parentPost.category || "general"} / ${parentPost.body || ""}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const imageParts = [];
  for (const url of (imageUrls || []).slice(0, MAX_IMAGES)) {
    try {
      const part = await imagePartFromUrl(url);
      if (part) imageParts.push(part);
    } catch {
      imageParts.push({ text: `Image could not be fetched for moderation: ${url}` });
    }
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(geminiKey)}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }, ...imageParts],
        },
      ],
      generationConfig: {
        temperature: 0,
        topP: 0.8,
        responseMimeType: "application/json",
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      decision: "review",
      score: null,
      categories: ["ai_error"],
      reason: payload?.error?.message || "AI moderation failed, so this needs admin review.",
      model,
    };
  }

  const text =
    payload?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || "")
      .join("\n")
      .trim() || "";
  const parsed = extractJson(text) as Record<string, unknown> | null;
  const decision = normalizeModerationDecision(parsed);
  const categories = Array.isArray(parsed?.categories)
    ? parsed.categories.map((item) => cleanText(item, 40)).filter(Boolean).slice(0, 8)
    : [];

  return {
    decision,
    score: clampScore(parsed?.score),
    categories,
    reason: cleanText(parsed?.reason, 500) || "AI moderation completed.",
    model,
  };
}

function statusForDecision(decision: ModerationDecision) {
  if (decision === "publish") return "published";
  if (decision === "reject") return "rejected";
  return "pending_review";
}

async function submitPost(
  adminClient: ReturnType<typeof createClient>,
  user: Record<string, unknown>,
  body: FeedRequest,
) {
  const userId = String(user.id || "");
  await enforceDailyLimit(adminClient, "feed_posts", userId, MAX_POSTS_PER_DAY);

  const category = cleanText(body.category, 40);
  if (!FEED_CATEGORIES.has(category)) throw new HttpError("Choose a valid feed category.");

  const title = cleanText(body.title, 120);
  const postBody = cleanBody(body.body, 2400);
  if (postBody.length < 3) throw new HttpError("Write a little more before posting.");

  const images = Array.isArray(body.images) ? body.images.slice(0, MAX_IMAGES) : [];
  const normalizedImages = images
    .map((image, index) => ({
      storage_path: cleanText(image.storagePath, 700),
      public_url: cleanText(image.publicUrl || image.url, 1000),
      alt_text: cleanText(image.altText, 180),
      sort_order: index,
      width: Number.isFinite(Number(image.width)) ? Number(image.width) : null,
      height: Number.isFinite(Number(image.height)) ? Number(image.height) : null,
    }))
    .filter((image) => image.storage_path && image.public_url);

  const linkUrl = cleanUrl(body.linkUrl);
  const moderation = await moderateContent({
    kind: "post",
    category,
    title,
    body: postBody,
    linkUrl,
    imageUrls: normalizedImages.map((image) => image.public_url),
  });
  const status = statusForDecision(moderation.decision);
  const now = new Date().toISOString();
  const official = await isFeedAdmin(adminClient, userId);
  const author = official
    ? {
        displayName: "Thuto Admin",
        username: null,
        avatarUrl: null,
        universityId: null,
        universityName: null,
        universityStatus: null,
        distinction: null,
      }
    : await getAuthorSnapshot(adminClient, user);

  const targetInstitutionIds = cleanInstitutionIds(body.targetInstitutionIds);
  const isNational = Boolean(body.isNational) || official;

  const { data: post, error } = await adminClient
    .from("feed_posts")
    .insert({
      author_id: userId,
      ...authorSnapshotFields({
        ...author,
        displayName: official ? "Thuto Admin" : author.displayName,
      }),
      is_official: official,
      is_national: isNational,
      target_institution_ids: targetInstitutionIds,
      category,
      title,
      body: postBody,
      link_url: linkUrl,
      status,
      moderation_decision: moderation.decision,
      moderation_reason: moderation.reason,
      moderation_categories: moderation.categories,
      moderation_score: moderation.score,
      ai_model: moderation.model,
      published_at: status === "published" ? now : null,
      reviewed_at: status === "pending_review" ? null : now,
    })
    .select("id,status,moderation_decision,moderation_reason,published_at,created_at")
    .single();

  if (error) throw new HttpError(error.message, 500);

  if (normalizedImages.length) {
    const { error: imageError } = await adminClient.from("feed_post_images").insert(
      normalizedImages.map((image) => ({
        ...image,
        post_id: post.id,
      })),
    );
    if (imageError) throw new HttpError(imageError.message, 500);
  }

  return { post, moderation };
}

async function submitComment(
  adminClient: ReturnType<typeof createClient>,
  user: Record<string, unknown>,
  body: FeedRequest,
) {
  const userId = String(user.id || "");
  await enforceDailyLimit(adminClient, "feed_comments", userId, MAX_COMMENTS_PER_DAY);

  const postId = cleanText(body.postId, 80);
  const commentBody = cleanBody(body.body, 1000);
  if (!postId) throw new HttpError("Post is required.");
  if (!commentBody) throw new HttpError("Comment cannot be empty.");

  const { data: post, error: postError } = await adminClient
    .from("feed_posts")
    .select("id,title,body,category,status")
    .eq("id", postId)
    .maybeSingle();

  if (postError) throw new HttpError(postError.message, 500);
  if (!post || post.status !== "published") throw new HttpError("This post is not open for comments.", 400);

  const moderation = await moderateContent({
    kind: "comment",
    body: commentBody,
    parentPost: {
      title: post.title,
      body: post.body,
      category: post.category,
    },
  });
  const status = statusForDecision(moderation.decision);
  const now = new Date().toISOString();
  const author = await getAuthorSnapshot(adminClient, user);

  const { data: comment, error } = await adminClient
    .from("feed_comments")
    .insert({
      post_id: postId,
      author_id: userId,
      ...authorSnapshotFields(author),
      body: commentBody,
      status,
      moderation_decision: moderation.decision,
      moderation_reason: moderation.reason,
      moderation_categories: moderation.categories,
      moderation_score: moderation.score,
      ai_model: moderation.model,
      published_at: status === "published" ? now : null,
      reviewed_at: status === "pending_review" ? null : now,
    })
    .select("id,status,moderation_decision,moderation_reason,published_at,created_at")
    .single();

  if (error) throw new HttpError(error.message, 500);
  return { comment, moderation };
}

async function adminAction(
  adminClient: ReturnType<typeof createClient>,
  user: Record<string, unknown>,
  body: FeedRequest,
) {
  const userId = String(user.id || "");
  await requireAdmin(adminClient, userId);

  const targetType = body.targetType === "comment" ? "comment" : "post";
  const targetId = cleanText(body.targetId, 80);
  const action = body.adminAction;
  if (!targetId || !action) throw new HttpError("Target and admin action are required.");

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    reviewed_by: userId,
    reviewed_at: now,
    admin_note: cleanText(body.adminNote, 500),
  };

  if (action === "approve") {
    patch.status = "published";
    patch.published_at = now;
    patch.removed_at = null;
  } else if (action === "reject") {
    patch.status = "rejected";
    patch.removed_at = null;
  } else if (action === "remove") {
    patch.status = "removed";
    patch.removed_at = now;
  } else if (action === "restore") {
    patch.status = "published";
    patch.published_at = now;
    patch.removed_at = null;
  } else {
    throw new HttpError("Unsupported admin action.");
  }

  const table = targetType === "post" ? "feed_posts" : "feed_comments";
  const { data, error } = await adminClient.from(table).update(patch).eq("id", targetId).select("*").single();
  if (error) throw new HttpError(error.message, 500);
  return { targetType, item: data };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const { userClient, adminClient } = createClients(request);
    const user = await requireUser(userClient);
    const body = (await request.json().catch(() => ({}))) as FeedRequest;

    if (body.action === "submitPost") {
      return jsonResponse(await submitPost(adminClient, user, body));
    }

    if (body.action === "submitComment") {
      return jsonResponse(await submitComment(adminClient, user, body));
    }

    if (body.action === "adminAction") {
      return jsonResponse(await adminAction(adminClient, user, body));
    }

    return jsonResponse({ error: "Unsupported feed action" }, 400);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    return jsonResponse({ error: error instanceof Error ? error.message : "Feed request failed" }, status);
  }
});
