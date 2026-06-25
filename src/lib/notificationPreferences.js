const STORAGE_KEY = "thuto.notificationPreferences";

const DEFAULTS = {
  feedReplies: true,
  feedMentions: true,
  feedFollows: true,
  deadlinePush: false,
  deadlineSms: false,
  deadlineWhatsapp: false,
  sponsorshipPush: false,
};

export const NOTIFICATION_PREFERENCE_OPTIONS = [
  {
    key: "feedReplies",
    label: "Replies to your posts",
    description: "When someone replies to a post you authored.",
  },
  {
    key: "feedMentions",
    label: "Mentions",
    description: "When someone mentions you in a post or comment.",
  },
  {
    key: "feedFollows",
    label: "New followers",
    description: "When someone follows your profile.",
  },
];

export const PRO_ALERT_OPTIONS = [
  {
    key: "deadlinePush",
    label: "Application deadline push alerts",
    description: "Pro: browser push reminders for saved programmes (coming soon).",
    proOnly: true,
  },
  {
    key: "deadlineSms",
    label: "SMS deadline alerts",
    description: "Pro: SMS reminders during application season (coming soon).",
    proOnly: true,
  },
  {
    key: "deadlineWhatsapp",
    label: "WhatsApp deadline alerts",
    description: "Pro: WhatsApp reminders for key deadlines (coming soon).",
    proOnly: true,
  },
  {
    key: "sponsorshipPush",
    label: "Sponsorship opportunities",
    description: "Pro: alerts when new sponsorship posts match your interests.",
    proOnly: true,
  },
];

/**
 * @returns {typeof DEFAULTS}
 */
export function getNotificationPreferences() {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

/**
 * @param {Partial<typeof DEFAULTS>} patch
 */
export function saveNotificationPreferences(patch) {
  const next = { ...getNotificationPreferences(), ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export { STORAGE_KEY };
