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

test.describe("page management", () => {
  test.use({ storageState: "e2e/.auth/editor.json" })

  test("groups nested pages in folders", async ({ page }) => {
    const folder = `e2e-folder-${Date.now()}`
    const path = `${folder}/child`
    const title = `階層ページ-${folder}`

    const response = await page.request.put(`/api/pages/${path}`, {
      data: { title, description: "", content: "# ページ管理のテスト" },
    })
    expect(response.ok()).toBeTruthy()

    await page.goto("/settings/pages")
    await expect(page.getByText(folder, { exact: true })).toBeVisible()
    const managedPage = page.getByText(title, { exact: true })
    await expect(managedPage).toBeVisible()

    await page.getByRole("button", { name: `${folder}を折りたたむ` }).click()
    await expect(managedPage).toBeHidden()
    await page.getByRole("button", { name: `${folder}を展開する` }).click()
    await expect(managedPage).toBeVisible()
  })

  test("renders the server status MDC component", async ({ page }) => {
    const path = `e2e-server-status-${Date.now()}`
    const address = "127.0.0.1"

    const response = await page.request.put(`/api/pages/${path}`, {
      data: { title: "サーバーステータス", description: "", content: `::server-status{address="${address}"}\n::` },
    })
    expect(response.ok()).toBeTruthy()

    await page.goto(`/wiki/${path}`)
    await expect(page.getByText(address)).toBeVisible()
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
