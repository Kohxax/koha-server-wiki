import { expect, test } from "@playwright/test"

test("homepage loads and dark mode toggle works", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("link", { name: "こは鯖wiki" })).toBeVisible()

  const html = page.locator("html")
  const before = await html.getAttribute("class")
  await page.getByRole("switch", { name: "テーマ切替" }).click()
  await expect
    .poll(async () => html.getAttribute("class"))
    .not.toBe(before)
})

test("mobile sidebar is closed on the first load and can be opened", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")

  const sidebar = page.locator("aside.app-sidebar")
  await expect(sidebar).toHaveClass(/-translate-x-full/)
  await page.getByRole("button", { name: "メニューを開く" }).click()
  await expect(sidebar).toHaveClass(/translate-x-0/)
})

test("login page shows discord and dev login options", async ({ page }) => {
  await page.goto("/login")
  await expect(page.getByRole("link", { name: "Discordでログイン" })).toBeVisible()
  await expect(page.getByRole("button", { name: "editor" })).toBeVisible()
})

test("viewer cannot see edit controls, editor can", async ({ browser }) => {
  const viewerContext = await browser.newContext({ storageState: "e2e/.auth/viewer.json" })
  const viewerPage = await viewerContext.newPage()
  await viewerPage.goto("/")
  await expect(viewerPage.getByRole("link", { name: "編集" })).toHaveCount(0)
  await viewerContext.close()

  const editorContext = await browser.newContext({ storageState: "e2e/.auth/editor.json" })
  const editorPage = await editorContext.newPage()
  await editorPage.goto("/")
  await expect(editorPage.getByRole("link", { name: "作成する" }).or(editorPage.getByRole("link", { name: "編集" }))).toBeVisible()
  await editorContext.close()
})
