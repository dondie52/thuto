import { useId } from "react";

/**
 * Thuto Pro verification seal — branded teal shield, distinct from other platforms.
 */
export default function ProVerificationBadge({ className = "size-7", title = "Pro verified" }) {
  const gradientId = useId();

  return (
    <span
      className={["inline-flex shrink-0 items-center justify-center self-center drop-shadow-sm", className].join(" ")}
      title={title}
    >
      <svg className="size-full" viewBox="0 0 24 24" aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="5" y1="3" x2="19" y2="21" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2dd4bf" />
            <stop offset="0.45" stopColor="#14b8a6" />
            <stop offset="1" stopColor="#0f766e" />
          </linearGradient>
        </defs>
        <path
          fill={`url(#${gradientId})`}
          d="M12 1.75 19.25 4.9v7.05c0 4.55-4.05 8.55-7.25 10.45-3.2-1.9-7.25-5.9-7.25-10.45V4.9L12 1.75z"
        />
        <path
          fill="#fff"
          fillOpacity="0.22"
          d="M12 4.35 16.55 6.45v5.45c0 2.95-2.45 5.75-4.55 7.15V4.35z"
        />
        <path
          fill="none"
          stroke="#fff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.35"
          d="M8.35 12.15 10.75 14.55 15.85 9.1"
        />
      </svg>
      <span className="sr-only">{title}</span>
    </span>
  );
}
