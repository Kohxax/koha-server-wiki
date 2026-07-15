import { expect, test } from "@playwright/test"

test.describe("admin users", () => {
  test.use({ storageState: "e2e/.auth/admin.json" })

  test("admin promotes viewer to editor", async ({ page }) => {
    await page.goto("/admin/users")
    await expect(page.getByRole("heading", { name: "ユーザー管理" })).toBeVisible()

    const viewerRow = page.getByRole("row", { name: /dev-viewer/ })
    await viewerRow.getByRole("button", { name: "viewer" }).click()
    await viewerRow.getByRole("menuitemradio", { name: "editor" }).click()
    await expect(viewerRow.getByRole("button", { name: "editor" })).toBeVisible()
  })
})

test.describe("non-admin access", () => {
  test.use({ storageState: "e2e/.auth/viewer.json" })

  test("viewer is redirected away from /admin/users", async ({ page }) => {
    await page.goto("/admin/users")
    await expect(page).not.toHaveURL(/\/admin\/users/)
  })
})

test.describe("editor (non-admin) access", () => {
  test.use({ storageState: "e2e/.auth/editor.json" })

  test("editor cannot reach /admin/users but can reach /admin/sidebar", async ({ page }) => {
    await page.goto("/admin/users")
    await expect(page).not.toHaveURL(/\/admin\/users/)

    await page.goto("/admin/sidebar")
    await expect(page.getByRole("heading", { name: "サイドバー設定" })).toBeVisible()
  })
})

test.describe("manual sidebar editing", () => {
  test.use({ storageState: "e2e/.auth/editor.json" })

  test("manual tree edits persist across auto/manual mode switches", async ({ page }) => {
    await page.goto("/admin/sidebar")

    await page.getByRole("button", { name: "手動" }).click()
    await page.getByRole("button", { name: "見出しを追加" }).click()

    const label = `テスト見出し${Date.now()}`
    const lastInput = page.locator("li input").last()
    await lastInput.fill(label)
    await page.getByRole("button", { name: "保存" }).click()

    await page.goto("/")
    await expect(page.getByText(label)).toBeVisible()

    await page.goto("/admin/sidebar")
    await page.getByRole("button", { name: "自動" }).click()
    await page.getByRole("button", { name: "手動" }).click()

    const restoredValues = await page.locator("li input").evaluateAll(
      els => els.map(el => (el as HTMLInputElement).value),
    )
    expect(restoredValues).toContain(label)
  })
})
