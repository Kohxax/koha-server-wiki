import { expect, test } from "@playwright/test"

test.use({ storageState: "e2e/.auth/editor.json" })

test("shows an internal link preview with the fallback image", async ({ page }) => {
  const suffix = Date.now()
  const targetPath = `e2e-link-target-${suffix}`
  const sourcePath = `e2e-link-source-${suffix}`
  const target = await page.request.put(`/api/pages/${targetPath}`, {
    data: {
      title: "リンク先ページ",
      description: "リンク先の説明です",
      content: "画像のないページです",
      expectedUpdatedAt: null,
    },
  })
  expect(target.ok()).toBeTruthy()

  const source = await page.request.put(`/api/pages/${sourcePath}`, {
    data: {
      title: "リンク元ページ",
      description: "",
      content: `[リンク先](/wiki/${targetPath})`,
      expectedUpdatedAt: null,
    },
  })
  expect(source.ok()).toBeTruthy()

  await page.goto(`/wiki/${sourcePath}`)
  await page.getByRole("link", { name: "リンク先" }).hover()

  const preview = page.getByRole("tooltip")
  await expect(preview).toBeVisible()
  await expect(preview).toContainText("リンク先ページ")
  await expect(preview).toContainText("リンク先の説明です")
  await expect(preview.locator("img")).toHaveAttribute("src", /grassblock/)
})
