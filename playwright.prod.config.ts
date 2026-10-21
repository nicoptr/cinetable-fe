import { defineConfig, devices } from "@playwright/test";
import base, { backendServer } from "./playwright.config";

// Smoke contro la build di production (`next build && next start`, porta 3056) e lo stesso backend e2e (5055).
export default defineConfig({
  ...base,
  testDir: "e2e-prod",
  use: { ...base.use, baseURL: "http://localhost:3056" },
  projects: [{ name: "iphone-prod", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } }],
  webServer: [
    backendServer,
    {
      command: "npx next build && npx next start -p 3056",
      url: "http://localhost:3056",
      env: { BACKEND_URL: "http://localhost:5055", NEXT_PUBLIC_SITE_URL: "http://localhost:3056" },
      reuseExistingServer: false,
      timeout: 300_000,
    },
  ],
});
