export function getFlutterwaveSecretKey() {
  const key = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
  if (!key) throw new Error("FLUTTERWAVE_SECRET_KEY is not set");
  return key;
}

export function getFlutterwaveCurrency() {
  return (Deno.env.get("FLUTTERWAVE_CURRENCY") || "BWP").trim().toUpperCase();
}

export function getFlutterwaveWebhookSecret() {
  return Deno.env.get("FLUTTERWAVE_WEBHOOK_SECRET") || "";
}

type FlutterwaveResponse = {
  status?: string;
  message?: string;
  data?: Record<string, unknown>;
};

export async function flutterwaveRequest(path: string, init: RequestInit = {}): Promise<FlutterwaveResponse> {
  const key = getFlutterwaveSecretKey();
  const res = await fetch(`https://api.flutterwave.com/v3${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const body = (await res.json().catch(() => ({}))) as FlutterwaveResponse;
  if (!res.ok) {
    throw new Error(body?.message || `Flutterwave API error (${res.status})`);
  }
  return body;
}

export async function verifyFlutterwaveTransaction(transactionId: string | number) {
  return flutterwaveRequest(`/transactions/${transactionId}/verify`);
}

export async function createFlutterwavePaymentLink(payload: Record<string, unknown>) {
  return flutterwaveRequest("/payments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
