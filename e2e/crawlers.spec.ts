import { expect, test } from "@playwright/test"

test.use({ storageState: "e2e/.auth/editor.json" })

test("public pages provide crawler metadata and sitemap entries", async ({ page }) => {
  const path = `e2e-crawler-${Date.now()}`
  const response = await page.request.put(`/api/pages/${path}`, {
    data: { title: "クローラー確認", description: "ページの説明", content: "# 公開ページ", expectedUpdatedAt: null },
  })
  expect(response.ok()).toBeTruthy()

  await page.goto(`/wiki/${path}`)
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "クローラー確認")
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", "ページの説明")
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /http:\/\/localhost:3000\/_nuxt\//)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `http://localhost:3000/wiki/${path}`)

  const robots = await page.request.get("/robots.txt")
  expect(robots.ok()).toBeTruthy()
  expect(await robots.text()).toMatch(/Sitemap: http:\/\/localhost:3000\/sitemap\.xml/)

  const sitemap = await page.request.get("/sitemap.xml")
  expect(sitemap.ok()).toBeTruthy()
  expect(await sitemap.text()).toContain(`<loc>http://localhost:3000/wiki/${path}</loc>`)
})

test("private pages are excluded from indexing", async ({ page }) => {
  await page.goto("/login")
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow")
})
