import process from "node:process"
import { defineConfig, devices } from "@playwright/test"

// playwright.config.ts runs as a plain Node script (unlike `nuxt dev`/`build`,
// which load .env automatically), so TEST_DATABASE_URL wouldn't otherwise be
// visible here.
try {
  process.loadEnvFile(".env")
}
catch {
  // .env may not exist (e.g. in CI where vars are injected directly)
}

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
    //
    // DATABASE_URL is overridden to TEST_DATABASE_URL so E2E runs don't write
    // test/dummy pages into the same database used for local development.
    command: "pnpm db:migrate && pnpm build && pnpm preview",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? "",
    },
  },
})
