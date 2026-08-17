/**
 * Shared line-icon set for Thuto navigation surfaces (account drawer, desktop side rail).
 * Icon keys match the `icon` field on the link constants in `src/lib/toolNavLinks.js`.
 */
const ICONS = {
  home: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
    />
  ),
  predictor: <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 16l4-4 4 4 6-6" />,
  feed: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 7-7 11-7-11 7-7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 10l2.5-2.5L14.5 10 12 13.5 9.5 10z" />
    </>
  ),
  assistant: (
    <>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 5.5A3.5 3.5 0 017.5 2h9A3.5 3.5 0 0120 5.5v6A3.5 3.5 0 0116.5 15H10l-4.5 4v-4A3.5 3.5 0 014 11.5v-6z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6M9 10.5h4" />
    </>
  ),
  profile: <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 100-8 4 4 0 000 8zM4.5 21a7.5 7.5 0 0115 0" />,
  programmes: <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />,
  universities: <path strokeLinecap="round" strokeLinejoin="round" d="M4 10l8-5 8 5M5.5 10h13M7 10v8M12 10v8M17 10v8M4.5 18h15M3.5 21h17" />,
  sponsorships: <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M16 7.5a3.5 3.5 0 00-3.5-2H10a3 3 0 000 6h4a3 3 0 010 6h-2.5a3.5 3.5 0 01-3.5-2" />,
  postgraduate: <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zM12 14l6.33-3.516M12 14l-6.33-3.516M12 14v7" />,
  applications: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l1.5 1.5L15 9.75M8.25 4.5h7.5a2.25 2.25 0 012.25 2.25v11.25a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25V9.75a2.25 2.25 0 01.659-1.591l3.909-3.91a1.5 1.5 0 011.06-.44l.121.001z" />,
  saved: <path strokeLinecap="round" strokeLinejoin="round" d="M6 4.75A2.75 2.75 0 018.75 2h6.5A2.75 2.75 0 0118 4.75V21l-6-3.5L6 21V4.75z" />,
  compare: <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M4 8h6M14 8h6M5 8l2 5 2-5M15 8l2 5 2-5" />,
  fit: <path strokeLinecap="round" strokeLinejoin="round" d="M10.75 18.5a7.75 7.75 0 117.75-7.75 7.75 7.75 0 01-7.75 7.75zM16.5 16.5L21 21M8.5 10.75l1.5 1.5 3.25-3.5" />,
  partners: <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />,
  admin: <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5.4c0 4.5-2.9 8.5-7 9.6-4.1-1.1-7-5.1-7-9.6V6l7-3zM9.5 12.5l1.7 1.7 3.6-4" />,
  moderation: <path strokeLinecap="round" strokeLinejoin="round" d="M5 5.5A2.5 2.5 0 017.5 3h9A2.5 2.5 0 0119 5.5v13L15.5 16h-8A2.5 2.5 0 015 13.5v-8zM8.5 8h7M8.5 11.5h4M15 11l1 1 2-2" />,
  settings: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25A3.75 3.75 0 1112 15.75 3.75 3.75 0 0112 8.25zM19 12a7.2 7.2 0 00-.08-1l2-1.55-2-3.46-2.35.94a7.65 7.65 0 00-1.73-1L14.5 3h-5l-.34 2.93a7.65 7.65 0 00-1.73 1L5.08 5.99l-2 3.46 2 1.55a7.2 7.2 0 000 2l-2 1.55 2 3.46 2.35-.94a7.65 7.65 0 001.73 1L9.5 21h5l.34-2.93a7.65 7.65 0 001.73-1l2.35.94 2-3.46-2-1.55c.05-.33.08-.66.08-1z" />,
  support: <path strokeLinecap="round" strokeLinejoin="round" d="M5 5.5A3.5 3.5 0 018.5 2h7A3.5 3.5 0 0119 5.5v5A3.5 3.5 0 0115.5 14H11l-5 5v-5.25A3.5 3.5 0 015 10.5v-5zM9 7h6M9 10h4" />,
  center: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
    />
  ),
};

/**
 * @param {{ name: string, className?: string }} props
 */
export default function ToolIcon({ name, className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      {ICONS[name]}
    </svg>
  );
}
