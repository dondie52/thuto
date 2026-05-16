export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;
export const FPS = 30;
export const DURATION_IN_FRAMES = 1200;

export const scenes = {
  hero: { from: 0, duration: 180 },
  problem: { from: 180, duration: 180 },
  howItWorks: { from: 360, duration: 240 },
  features: { from: 600, duration: 220 },
  examples: { from: 820, duration: 210 },
  cta: { from: 1030, duration: 170 },
} as const;

export const colors = {
  navy: "#081527",
  deepNavy: "#050B16",
  teal: "#0F8B7F",
  lightTeal: "#BFF3EA",
  softMint: "#EAFBF7",
  offWhite: "#F8F7F2",
  white: "#FFFFFF",
  mutedText: "#536179",
  cardBorder: "#E3E8EF",
} as const;

export const fonts = {
  heading: 'Georgia, "Times New Roman", serif',
  body: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;

export const layout = {
  safeX: 72,
  top: 128,
  bottom: 104,
  radius: 34,
} as const;

export const cardShadow = "0 28px 70px rgba(8, 21, 39, 0.11)";
