const DPO_API_URL = "https://secure.3gdirectpay.com/API/v6/";
export const DPO_PAY_URL = "https://secure.3gdirectpay.com/payv2.php";

export function getDpoCompanyToken() {
  const token = Deno.env.get("DPO_COMPANY_TOKEN");
  if (!token) throw new Error("DPO_COMPANY_TOKEN is not set");
  return token.trim();
}

export function getDpoServiceType() {
  const serviceType = Deno.env.get("DPO_SERVICE_TYPE");
  if (!serviceType) throw new Error("DPO_SERVICE_TYPE is not set");
  return serviceType.trim();
}

export function getDpoCurrency() {
  return (Deno.env.get("DPO_CURRENCY") || "BWP").trim().toUpperCase();
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function xmlTag(name: string, value: string | number): string {
  return `<${name}>${escapeXml(String(value))}</${name}>`;
}

export function parseDpoXml(xml: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const tagPattern = /<(\w+)>([^<]*)<\/\1>/g;
  for (const match of xml.matchAll(tagPattern)) {
    fields[match[1]] = match[2];
  }
  return fields;
}

export function formatDpoAmount(amount: number): string {
  return amount.toFixed(2);
}

export function formatDpoServiceDate(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function isDpoPaidResult(result: string | undefined): boolean {
  return result === "000" || result === "001";
}

async function dpoRequest(requestType: string, innerXml: string): Promise<Record<string, string>> {
  const companyToken = getDpoCompanyToken();
  const body = `<?xml version="1.0" encoding="utf-8"?><API3G>${xmlTag("CompanyToken", companyToken)}${xmlTag("Request", requestType)}${innerXml}</API3G>`;

  const res = await fetch(DPO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      Accept: "application/xml",
    },
    body,
  });

  const text = await res.text();
  const parsed = parseDpoXml(text);
  if (!res.ok) {
    throw new Error(parsed.ResultExplanation || `DPO API error (${res.status})`);
  }
  if (parsed.Result && parsed.Result !== "000" && requestType === "createToken") {
    throw new Error(parsed.ResultExplanation || `DPO createToken failed (${parsed.Result})`);
  }
  return parsed;
}

type CreateTokenInput = {
  amount: number;
  currency: string;
  companyRef: string;
  redirectUrl: string;
  backUrl: string;
  serviceType: string;
  serviceDescription: string;
  customerEmail?: string;
  customerFirstName?: string;
  customerLastName?: string;
  metadata?: Record<string, string>;
};

export async function createDpoToken(input: CreateTokenInput) {
  const transactionXml = [
    "<Transaction>",
    xmlTag("PaymentAmount", formatDpoAmount(input.amount)),
    xmlTag("PaymentCurrency", input.currency),
    xmlTag("CompanyRef", input.companyRef),
    xmlTag("CompanyRefUnique", "1"),
    xmlTag("RedirectURL", input.redirectUrl),
    xmlTag("BackURL", input.backUrl),
    xmlTag("PTL", "24"),
    input.customerEmail ? xmlTag("customerEmail", input.customerEmail) : "",
    input.customerFirstName ? xmlTag("customerFirstName", input.customerFirstName) : "",
    input.customerLastName ? xmlTag("customerLastName", input.customerLastName) : "",
    input.metadata
      ? `<MetaData><![CDATA[${JSON.stringify(input.metadata)}]]></MetaData>`
      : "",
    "</Transaction>",
  ].join("");

  const servicesXml = [
    "<Services>",
    "<Service>",
    xmlTag("ServiceType", input.serviceType),
    xmlTag("ServiceDescription", input.serviceDescription),
    xmlTag("ServiceDate", formatDpoServiceDate()),
    "</Service>",
    "</Services>",
  ].join("");

  return dpoRequest("createToken", `${transactionXml}${servicesXml}`);
}

export async function verifyDpoToken(transToken: string, companyRef?: string) {
  const inner = [
    transToken ? xmlTag("TransactionToken", transToken) : "",
    companyRef ? xmlTag("CompanyRef", companyRef) : "",
    xmlTag("VerifyTransaction", "1"),
  ].join("");
  return dpoRequest("verifyToken", inner);
}

export function getDpoCheckoutUrl(transToken: string): string {
  return `${DPO_PAY_URL}?ID=${encodeURIComponent(transToken)}`;
}
