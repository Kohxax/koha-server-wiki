import { expect, test } from "@playwright/test"

test.describe("settings dashboard", () => {
  test.use({ storageState: "e2e/.auth/editor.json" })

  test("editor can open the dashboard without user management", async ({ page }) => {
    await page.goto("/settings")
    await expect(page.getByRole("heading", { name: "管理ダッシュボード" })).toBeVisible()
    await expect(page.getByRole("navigation", { name: "設定メニュー" }).getByText("ユーザー管理")).toHaveCount(0)
  })
})

test.describe("admin users", () => {
  test.use({ storageState: "e2e/.auth/admin.json" })

  test("admin promotes viewer to editor", async ({ page }) => {
    await page.goto("/settings/users")
    await expect(page.getByRole("heading", { name: "ユーザー管理" })).toBeVisible()

    const viewerRow = page.getByRole("row", { name: /dev-viewer/ })
    await viewerRow.getByRole("button", { name: "viewer" }).click()
    await viewerRow.getByRole("menuitemradio", { name: "editor" }).click()
    await expect(viewerRow.getByRole("button", { name: "editor" })).toBeVisible()
  })
})

test.describe("non-admin access", () => {
  test.use({ storageState: "e2e/.auth/viewer.json" })

  test("viewer is redirected away from /settings/users", async ({ page }) => {
    await page.goto("/settings/users")
    await expect(page).not.toHaveURL(/\/settings\/users/)
  })
})

test.describe("editor (non-admin) access", () => {
  test.use({ storageState: "e2e/.auth/editor.json" })

  test("editor cannot reach /settings/users but can reach /settings/sidebar", async ({ page }) => {
    await page.goto("/settings/users")
    await expect(page).not.toHaveURL(/\/settings\/users/)

    await page.goto("/settings/sidebar")
    await expect(page.getByRole("heading", { name: "サイドバー設定" })).toBeVisible()
  })
})

test.describe("manual sidebar editing", () => {
  test.use({ storageState: "e2e/.auth/editor.json" })

  test("manual tree edits persist across auto/manual mode switches", async ({ page }) => {
    await page.goto("/settings/sidebar")

    await page.getByRole("button", { name: "手動" }).click()
    await page.getByRole("button", { name: "見出しを追加" }).click()

    const label = `テスト見出し${Date.now()}`
    const lastInput = page.locator("li input:not([disabled])").last()
    await lastInput.fill(label)
    await page.getByRole("button", { name: "保存" }).click()
    await expect(page.locator("aside").getByText(label)).toBeVisible()

    await page.goto("/")
    await expect(page.getByText(label)).toBeVisible()

    await page.goto("/settings/sidebar")
    await page.getByRole("button", { name: "自動" }).click()
    await page.getByRole("button", { name: "手動" }).click()

    const restoredValues = await page.locator("li input").evaluateAll(
      els => els.map(el => (el as HTMLInputElement).value),
    )
    expect(restoredValues).toContain(label)
  })
})
