import { defineConfig, devices } from "@playwright/test";

export const backendServer = {
  command: "cd ../cinetable-be && set -a && . ./.env.e2e && set +a && npx prisma migrate deploy && node dist/src/main.js",
  url: "http://localhost:5055/docs/json",
  reuseExistingServer: !process.env.CI,
  timeout: 120_000,
};

// Backend e frontend dedicati agli e2e (porte 5055/3055, DB cinetable_e2e): i test condividono il DB, quindi un solo worker.
export default defineConfig({
  testDir: "e2e",
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  // sipario e comparse spenti: li provano curtain.spec.ts e gli spec della busta, che tornano a "no-preference"
  use: { baseURL: "http://localhost:3055", trace: "retain-on-failure", reducedMotion: "reduce" },
  projects: [{ name: "iphone", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } }],
  webServer: [
    backendServer,
    {
      command: "npx next dev -p 3055",
      url: "http://localhost:3055",
      env: { BACKEND_URL: "http://localhost:5055", NEXT_DIST_DIR: ".next-e2e" },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
