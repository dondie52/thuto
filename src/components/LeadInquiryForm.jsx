import { useState } from "react";
import { submitInstitutionLead } from "../lib/partner.js";

/**
 * @param {{ institutionId: string, programmeId?: string, institutionName?: string }} props
 */
export default function LeadInquiryForm({ institutionId, programmeId, institutionName = "this institution" }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!consent) {
      setError("Please agree to share your contact details with the institution.");
      return;
    }
    setStatus("sending");
    try {
      await submitInstitutionLead({
        institutionId,
        programmeId,
        leadType: "inquiry",
        payload: { name: name.trim(), email: email.trim(), message: message.trim() },
      });
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send inquiry.");
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        Your inquiry was sent to {institutionName}. They may contact you directly.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-brand-200 bg-white p-4 shadow-sm">
      <h3 className="font-display text-base font-semibold text-brand-900">Request information</h3>
      <p className="text-xs text-slate-600">
        Share your contact details so {institutionName} can respond about admissions.
      </p>
      <label className="block text-sm">
        <span className="font-medium text-slate-700">Name</span>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-slate-700">Email</span>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-slate-700">Message</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
          placeholder="What would you like to know?"
        />
      </label>
      <label className="flex items-start gap-2 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          I agree that Thuto may share my name, email, and message with {institutionName} for admissions purposes.
        </span>
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send inquiry"}
      </button>
    </form>
  );
}
