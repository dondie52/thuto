import ProVerificationBadge from "./ProVerificationBadge.jsx";

/**
 * Inline display name with optional Pro verification badge.
 */
export default function UserDisplayName({
  name,
  isPro = false,
  className = "",
  nameClassName = "",
  badgeClassName = "size-[18px]",
  title = "Pro verified",
}) {
  const label = String(name || "Student").trim() || "Student";

  return (
    <span className={["inline-flex min-w-0 max-w-full items-center gap-1.5", className].filter(Boolean).join(" ")}>
      <span className={["min-w-0 truncate", nameClassName].filter(Boolean).join(" ")}>{label}</span>
      {isPro ? <ProVerificationBadge className={badgeClassName} title={title} /> : null}
    </span>
  );
}
