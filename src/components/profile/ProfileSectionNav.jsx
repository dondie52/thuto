const sections = [
  { id: "personal-info", label: "Personal info" },
  { id: "security", label: "Security" },
  { id: "subscription", label: "Subscription" },
  { id: "billing", label: "Billing" },
  { id: "notifications", label: "Notifications" },
  { id: "privacy", label: "Privacy" },
  { id: "support", label: "Support" },
  { id: "activity", label: "Activity" },
  { id: "connections", label: "Connections" },
];

export default function ProfileSectionNav({ signedIn }) {
  if (!signedIn) return null;

  return (
    <nav
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Profile sections"
    >
      {sections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className="focus-ring shrink-0 rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-800 transition hover:bg-brand-50"
        >
          {section.label}
        </a>
      ))}
    </nav>
  );
}
