import { expect, test } from "@playwright/test"

test.use({ storageState: "e2e/.auth/editor.json" })

// draw.io itself is a third-party iframe; per PLAN.md this E2E only verifies the
// dialog opens and the iframe loads the expected embed.diagrams.net URL. The actual
// postMessage save flow is covered by shared/utils/drawio.test.ts (unit) and manual
// verification steps documented in README.md.
test("diagram button opens the draw.io dialog with the embed iframe", async ({ page }) => {
  const path = `e2e-drawio-${Date.now()}`

  await page.goto(`/edit/${path}`)
  await page.getByLabel("タイトル").fill("図表テスト")
  await page.getByTitle("図表").click()

  const iframe = page.frameLocator("iframe[title=\"draw.io editor\"]")
  await expect(page.locator("iframe[title=\"draw.io editor\"]")).toHaveAttribute(
    "src",
    /^https:\/\/embed\.diagrams\.net\/\?embed=1&proto=json/,
  )
  // give the third-party iframe a chance to start loading; do not assert on its internals
  await iframe.locator("body").waitFor({ state: "attached", timeout: 15_000 }).catch(() => {})
})
