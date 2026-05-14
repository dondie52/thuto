type ChatMessage = {
  role?: "user" | "assistant";
  content?: string;
};

type AssistantRequest = {
  action?: "chat" | "speak";
  question?: string;
  text?: string;
  history?: ChatMessage[];
  localContext?: unknown;
};

type GeminiPart = {
  text?: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
  error?: {
    message?: string;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cleanText(value: unknown, max = 4000) {
  return String(value || "").trim().slice(0, max);
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

function compactHistory(history: unknown) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((message): message is ChatMessage => {
      return (
        message &&
        typeof message === "object" &&
        (message.role === "user" || message.role === "assistant") &&
        Boolean(cleanText(message.content, 2000))
      );
    })
    .slice(-8)
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: cleanText(message.content, 2000) }],
    }));
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

function normalizeGeminiPayload(text: string) {
  const parsed = extractJson(text);
  if (parsed && typeof parsed === "object") {
    const body = parsed as Record<string, unknown>;
    return {
      answer: cleanText(body.answer, 6000) || cleanText(text, 6000),
      confidence: cleanText(body.confidence, 40) || "medium",
      usedLocalContext: Boolean(body.usedLocalContext),
      suggestions: Array.isArray(body.suggestions) ? body.suggestions.map((item) => cleanText(item, 120)).filter(Boolean).slice(0, 4) : [],
      references: Array.isArray(body.references) ? body.references.slice(0, 5) : [],
    };
  }
  return {
    answer: cleanText(text, 6000),
    confidence: "medium",
    usedLocalContext: false,
    suggestions: [],
    references: [],
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let body: AssistantRequest = {};
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON request" }, 400);
  }

  if (body.action === "speak") {
    const elevenLabsKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!elevenLabsKey) {
      return jsonResponse({ error: "ElevenLabs is not configured on the server" }, 503);
    }

    const text = cleanText(body.text, 1200);
    if (!text) {
      return jsonResponse({ error: "Text is required" }, 400);
    }

    const voiceId = Deno.env.get("ELEVENLABS_VOICE_ID") || "21m00Tcm4TlvDq8ikWAM";
    const modelId = Deno.env.get("ELEVENLABS_MODEL_ID") || "eleven_flash_v2_5";
    const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(
      voiceId,
    )}?output_format=mp3_44100_128`;

    const speechResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
        "xi-api-key": elevenLabsKey,
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!speechResponse.ok) {
      const errorText = await speechResponse.text().catch(() => "");
      return jsonResponse(
        {
          error: errorText || "ElevenLabs speech request failed",
        },
        502,
      );
    }

    return jsonResponse({
      provider: "elevenlabs",
      model: modelId,
      voiceId,
      mimeType: speechResponse.headers.get("Content-Type") || "audio/mpeg",
      audioContent: base64FromArrayBuffer(await speechResponse.arrayBuffer()),
    });
  }

  const provider = Deno.env.get("AI_PROVIDER") || "gemini";
  if (provider !== "gemini") {
    return jsonResponse({ error: "Only Gemini is configured for this assistant" }, 400);
  }

  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiKey) {
    return jsonResponse({ error: "Gemini is not configured on the server" }, 503);
  }

  const question = cleanText(body.question, 1200);
  if (!question) {
    return jsonResponse({ error: "Question is required" }, 400);
  }

  const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
  const localContextText = JSON.stringify(body.localContext || {}, null, 2).slice(0, 24000);
  const systemInstruction = `
You are Thuto, a Botswana study guidance assistant.
Use the supplied Thuto local context first: programmes, institutions, requirements, application dates, saved grades, and fit signals.
If context is missing or uncertain, say so plainly and give cautious general guidance.
Do not invent official admission decisions, deadlines, fees, accreditation, or guaranteed acceptance.
For points/grades questions, compare against local programme minimum points and subject requirements first, then explain options.
Keep answers student-friendly, practical, and concise.
Return only JSON with this shape:
{
  "answer": "string",
  "confidence": "high|medium|low",
  "usedLocalContext": true,
  "suggestions": ["string"],
  "references": [{"title":"string","href":"string","external":false}]
}
`;

  const contents = [
    ...compactHistory(body.history),
    {
      role: "user",
      parts: [
        {
          text: `Question: ${question}\n\nThuto local context JSON:\n${localContextText}`,
        },
      ],
    },
  ];

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(geminiKey)}`;

  const geminiResponse = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents,
      generationConfig: {
        temperature: 0.35,
        topP: 0.9,
        responseMimeType: "application/json",
      },
    }),
  });

  const payload = (await geminiResponse.json().catch(() => ({}))) as GeminiResponse;
  if (!geminiResponse.ok) {
    return jsonResponse(
      {
        error: payload.error?.message || "Gemini request failed",
      },
      502,
    );
  }

  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n").trim() || "";
  if (!text) {
    return jsonResponse({ error: "Gemini returned an empty response" }, 502);
  }

  return jsonResponse({
    provider,
    model,
    ...normalizeGeminiPayload(text),
  });
});
