import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const env =
  (globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  }).process?.env ?? {};

const basePath = env.VITE_BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    VitePWA({
      injectRegister: false,
      includeManifestIcons: false,
      registerType: "prompt",
      strategies: "generateSW",
      manifest: {
        name: "Rust Daily",
        short_name: "Rust Daily",
        description:
          "Practice idiomatic Rust with short daily coding exercises covering ownership, traits, error handling, iterators, lifetimes, and API design.",
        theme_color: "#111412",
        background_color: "#111412",
        display: "standalone",
        start_url: "./",
        scope: "./",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ["**/*.{js,css,html,png,svg}"],
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) =>
              request.method === "GET" &&
              url.origin === self.location.origin &&
              ["font", "image", "manifest", "script", "style", "worker"].includes(
                request.destination,
              ),
            handler: "CacheFirst",
            options: {
              cacheName: "rust-daily-static-assets",
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: ({ request, url }) =>
              request.method === "GET" &&
              url.origin === self.location.origin &&
              url.pathname.includes("/content/lessons/") &&
              url.pathname.endsWith(".json"),
            handler: "NetworkFirst",
            options: {
              cacheName: "rust-daily-lesson-content",
              networkTimeoutSeconds: 3,
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
        ],
      },
    }),
  ],
});
