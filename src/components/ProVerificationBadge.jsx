/**
 * Small green verification badge for Pro accounts on the feed.
 */
export default function ProVerificationBadge({ className = "h-4 w-4", title = "Pro verified" }) {
  return (
    <span className="inline-flex shrink-0 align-middle" title={title}>
      <svg className={className} viewBox="0 0 24 24" aria-hidden>
        <path
          fill="#0F766E"
          d="M12 2.25l1.35 2.73 3.02.44-2.18 2.13.52 3.01L12 9.02l-2.7 1.42.52-3.01-2.18-2.13 3.02-.44L12 2.25z"
        />
        <circle cx="12" cy="12" r="5.75" fill="#34D399" />
        <path
          fill="#fff"
          d="M10.15 12.55 8.9 11.3l-1.05 1.05 2.3 2.3 4.9-4.9-1.05-1.05-3.8 3.8z"
        />
      </svg>
      <span className="sr-only">{title}</span>
    </span>
  );
}
