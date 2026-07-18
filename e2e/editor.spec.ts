import { expect, test } from "@playwright/test"

test.use({ storageState: "e2e/.auth/editor.json" })

function markdownEditor(page: import("@playwright/test").Page) {
  return page.getByPlaceholder("Markdownで本文を入力")
}

test("create, edit with live preview, and save", async ({ page }) => {
  const path = `e2e-test-${Date.now()}`

  await page.goto("/new")
  await page.getByLabel("パス").fill(path)
  await page.getByRole("button", { name: "次へ" }).click()

  await expect(page).toHaveURL(`/edit/${path}`)
  await page.getByLabel("タイトル").fill("E2Eテストページ")
  await markdownEditor(page).fill("# 最初の内容\n\n## H2見出し\n\n### H3見出し\n\n#### H4見出し")

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
  await markdownEditor(page).fill("# 更新後の内容")
  await page.getByRole("button", { name: "保存" }).click()
  await expect(page).toHaveURL(`/wiki/${path}`)
})

test("Ctrl+S saves without leaving the editor", async ({ page }) => {
  const path = `e2e-shortcut-save-${Date.now()}`

  await page.goto(`/edit/${path}`)
  await page.getByLabel("タイトル").fill("ショートカット保存")
  await markdownEditor(page).fill("# 保存済みの内容")
  await page.keyboard.press("Control+s")

  await expect(page).toHaveURL(`/edit/${path}`)
  await expect(page.getByText("未保存の変更があります")).toBeHidden()
  await page.reload()
  await expect(page.getByLabel("タイトル")).toHaveValue("ショートカット保存")
  await expect(markdownEditor(page)).toHaveValue("# 保存済みの内容")
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
  const media = await upload.json() as { filename: string }

  await page.goto(`/edit/${path}`)
  await page.getByTitle("画像").click()
  await page.getByTitle(imageName).click()

  await expect(markdownEditor(page)).toHaveValue(`![](/uploads/${media.filename})`)
  await expect(page.getByRole("dialog")).toBeHidden()
  await expect(page.locator('#preview-panel img[alt=""]')).toBeVisible()
})

test("article images open in the viewer", async ({ page }) => {
  const path = `e2e-image-viewer-${Date.now()}`
  const imageNames = [`viewer-first-${Date.now()}.svg`, `viewer-second-${Date.now()}.svg`]
  const media = await Promise.all(imageNames.map(async (imageName) => {
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
    return await upload.json() as { filename: string }
  }))

  const save = await page.request.put(`/api/pages/${path}`, {
    data: {
      title: "画像ビューアー",
      description: "",
      content: imageNames.map((imageName, index) => `![${imageName}](/uploads/${media[index].filename})`).join("\n\n"),
      expectedUpdatedAt: null,
    },
  })
  expect(save.ok()).toBeTruthy()

  await page.goto(`/wiki/${path}`)
  const trigger = page.getByRole("button", { name: `画像を拡大: ${imageNames[0]}` })
  const dialog = page.getByRole("dialog")
  await expect.poll(async () => {
    await trigger.click()
    return await dialog.isVisible()
  }).toBe(true)
  await expect.poll(async () => {
    const bounds = await dialog.boundingBox()
    const viewport = page.viewportSize()
    return !!bounds && !!viewport
      && bounds.x === 0 && bounds.y === 0
      && bounds.width === viewport.width && bounds.height === viewport.height
  }).toBe(true)
  await expect(dialog.locator(`img[alt="${imageNames[0]}"]`)).toBeVisible()
  await expect(dialog.getByRole("button", { name: "前の画像" })).toBeHidden()
  await dialog.getByRole("button", { name: "次の画像" }).click()
  await expect(dialog.locator(`img[alt="${imageNames[1]}"]`)).toBeVisible()
  await expect(dialog.getByRole("button", { name: "次の画像" })).toBeHidden()
  await dialog.getByRole("button", { name: "拡大表示" }).click()
  await expect(dialog.getByRole("button", { name: "通常表示" })).toBeVisible()
  await dialog.getByRole("button", { name: "閉じる" }).click()
  await expect(dialog).toBeHidden()
})

