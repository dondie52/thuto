import { Link, useLocation, useNavigate } from "react-router-dom";
import { FEED_CHROME_CLASSES } from "../lib/feedChrome.jsx";

function IconRefresh({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 11a8.1 8.1 0 00-15.5-2M4 5v4h4M4 13a8.1 8.1 0 0015.5 2M20 19v-4h-4" />
    </svg>
  );
}

function IconSearch({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" />
    </svg>
  );
}

function IconPeople({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function IconMessages({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 10h8M8 14h5M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

function IconBell({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .53-.21 1.04-.59 1.41L4 17h5m6 0a3 3 0 11-6 0m6 0H9"
      />
    </svg>
  );
}

function NavIconButton({ to, label, isActive, icon, badge = 0, onClick }) {
  const badgeLabel = badge > 99 ? "99+" : String(badge);
  const className = [
    "focus-ring relative flex h-9 w-9 items-center justify-center rounded-full transition-colors",
    isActive ? "bg-brand-700 text-white shadow-sm" : "text-brand-800 hover:bg-brand-100/70",
  ].join(" ");

  const content = (
    <>
      {icon}
      {badge > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
          {badgeLabel}
        </span>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className} aria-label={label} aria-current={isActive ? "page" : undefined}>
        {content}
      </button>
    );
  }

  return (
    <Link to={to} className={className} aria-label={label} aria-current={isActive ? "page" : undefined}>
      {content}
    </Link>
  );
}

/**
 * @param {{ embedded?: boolean, onRefresh?: () => void, messageCount?: number, notificationCount?: number }} props
 */
export default function FeedTopBar({ embedded = false, onRefresh, messageCount = 0, notificationCount = 0 }) {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname.replace(/\/$/, "");
  const isFeedHome = path === "/feed";

  function handleHomeRefresh() {
    if (isFeedHome && onRefresh) {
      onRefresh();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    navigate("/feed");
  }

  return (
    <section
      className={
        embedded
          ? "feed-top-bar -mx-4 px-4 pb-1 pt-0.5"
          : `feed-top-bar border-b border-brand-100/80 px-4 py-1.5 ${FEED_CHROME_CLASSES}`
      }
      aria-label="Feed actions"
    >
      <div className="flex items-center justify-between">
        <NavIconButton
          label={isFeedHome ? "Refresh feed" : "Back to feed"}
          isActive={isFeedHome}
          icon={<IconRefresh />}
          onClick={handleHomeRefresh}
        />
        <NavIconButton to="/feed/people" label="People" isActive={path.startsWith("/feed/people")} icon={<IconPeople />} />
        <NavIconButton
          to="/feed/messages"
          label="Messages"
          isActive={path.startsWith("/feed/messages")}
          icon={<IconMessages />}
          badge={messageCount}
        />
        <NavIconButton
          to="/feed/notifications"
          label="Notifications"
          isActive={path.startsWith("/feed/notifications")}
          icon={<IconBell />}
          badge={notificationCount}
        />
        <NavIconButton to="/feed/search" label="Search feed" isActive={path.startsWith("/feed/search")} icon={<IconSearch />} />
      </div>
    </section>
  );
}
