import { useCallback, useEffect, useState } from "react";

export const PROFILE_TABS = [
  { id: "about", label: "About" },
  { id: "activity", label: "Activity" },
  { id: "connections", label: "Connections" },
  { id: "privacy", label: "Privacy" },
  { id: "billing", label: "Billing" },
  { id: "settings", label: "Settings" },
];

const TAB_IDS = new Set(PROFILE_TABS.map((tab) => tab.id));

function readTabFromHash() {
  const hash = window.location.hash.replace(/^#/, "");
  return TAB_IDS.has(hash) ? hash : "about";
}

export function useProfileTab() {
  const [activeTab, setActiveTabState] = useState(readTabFromHash);

  const setActiveTab = useCallback((tabId) => {
    if (!TAB_IDS.has(tabId)) return;
    setActiveTabState(tabId);
    const nextHash = `#${tabId}`;
    if (window.location.hash !== nextHash) {
      const { pathname, search } = window.location;
      window.history.replaceState(null, "", `${pathname}${search}${nextHash}`);
    }
  }, []);

  useEffect(() => {
    function syncFromHash() {
      setActiveTabState(readTabFromHash());
    }
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  return [activeTab, setActiveTab];
}

/**
 * @param {{
 *   activeTab: string,
 *   onTabChange: (tabId: string) => void,
 *   signedIn: boolean,
 * }} props
 */
export default function ProfileSectionNav({ activeTab, onTabChange, signedIn }) {
  if (!signedIn) return null;

  return (
    <nav
      className="-mx-4 flex gap-0 overflow-x-auto border-b border-stone-200/70 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Profile sections"
    >
      {PROFILE_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={[
              "focus-ring shrink-0 border-b-2 px-3 py-2.5 text-xs font-semibold transition sm:px-4 sm:text-sm",
              isActive
                ? "border-brand-700 text-brand-800"
                : "border-transparent text-stone-500 hover:border-stone-200 hover:text-brand-800",
            ].join(" ")}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
