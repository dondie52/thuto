// Optional Thuto AI assistant edge function stub.
//
// This file is not required for the PWA to run. It is a future server-side place
// to call providers such as Gemini, OpenAI, Groq, or OpenRouter without exposing
// API keys in frontend code. Keep provider keys in Supabase function secrets.

type AssistantRequest = {
  question?: string;
  localContext?: unknown;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const provider = Deno.env.get("AI_PROVIDER") || "gemini";
  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  const groqKey = Deno.env.get("GROQ_API_KEY");
  const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");
  const hasServerKey = Boolean(geminiKey || openaiKey || groqKey || openRouterKey);

  let body: AssistantRequest = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  return new Response(
    JSON.stringify({
      mode: "placeholder",
      provider,
      configured: hasServerKey,
      message: hasServerKey
        ? "Provider key found on the server, but real AI calls are intentionally not implemented yet."
        : "AI mode not configured yet. Add provider keys as server-side function secrets only.",
      question: body.question || "",
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});