test("image viewer closes when its background is clicked", async ({ page }) => {
  const path = `e2e-image-viewer-background-${Date.now()}`
  const imageName = `viewer-background-${Date.now()}.svg`
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
  const media = await upload.json() as { filename: string }

  const save = await page.request.put(`/api/pages/${path}`, {
    data: {
      title: "画像ビューアー背景クリック",
      description: "",
      content: `![${imageName}](/uploads/${media.filename})`,
      expectedUpdatedAt: null,
    },
  })
  expect(save.ok()).toBeTruthy()

  await page.goto(`/wiki/${path}`)
  await page.getByRole("button", { name: `画像を拡大: ${imageName}` }).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  await dialog.locator("[data-image-viewer-stage]").click({ position: { x: 4, y: 4 } })
  await expect(dialog).toBeHidden()
})

test("re-editable diagram MDC markup displays the draw.io edit action", async ({ page }) => {
  const path = `e2e-re-editable-diagram-${Date.now()}`
  const upload = await page.request.post("/api/media", {
    multipart: {
      file: {
        name: "diagram.svg",
        mimeType: "image/svg+xml",
        buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>'),
      },
      kind: "diagram",
    },
  })
  expect(upload.ok()).toBeTruthy()
  const media = await upload.json() as { id: number, filename: string }

  const save = await page.request.put(`/api/pages/${path}`, {
    data: {
      title: "再編集可能な図表",
      description: "",
      content: `::diagram{src="/uploads/${media.filename}" media-id="${media.id}"}\n::`,
      expectedUpdatedAt: null,
    },
  })
  expect(save.ok()).toBeTruthy()

  await page.goto(`/wiki/${path}`)
  await expect(page.getByRole("button", { name: "draw.ioで再編集" })).toBeVisible()
})

test("desktop editor shows frontmatter, Markdown, and preview side by side", async ({ page }) => {
  await page.goto(`/edit/e2e-desktop-${Date.now()}`)

  await expect(page.getByLabel("タイトル")).toBeVisible()
  await expect(page.getByLabel("パス")).toHaveValue(/e2e-desktop-/)
  await expect(page.locator("#editor-panel")).toBeVisible()
  await expect(page.locator("#preview-panel")).toBeVisible()
  await expect.poll(async () => {
    const editor = await page.locator("#editor-panel").boundingBox()
    const saveButton = await page.getByRole("button", { name: "保存" }).boundingBox()
    return !!editor && !!saveButton && saveButton.x + saveButton.width >= editor.x + editor.width
  }).toBeTruthy()
})

test("save moves a page to its edited path", async ({ page }) => {
  const oldPath = `e2e-move-old-${Date.now()}`
  const newPath = `e2e-move-new-${Date.now()}`

  await page.goto(`/edit/${oldPath}`)
  await page.getByLabel("タイトル").fill("移動テストページ")
  await page.getByLabel("パス").fill(newPath)
  await page.getByRole("button", { name: "保存" }).click()

  await expect(page).toHaveURL(`/wiki/${newPath}`)
  await expect(page.getByRole("heading", { name: "移動テストページ" })).toBeVisible()
})

test("editor tabs fit the viewport and work on mobile", async ({ page }) => {
  const path = `e2e-mobile-${Date.now()}`

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/edit/${path}`)
  await page.locator("aside").getByRole("button", { name: "サイドバーを閉じる" }).click({ force: true })

  await expect(page.getByRole("tab")).toHaveCount(3)
  await page.getByRole("tab", { name: "ページ設定" }).click()
  await page.getByLabel("タイトル").fill("モバイル編集")

  await page.getByRole("tab", { name: "Markdown" }).click()
  const textarea = markdownEditor(page)
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
