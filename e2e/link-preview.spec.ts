import { createPage, expect, test } from "./helpers"

test.use({ storageState: "e2e/.auth/editor.json" })

test("shows an internal link preview with the fallback image", async ({ page }) => {
  const suffix = Date.now()
  const targetPath = `e2e-link-target-${suffix}`
  const sourcePath = `e2e-link-source-${suffix}`
  await createPage(page, targetPath, { title: "リンク先ページ", description: "リンク先の説明です", content: "画像のないページです" })
  await createPage(page, sourcePath, { title: "リンク元ページ", content: `[リンク先](/wiki/${targetPath})` })

  await page.goto(`/wiki/${sourcePath}`)
  await page.getByRole("link", { name: "リンク先", exact: true }).hover()

  const preview = page.getByRole("tooltip")
  await expect(preview).toBeVisible()
  await expect(preview).toContainText("リンク先ページ")
  await expect(preview).toContainText("リンク先の説明です")
  await expect(preview.locator("img")).toHaveAttribute("src", /grassblock/)
})
