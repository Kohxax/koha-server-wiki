import { expect, test } from "@playwright/test"

test.use({ storageState: "e2e/.auth/editor.json" })

test("create, edit with live preview, save, and view history", async ({ page }) => {
  const path = `e2e-test-${Date.now()}`

  await page.goto("/new")
  await page.getByLabel("パス").fill(path)
  await page.getByRole("button", { name: "次へ" }).click()

  await expect(page).toHaveURL(`/edit/${path}`)
  await page.getByLabel("タイトル").fill("E2Eテストページ")
  await page.locator("textarea").first().fill("# 最初の内容")

  // debounced (300ms) preview pane, always visible side-by-side on desktop viewports
  await expect(page.getByRole("heading", { name: "最初の内容" })).toBeVisible()

  await page.getByRole("button", { name: "保存" }).click()
  await expect(page).toHaveURL(`/wiki/${path}`)
  await expect(page.getByRole("heading", { name: "E2Eテストページ" })).toBeVisible()

  await page.getByRole("link", { name: "編集" }).click()
  await expect(page).toHaveURL(`/edit/${path}`)
  await page.locator("textarea").first().fill("# 更新後の内容")
  await page.getByRole("button", { name: "保存" }).click()
  await expect(page).toHaveURL(`/wiki/${path}`)

  await page.getByRole("link", { name: "履歴" }).click()
  await expect(page).toHaveURL(`/history/${path}`)
  await expect(page.getByText("現在の版")).toBeVisible()
  const revisionCount = await page.locator("li").filter({ hasText: "E2Eテストページ" }).count()
  expect(revisionCount).toBeGreaterThanOrEqual(1)
})
