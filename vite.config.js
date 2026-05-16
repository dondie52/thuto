import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Deployed to GitHub Pages at https://dondie52.github.io/thuto/.
// Override with VITE_BASE_PATH=/ when serving from a custom domain (e.g. thuto.bw).
const base = process.env.VITE_BASE_PATH || "/thuto/";
const defaultSiteUrl = base === "/" ? "https://thuto.bw/" : "https://dondie52.github.io/thuto/";
const siteUrl = process.env.VITE_SITE_URL || defaultSiteUrl;
process.env.VITE_SITE_URL = siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`;

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "icons/favicon-16.png",
        "icons/favicon-32.png",
        "icons/apple-touch-icon.png",
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/thuto-logo.png",
        "og-image.png",
      ],
      manifest: {
        name: "Thuto - Botswana University Companion",
        short_name: "Thuto",
        description: "Check programme eligibility, explore universities and courses.",
        theme_color: "#14746e",
        background_color: "#f0fdfa",
        display: "standalone",
        start_url: ".",
        scope: ".",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "icons/apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes("/data/"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "thuto-data",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/\/data\//],
      },
    }),
  ],
});
