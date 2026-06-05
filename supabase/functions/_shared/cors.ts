const defaultAllowedHeaders = [
  "authorization",
  "apikey",
  "content-type",
  "x-client-info",
  "x-supabase-api-version",
  "accept",
  "accept-profile",
  "prefer",
  "range",
];

export function corsHeaders(request?: Request) {
  const requestedHeaders = request?.headers.get("access-control-request-headers")?.trim();
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": requestedHeaders || defaultAllowedHeaders.join(", "),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

export function jsonResponse(body: unknown, status = 200, request?: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), "Content-Type": "application/json" },
  });
}
