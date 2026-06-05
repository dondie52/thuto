import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

type ProgrammeCandidate = {
  id?: string;
  name?: string;
  university?: string;
  minPoints?: number;
};

type HomeSpotlightRequest = {
  calendarDayKey?: string;
  programmeCandidates?: ProgrammeCandidate[];
};

type GeminiPart = { text?: string };
type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
  error?: { message?: string };
};

function cleanText(value: unknown, max: number) {
  return String(value || "").trim().slice(0, max);
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

function isDayKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeCandidates(raw: unknown): ProgrammeCandidate[] {
  if (!Array.isArray(raw)) return [];
  const out: ProgrammeCandidate[] = [];
  for (const row of raw.slice(0, 100)) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const id = cleanText(r.id, 120);
    if (!id) continue;
    out.push({
      id,
      name: cleanText(r.name, 200),
      university: cleanText(r.university, 200),
      minPoints: typeof r.minPoints === "number" && Number.isFinite(r.minPoints) ? r.minPoints : undefined,
    });
  }
  return out;
}

function isHttpsUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Headers":
          request.headers.get("access-control-request-headers")?.trim() ||
          "authorization, x-client-info, apikey, content-type, x-supabase-api-version, accept, accept-profile, prefer, range",
      },
    });
  }

  if (request.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405, request);
  }

  const provider = Deno.env.get("AI_PROVIDER") || "gemini";
  if (provider !== "gemini") {
    return jsonResponse({ ok: false, error: "Only Gemini is configured for this endpoint" }, 400, request);
  }

  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiKey) {
    return jsonResponse({ ok: false, error: "Gemini is not configured on the server" }, 503, request);
  }

  let body: HomeSpotlightRequest = {};
  try {
    body = (await request.json()) as HomeSpotlightRequest;
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON body" }, 400, request);
  }

  const calendarDayKey = cleanText(body.calendarDayKey, 12);
  if (!calendarDayKey || !isDayKey(calendarDayKey)) {
    return jsonResponse({ ok: false, error: "calendarDayKey must be YYYY-MM-DD" }, 400, request);
  }

  const programmeCandidates = normalizeCandidates(body.programmeCandidates);
  if (programmeCandidates.length < 8) {
    return jsonResponse({ ok: false, error: "At least 8 programme candidates are required" }, 400, request);
  }

  const candidateIds = new Set(programmeCandidates.map((c) => c.id));

  const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
  const disableSearch = String(Deno.env.get("HOME_SPOTLIGHT_DISABLE_GOOGLE_SEARCH") || "").toLowerCase() === "true";

  const candidatesJson = JSON.stringify(programmeCandidates, null, 0).slice(0, 48_000);

  const systemInstruction = `You are Thuto's home-page editor for Botswana students.
Rules:
- featuredProgrammes: choose exactly 3 objects. Each "id" MUST be copied verbatim from the supplied candidates list — never invent ids.
- teaser: one engaging sentence (max 140 chars) per programme, student-friendly.
- scholarship: use Google Search when enabled to find timely, credible information about Botswana higher-education funding, government HRD sponsorship, or major university bursary notices. If search finds nothing solid, set officialLink null and explain uncertainty in groundingNote.
- Never claim a student has won an award. No fabricated deadlines or amounts.
- officialLink: a single https URL from an official government, university, or reputable news source found via search, or null.
Return only valid JSON (no markdown fences) with this exact shape:
{
  "featuredProgrammes": [{"id":"string","teaser":"string"}],
  "scholarship": {
    "title": "string",
    "body": "string",
    "groundingNote": "string",
    "officialLink": "https://..." | null
  }
}`;

  const userText = `Calendar day (local): ${calendarDayKey}
Programme candidates (JSON array — ids are authoritative):
${candidatesJson}

Produce the JSON response now.`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(geminiKey)}`;

  async function callGemini(googleSearch: boolean) {
    const payload: Record<string, unknown> = {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: userText }] }],
      generationConfig: {
        temperature: 0.25,
        topP: 0.9,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    };
    if (googleSearch) {
      payload.tools = [{ google_search: {} }];
    }
    const geminiResponse = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const raw = (await geminiResponse.json().catch(() => ({}))) as GeminiResponse;
    return { geminiResponse, raw };
  }

  let googleSearchEnabled = !disableSearch;
  let { geminiResponse, raw } = await callGemini(googleSearchEnabled);

  if (!geminiResponse.ok && googleSearchEnabled) {
    const msg = raw.error?.message || "";
    if (/tool|google_search|Search|grounding/i.test(msg) || geminiResponse.status === 400) {
      ({ geminiResponse, raw } = await callGemini(false));
      googleSearchEnabled = false;
    }
  }

  if (!geminiResponse.ok) {
    return jsonResponse(
      {
        ok: false,
        error: raw.error?.message || "Gemini request failed",
      },
      502,
      request,
    );
  }

  const text =
    raw.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n").trim() || "";
  if (!text) {
    return jsonResponse({ ok: false, error: "Gemini returned an empty response" }, 502, request);
  }

  const parsed = extractJson(text);
  if (!parsed || typeof parsed !== "object") {
    return jsonResponse({ ok: false, error: "Could not parse Gemini JSON" }, 502, request);
  }

  const obj = parsed as Record<string, unknown>;
  const featuredRaw = Array.isArray(obj.featuredProgrammes) ? obj.featuredProgrammes : [];
  const featuredProgrammes = featuredRaw
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const id = cleanText(r.id, 120);
      const teaser = cleanText(r.teaser, 200);
      if (!id || !candidateIds.has(id)) return null;
      return { id, teaser: teaser || "Featured in Thuto today." };
    })
    .filter(Boolean)
    .slice(0, 3) as Array<{ id: string; teaser: string }>;

  const sch = obj.scholarship && typeof obj.scholarship === "object" ? (obj.scholarship as Record<string, unknown>) : {};
  const officialLinkRaw = cleanText(sch.officialLink, 500);
  const officialLink = officialLinkRaw && isHttpsUrl(officialLinkRaw) ? officialLinkRaw : null;

  const scholarship = {
    title: cleanText(sch.title, 120) || "Funding and scholarships",
    body: cleanText(sch.body, 650),
    groundingNote: cleanText(sch.groundingNote, 280),
    officialLink,
  };

  if (!scholarship.body) {
    return jsonResponse({ ok: false, error: "Gemini omitted scholarship body" }, 502, request);
  }

  return jsonResponse({
    ok: true,
    source: "gemini",
    usedGoogleSearch: googleSearchEnabled,
    calendarDayKey,
    featuredProgrammes,
    scholarship,
  }, 200, request);
});
