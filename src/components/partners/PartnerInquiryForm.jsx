import { useState } from "react";
import { useAuth } from "../../lib/auth.jsx";
import { submitPartnerInquiry } from "../../lib/partnerInquiries.js";

const PARTNER_TYPE_OPTIONS = [
  { value: "university", label: "University or college" },
  { value: "tvet", label: "TVET or training institution" },
  { value: "employer", label: "Employer or bursary sponsor" },
  { value: "ngo", label: "NGO or youth programme" },
  { value: "school", label: "School or counsellor" },
  { value: "other", label: "Other" },
];

export default function PartnerInquiryForm({ content }) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.user_metadata?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [organization, setOrganization] = useState("");
  const [partnerType, setPartnerType] = useState("university");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!consent) {
      setError("Please agree to be contacted about Thuto partnerships.");
      return;
    }
    setStatus("sending");
    try {
      await submitPartnerInquiry({
        name,
        email,
        organization,
        partnerType,
        message,
        userId: user?.id,
      });
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your inquiry.");
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
        <p className="font-semibold">Thanks — we received your inquiry.</p>
        <p className="mt-2">Our team will follow up at {email.trim()} with a partner walkthrough.</p>
      </div>
    );
  }

  return (
    <form
      id="partner-inquiry"
      onSubmit={handleSubmit}
      className="scroll-mt-24 space-y-4 rounded-2xl border border-brand-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div>
        <h2 className="font-display text-xl font-semibold text-brand-900">{content?.heading}</h2>
        <p className="mt-2 text-sm text-slate-600">{content?.body}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Your name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Work email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="font-medium text-slate-700">Organization</span>
        <input
          required
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
          placeholder="University, employer, or programme name"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-slate-700">Partner type</span>
        <select
          value={partnerType}
          onChange={(e) => setPartnerType(e.target.value)}
          className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
        >
          {PARTNER_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="font-medium text-slate-700">Message (optional)</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2"
          placeholder="Tell us what you want to achieve with Thuto."
        />
      </label>
      <label className="flex items-start gap-2 text-xs text-slate-600">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
        <span>I agree that Thuto may contact me about partnership opportunities at the email above.</span>
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send inquiry"}
      </button>
    </form>
  );
}
