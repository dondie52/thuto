import { fileURLToPath } from "node:url";
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
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        cms: fileURLToPath(new URL("./cms/index.html", import.meta.url)),
      },
    },
  },
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
        "icons/icon-192-maskable.png",
        "icons/icon-512-maskable.png",
        "icons/thuto-mark.svg",
        "icons/tef-portal-mark.svg",
        "og-image.png",
        "sponsorship/dtef-card-background.jpg",
        "programme-themes/*.jpg",
      ],
      manifest: {
        name: "Thuto - Botswana Tertiary Companion",
        short_name: "Thuto",
        description: "Check programme eligibility, explore universities and courses.",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: ".",
        scope: ".",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-192-maskable.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "icons/apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,jpg,svg,woff2}"],
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
        // Keep the student SPA fallback from swallowing the separate CMS frontend.
        navigateFallbackDenylist: [/\/data\//, /\/cms(?:\/|$)/],
      },
    }),
  ],
});
