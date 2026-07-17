import { expect, test } from "@playwright/test"

test.use({ storageState: "e2e/.auth/editor.json" })

test("create, edit with live preview, and save", async ({ page }) => {
  const path = `e2e-test-${Date.now()}`

  await page.goto("/new")
  await page.getByLabel("パス").fill(path)
  await page.getByRole("button", { name: "次へ" }).click()

  await expect(page).toHaveURL(`/edit/${path}`)
  await page.getByLabel("タイトル").fill("E2Eテストページ")
  await page.locator("textarea").first().fill("# 最初の内容\n\n## H2見出し\n\n### H3見出し\n\n#### H4見出し")

  // The preview must be replaced with the current input, rather than showing a stale parse result.
  await expect(page.getByRole("heading", { name: "最初の内容" })).toBeVisible()

  await page.getByRole("button", { name: "保存" }).click()
  await expect(page).toHaveURL(`/wiki/${path}`)
  await expect(page.getByRole("heading", { name: "E2Eテストページ" })).toBeVisible()
  await expect(page.getByRole("link", { name: "H2見出し" })).toBeVisible()
  await expect(page.getByRole("link", { name: "H3見出し" })).toBeVisible()
  await expect(page.getByRole("link", { name: "H4見出し" })).toBeVisible()

  await page.getByRole("link", { name: "H3見出し" }).click()
  await expect(page).toHaveURL(new RegExp(`${path}#h3`))

  await page.getByRole("link", { name: "編集" }).click()
  await expect(page).toHaveURL(`/edit/${path}`)
  await page.locator("textarea").first().fill("# 更新後の内容")
  await page.getByRole("button", { name: "保存" }).click()
  await expect(page).toHaveURL(`/wiki/${path}`)
})

test("image insertion updates the editor preview", async ({ page }) => {
  const path = `e2e-image-${Date.now()}`
  const imageName = `preview-${Date.now()}.svg`
  const upload = await page.request.post("/api/media", {
    multipart: {
      file: {
        name: imageName,
        mimeType: "image/svg+xml",
        buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>'),
      },
    },
  })
  expect(upload.ok()).toBeTruthy()

  await page.goto(`/edit/${path}`)
  await page.getByTitle("画像").click()
  await page.getByTitle(imageName).click()

  await expect(page.locator("textarea")).toHaveValue(new RegExp(`!\\[${imageName}\\]`))
  await expect(page.getByRole("dialog")).toBeHidden()
  await expect(page.locator(`img[alt="${imageName}"]`)).toBeVisible()
})

test("desktop editor shows frontmatter, Markdown, and preview side by side", async ({ page }) => {
  await page.goto(`/edit/e2e-desktop-${Date.now()}`)

  await expect(page.getByLabel("タイトル")).toBeVisible()
  await expect(page.locator("#editor-panel")).toBeVisible()
  await expect(page.locator("#preview-panel")).toBeVisible()
})

test("editor tabs fit the viewport and work on mobile", async ({ page }) => {
  const path = `e2e-mobile-${Date.now()}`

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/edit/${path}`)
  await page.locator("aside").getByRole("button", { name: "サイドバーを閉じる" }).click({ force: true })

  await expect(page.getByRole("tab")).toHaveCount(3)
  await page.getByRole("tab", { name: "フロントマター" }).click()
  await page.getByLabel("タイトル").fill("モバイル編集")

  await page.getByRole("tab", { name: "Markdown" }).click()
  const textarea = page.locator("textarea").first()
  const editorScroller = textarea.locator("xpath=..")
  await textarea.fill("# モバイルの内容")
  await expect(textarea).toBeVisible()
  await expect.poll(() => editorScroller.evaluate((element) => element.getBoundingClientRect().bottom <= window.innerHeight)).toBeTruthy()
  await expect.poll(() => editorScroller.evaluate((element) => {
    element.scrollTop = element.scrollHeight
    return element.scrollTop > 0
  })).toBeTruthy()

  await page.getByRole("tab", { name: "プレビュー" }).click()
  await expect(page.getByRole("heading", { name: "モバイルの内容" })).toBeVisible()
})
