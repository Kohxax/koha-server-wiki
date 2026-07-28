import { createPage, expect, test, uploadSvg } from "./helpers"

// canEdit/canAdmin's truth table is covered by shared/utils/permissions.test.ts.
// These tests only cover what a unit test can't: that the server actually
// enforces those rules - via the client-side route middleware (redirect)
// and via the API layer (403) - which are two independent code paths, so
// each gets at least one test. UI-visibility duplicates of the same truth
// table (e.g. hiding a nav link, hiding an edit button) are intentionally
// not re-tested here.
test.describe("access control", () => {
  test.describe("viewer", () => {
    test.use({ storageState: "e2e/.auth/viewer.json" })

    test("middleware redirects away from an admin-only route", async ({ page }) => {
      await page.goto("/settings/users")
      await expect(page).not.toHaveURL(/\/settings\/users/)
    })

    test("API rejects a write with 403", async ({ page }) => {
      const response = await page.request.put(`/api/pages/e2e-403-${Date.now()}`, {
        data: { title: "権限テスト", description: "", content: "# 権限テスト", expectedUpdatedAt: null },
      })
      expect(response.status()).toBe(403)
    })
  })

  test.describe("editor", () => {
    test.use({ storageState: "e2e/.auth/editor.json" })

    test("middleware redirects away from an admin-only route but allows an editor route", async ({ page }) => {
      await page.goto("/settings/users")
      await expect(page).not.toHaveURL(/\/settings\/users/)

      await page.goto("/settings/sidebar")
      await expect(page.getByRole("heading", { name: "サイドバー設定" })).toBeVisible()
    })
  })
})

test.describe("admin users", () => {
  test.use({ storageState: "e2e/.auth/admin.json" })

  test("admin promotes viewer to editor", async ({ page }) => {
    await page.goto("/settings/users")
    await expect(page.getByRole("heading", { name: "ユーザー管理" })).toBeVisible()

    const viewerRow = page.getByRole("row", { name: /dev-viewer/ })
    await viewerRow.getByRole("button", { name: "viewer" }).click()
    await page.getByRole("menuitemradio", { name: "editor" }).click()
    await expect(viewerRow.getByRole("button", { name: "editor" })).toBeVisible()
  })
})

test.describe("page management", () => {
  test.use({ storageState: "e2e/.auth/editor.json" })

  test("groups nested pages in folders", async ({ page }) => {
    const folder = `e2e-folder-${Date.now()}`
    const path = `${folder}/child`
    const title = `階層ページ-${folder}`

    await createPage(page, path, { title, content: "# ページ管理のテスト" })

    await page.goto("/settings/pages")
    await expect(page.getByText(folder, { exact: true })).toBeVisible()
    const managedPage = page.getByText(title, { exact: true })
    await expect(managedPage).toBeVisible()

    await page.getByRole("button", { name: `${folder}を折りたたむ` }).click()
    await expect(managedPage).toBeHidden()
    await page.getByRole("button", { name: `${folder}を展開する` }).click()
    await expect(managedPage).toBeVisible()
  })

  test("filters pages by title and keeps matching nested pages visible", async ({ page }) => {
    const folder = `e2e-manage-${Date.now()}`
    const path = `${folder}/child`
    const title = `検索対象-${folder}`

    await createPage(page, path, { title, content: "# 検索テスト" })

    await page.goto("/settings/pages")
    await page.getByRole("searchbox", { name: "ページを検索" }).fill(title)
    await expect(page.getByText(folder, { exact: true })).toBeVisible()
    await expect(page.getByText(title, { exact: true })).toBeVisible()
    await expect(page.getByText("該当するページがありません")).toBeHidden()
  })

  test("keeps the edit link in the desktop right sidebar", async ({ page }) => {
    const path = `e2e-right-sidebar-${Date.now()}`
    await createPage(page, path, { title: "右サイドバーのテスト", content: "# 右サイドバー" })

    await page.goto(`/wiki/${path}`)
    const editLink = page.locator("main aside").getByRole("link", { name: "編集" })
    await expect(editLink).toHaveAttribute("href", `/edit/${path}`)
    // The article/aside pairing is meant to render side by side on desktop
    // via a two-column grid (`lg:col-start-1` / `lg:col-start-2`); assert
    // those placement classes plus visibility instead of comparing measured
    // x/y bounding boxes.
    await expect(page.locator("main article")).toBeVisible()
    await expect(page.locator("main article")).toHaveClass(/\blg:col-start-1\b/)
    await expect(page.locator("main aside")).toBeVisible()
    await expect(page.locator("main aside")).toHaveClass(/\blg:col-start-2\b/)
  })

  test("renders the server status MDC component", async ({ page }) => {
    const path = `e2e-server-status-${Date.now()}`
    const address = "127.0.0.1"

    await createPage(page, path, { title: "サーバーステータス", content: `::server-status{address="${address}"}\n::` })

    await page.goto(`/wiki/${path}`)
    await expect(page.getByText(address)).toBeVisible()
  })

  test("renders the recent pages MDC component", async ({ page }) => {
    const path = `e2e-recent-pages-${Date.now()}`
    const title = `最近更新MDC-${path}`

    await createPage(page, path, { title, content: "::recent-pages{limit=\"5\"}\n::" })

    await page.goto(`/wiki/${path}`)
    await expect(page.getByRole("heading", { name: "最近更新されたページ" })).toBeVisible()
    await expect(page.getByLabel("最近更新されたページ").getByRole("link", { name: title })).toHaveAttribute("href", `/wiki/${path}`)
  })
})

test.describe("media management", () => {
  test.use({ storageState: "e2e/.auth/editor.json" })

  test("opens the image viewer and warns before deleting a referenced image", async ({ page }) => {
    const imageName = `media-manager-${Date.now()}.svg`
    const media = await uploadSvg(page, imageName)

    const path = `e2e-media-reference-${Date.now()}`
    await createPage(page, path, { title: "メディア参照ページ", content: `![${imageName}](/uploads/${media.filename})` })

    await page.goto("/settings/media")
    const card = page.locator('[data-slot="card"]').filter({ has: page.getByRole("button", { name: `画像を拡大: ${imageName}` }) })
    const viewer = page.getByRole("dialog")
    await card.getByRole("button", { name: `画像を拡大: ${imageName}` }).click()
    await expect(viewer).toBeVisible()
    await page.getByRole("button", { name: "閉じる" }).click()

    await card.getByRole("button", { name: "削除" }).click()
    const warning = page.getByRole("dialog").filter({ has: page.getByRole("heading", { name: "使用中のメディアです" }) })
    await expect(warning).toBeVisible()
    await expect(warning.getByRole("link", { name: "メディア参照ページ" })).toHaveAttribute("href", `/wiki/${path}`)
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

    await page.goto("/")
    await expect(page.locator("aside").getByText(label)).toBeVisible()

    await page.goto("/settings/sidebar")
    await page.getByRole("button", { name: "自動" }).click()
    await page.getByRole("button", { name: "手動" }).click()

    const restoredValues = await page.locator("li input").evaluateAll(
      els => els.map(el => (el as HTMLInputElement).value),
    )
    expect(restoredValues).toContain(label)
  })
})
