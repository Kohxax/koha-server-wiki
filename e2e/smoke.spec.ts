import { expect, test } from "./helpers"

test("homepage loads and dark mode toggle works", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("banner").getByRole("link", { name: "こは鯖wiki" })).toBeVisible()

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
