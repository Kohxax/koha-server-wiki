import process from "node:process"
import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "setup", testMatch: /global\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    // Run against a production build rather than `nuxt dev`: dev-mode hydration
    // (HMR/DevTools overhead) can lag noticeably behind the SSR-rendered HTML,
    // so Playwright's actionability checks see a "ready" button before Vue has
    // actually attached its click handler, causing clicks to be silently lost.
    command: "pnpm build && pnpm preview",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
