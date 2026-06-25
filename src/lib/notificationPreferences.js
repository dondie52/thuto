const STORAGE_KEY = "thuto:notification-preferences";

const DEFAULTS = {
  connectionRequests: true,
  directMessages: true,
  feedActivity: true,
  deadlineReminders: true,
  sponsorshipAlerts: true,
};

/**
 * @returns {typeof DEFAULTS}
 */
export function getNotificationPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

/**
 * @param {Partial<typeof DEFAULTS>} patch
 * @returns {typeof DEFAULTS}
 */
export function saveNotificationPreferences(patch) {
  const next = { ...getNotificationPreferences(), ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export const NOTIFICATION_PREFERENCE_OPTIONS = [
  {
    key: "connectionRequests",
    label: "Connection requests",
    description: "When someone wants to connect with you on the feed.",
  },
  {
    key: "directMessages",
    label: "Direct messages",
    description: "When you receive a new message in your inbox.",
  },
  {
    key: "feedActivity",
    label: "Feed activity",
    description: "Follows, mentions, and other updates from people you follow.",
  },
  {
    key: "deadlineReminders",
    label: "Deadline reminders",
    description: "Application and programme deadline alerts for your shortlist.",
  },
  {
    key: "sponsorshipAlerts",
    label: "Sponsorship alerts",
    description: "DTEF and sponsorship deadline notices for programmes you follow.",
  },
];
