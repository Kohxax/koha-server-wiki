import { createPage, expect, test, uploadSvg } from "./helpers"

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
  // Guard against the fill landing before Vue's v-model attaches: the dirty
  // indicator only appears once the reactive `content` ref actually changed,
  // so waiting for it proves the save below will persist the new content
  // rather than silently re-saving the old one.
  await expect(page.getByText("未保存の変更があります")).toBeVisible()
  await page.getByRole("button", { name: "保存" }).click()
  await expect(page).toHaveURL(`/wiki/${path}`)
})

test("Ctrl+S saves without leaving the editor", async ({ page }) => {
  const path = `e2e-shortcut-save-${Date.now()}`

  await page.goto(`/edit/${path}`)
  await page.getByLabel("タイトル").fill("ショートカット保存")
  await markdownEditor(page).fill("# 保存済みの内容")
  // See the comment above: without this, Ctrl+S can fire before the fills
  // reached Vue's state, saving empty/default values instead.
  await expect(page.getByText("未保存の変更があります")).toBeVisible()
  await page.keyboard.press("Control+s")

  await expect(page).toHaveURL(`/edit/${path}`)
  await expect(page.getByText("未保存の変更があります")).toBeHidden()
  await page.reload()
  await expect(page.getByLabel("タイトル")).toHaveValue("ショートカット保存")
  await expect(markdownEditor(page)).toHaveValue("# 保存済みの内容")
})

test("image insertion updates the editor preview", async ({ page }) => {
  const path = `e2e-image-${Date.now()}`
  const media = await uploadSvg(page, `preview-${Date.now()}.svg`)

  await page.goto(`/edit/${path}`)
  await page.getByTitle("画像").click()
  await page.getByTitle(media.originalName).click()

  await expect(markdownEditor(page)).toHaveValue(`![](/uploads/${media.filename})`)
  await expect(page.getByRole("dialog")).toBeHidden()
  await expect(page.locator('#preview-panel img[alt=""]')).toBeVisible()
})

test("article images open in the viewer", async ({ page }) => {
  const path = `e2e-image-viewer-${Date.now()}`
  const imageNames = [`viewer-first-${Date.now()}.svg`, `viewer-second-${Date.now()}.svg`]
  const media = await Promise.all(imageNames.map(imageName => uploadSvg(page, imageName)))

  await createPage(page, path, {
    title: "画像ビューアー",
    content: imageNames.map((imageName, index) => `![${imageName}](/uploads/${media[index].filename})`).join("\n\n"),
  })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/wiki/${path}`)
  const trigger = page.getByRole("button", { name: `画像を拡大: ${imageNames[0]}` })
  const dialog = page.getByRole("dialog")
  await trigger.click()
  await expect(dialog).toBeVisible()
  // The mobile viewer overlay is meant to cover the full viewport; the
  // sizing classes below express that intent directly instead of comparing
  // measured pixel bounds against page.viewportSize().
  await expect(dialog).toHaveClass(/\btop-0\b/)
  await expect(dialog).toHaveClass(/\bleft-0\b/)
  await expect(dialog).toHaveClass(/\bh-dvh\b/)
  await expect(dialog).toHaveClass(/\bw-dvw\b/)
  const viewerImage = dialog.locator(`[data-image-viewer-stage] img[alt="${imageNames[0]}"]`)
  await expect(viewerImage).toBeVisible()
  await expect(dialog.getByRole("button", { name: "前の画像" })).toBeHidden()
  await dialog.getByRole("button", { name: "次の画像" }).click()
  await expect(dialog.locator(`img[alt="${imageNames[1]}"]`)).toBeVisible()
  await expect(dialog.getByRole("button", { name: "次の画像" })).toBeHidden()
  const secondImage = dialog.locator(`[data-image-viewer-stage] img[alt="${imageNames[1]}"]`)
  await dialog.getByRole("button", { name: "拡大表示" }).click()
  await expect(dialog.getByRole("button", { name: "通常表示" })).toBeVisible()
  // "拡大表示" swaps the image to its 200%-width class; check that class
  // directly rather than asserting a magic-number rendered width. (No
  // trailing \b: "]" is a non-word char followed by a space, so \b would
  // never match there.)
  await expect(secondImage).toHaveClass(/(?:^|\s)w-\[200%\](?:\s|$)/)
  await secondImage.click()
  await expect(dialog.getByRole("button", { name: "通常表示" })).toBeHidden()
  await expect(dialog.getByRole("button", { name: "閉じる" })).toBeHidden()
  await secondImage.click()
  await expect(dialog.getByRole("button", { name: "通常表示" })).toBeVisible()
  await dialog.getByRole("button", { name: "閉じる" }).click()
  await expect(dialog).toBeHidden()
})

test("image viewer closes when its background is clicked", async ({ page }) => {
  const path = `e2e-image-viewer-background-${Date.now()}`
  const imageName = `viewer-background-${Date.now()}.svg`
  const media = await uploadSvg(page, imageName)

  await createPage(page, path, {
    title: "画像ビューアー背景クリック",
    content: `![${imageName}](/uploads/${media.filename})`,
  })

  await page.goto(`/wiki/${path}`)
  await page.getByRole("button", { name: `画像を拡大: ${imageName}` }).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  await dialog.locator("[data-image-viewer-stage]").click({ position: { x: 4, y: 4 } })
  await expect(dialog).toBeHidden()
})

test("re-editable diagrams expose edit controls only in the editor", async ({ page }) => {
  const path = `e2e-re-editable-diagram-${Date.now()}`
  const media = await uploadSvg(page, "diagram.svg", undefined, "diagram")

  await createPage(page, path, {
    title: "再編集可能な図表",
    content: `::diagram{src="/uploads/${media.filename}" media-id="${media.id}"}\n::`,
  })

  await page.goto(`/wiki/${path}`)
  await expect(page.getByRole("button", { name: "draw.ioで再編集" })).not.toBeAttached()

  await page.goto(`/edit/${path}`)
  const reeditButton = page.getByRole("button", { name: "draw.ioで再編集" })
  await expect(reeditButton).toBeVisible()
  await reeditButton.click()
  await expect(page.locator('iframe[title="draw.io editor"]')).toBeVisible()
})

test("desktop editor shows frontmatter, Markdown, and preview side by side", async ({ page }) => {
  await page.goto(`/edit/e2e-desktop-${Date.now()}`)

  await expect(page.getByLabel("タイトル")).toBeVisible()
  await expect(page.getByLabel("パス")).toHaveValue(/e2e-desktop-/)
  await expect(page.locator("#editor-panel")).toBeVisible()
  await expect(page.locator("#preview-panel")).toBeVisible()
  // The three panels sit in a `md:grid-cols-[...]` container, and the save
  // button's toolbar is pushed right via `ml-auto` - assert those classes
  // instead of comparing measured bounding boxes.
  const saveButton = page.getByRole("button", { name: "保存" })
  await expect(saveButton).toBeVisible()
  await expect(saveButton.locator("xpath=..")).toHaveClass(/\bml-auto\b/)
})

test("save moves a page to its edited path", async ({ page }) => {
  const oldPath = `e2e-move-old-${Date.now()}`
  const newPath = `e2e-move-new-${Date.now()}`

  await page.goto(`/edit/${oldPath}`)
  await page.getByLabel("タイトル").fill("移動テストページ")
  await page.getByLabel("パス").fill(newPath)
  // See the Ctrl+S test above: prove the fills reached Vue's state before
  // clicking save, otherwise the save can silently persist stale values.
  await expect(page.getByText("未保存の変更があります")).toBeVisible()
  await page.getByRole("button", { name: "保存" }).click()

  await expect(page).toHaveURL(`/wiki/${newPath}`)
  await expect(page.getByRole("heading", { name: "移動テストページ" })).toBeVisible()
})

test("duplicate creates independent draw.io diagrams while keeping image references", async ({ page }) => {
  const sourcePath = `e2e-duplicate-source-${Date.now()}`
  const targetPath = `e2e-duplicate-target-${Date.now()}`
  const diagramSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><text>source</text></svg>'

  const diagram = await uploadSvg(page, `duplicate-diagram-${Date.now()}.svg`, diagramSvg, "diagram")
  const image = await uploadSvg(page, `duplicate-image-${Date.now()}.svg`)

  const sourceContent = `![通常画像](/uploads/${image.filename})\n\n::diagram{src="/uploads/${diagram.filename}" media-id="${diagram.id}"}\n配置図\n::`
  await createPage(page, sourcePath, { title: "複製元", description: "説明", content: sourceContent })

  await page.goto(`/edit/${sourcePath}`)
  await page.getByRole("button", { name: "複製", exact: true }).click()
  await page.getByLabel("新しいパス").fill(targetPath)
  await page.getByLabel("タイトル").last().fill("複製先")
  await page.getByRole("button", { name: "複製", exact: true }).last().click()

  await expect(page).toHaveURL(`/edit/${targetPath}`)
  await expect(page.getByLabel("タイトル").first()).toHaveValue("複製先")
  const copiedContent = await markdownEditor(page).inputValue()
  expect(copiedContent).toContain(`/uploads/${image.filename}`)
  expect(copiedContent).not.toContain(`media-id="${diagram.id}"`)
  expect(copiedContent).not.toContain(`/uploads/${diagram.filename}`)

  const mediaIdMatch = /media-id="(\d+)"/.exec(copiedContent)
  const filenameMatch = /::diagram\{src="\/uploads\/([^"]+)"/.exec(copiedContent)
  expect(mediaIdMatch?.[1]).toBeTruthy()
  expect(filenameMatch?.[1]).toBeTruthy()
  expect(Number(mediaIdMatch?.[1])).not.toBe(diagram.id)

  const copiedFilename = filenameMatch![1]
  const copiedUpdate = await page.request.put(`/api/media/${mediaIdMatch![1]}`, {
    multipart: {
      file: { name: copiedFilename, mimeType: "image/svg+xml", buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><text>copy</text></svg>') },
    },
  })
  expect(copiedUpdate.ok()).toBeTruthy()
  expect(await (await page.request.get(`/uploads/${diagram.filename}`)).text()).toBe(diagramSvg)
  expect(await (await page.request.get(`/uploads/${copiedFilename}`)).text()).toContain("copy")
})

test.describe("re-editing a duplicated draw.io diagram", () => {
  // Shared setup for the three tests below: duplicate a page that embeds a
  // re-editable diagram, landing on the editor for the copy with its own
  // independent media id/filename.
  async function setUpDuplicatedDiagram(page: import("@playwright/test").Page) {
    const sourcePath = `e2e-reedit-source-${Date.now()}`
    const targetPath = `e2e-reedit-target-${Date.now()}`
    const originalSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="#ff0000"/></svg>'
    const original = await uploadSvg(page, "reedit-source.svg", originalSvg, "diagram")

    await createPage(page, sourcePath, {
      title: "再編集元",
      content: `::diagram{src="/uploads/${original.filename}" media-id="${original.id}"}\n::`,
    })

    await page.goto(`/edit/${sourcePath}`)
    await page.getByRole("button", { name: "複製", exact: true }).click()
    await page.getByLabel("新しいパス").fill(targetPath)
    await page.getByLabel("タイトル").last().fill("再編集先")
    await page.getByRole("button", { name: "複製", exact: true }).last().click()
    await expect(page).toHaveURL(`/edit/${targetPath}`)

    const copiedContent = await markdownEditor(page).inputValue()
    const copiedId = /media-id="(\d+)"/.exec(copiedContent)?.[1]
    const copiedFilename = /::diagram\{src="\/uploads\/([^"]+)"/.exec(copiedContent)?.[1]
    expect(copiedId).toBeTruthy()
    expect(copiedFilename).toBeTruthy()

    return { targetPath, copiedContent, copiedId: copiedId!, copiedFilename: copiedFilename! }
  }

  function mockDrawioEditor(page: import("@playwright/test").Page, editedSvg: string) {
    return page.route("https://embed.diagrams.net/**", async (route) => {
      const dataUrl = `data:image/svg+xml;base64,${Buffer.from(editedSvg).toString("base64")}`
      await route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<!doctype html>
          <button id="save">Save</button>
          <script>
            const send = message => parent.postMessage(JSON.stringify(message), "*")
            window.addEventListener("message", event => {
              const message = JSON.parse(event.data)
              if (message.action === "export")
                send({ event: "export", data: ${JSON.stringify(dataUrl)} })
            })
            document.querySelector("#save").addEventListener("click", () => {
              send({ event: "save", xml: "<mxGraphModel />" })
            })
            setTimeout(() => send({ event: "init" }), 20)
          </script>`,
      })
    })
  }

  test("duplicated diagram assets are served without caching", async ({ page }) => {
    const { copiedFilename } = await setUpDuplicatedDiagram(page)

    const previewImage = page.locator(`#preview-panel img[src^="/uploads/${copiedFilename}?v="]`)
    await expect(previewImage).toBeVisible()

    const svgResponse = await page.request.get(`/uploads/${copiedFilename}`)
    expect(svgResponse.headers()["cache-control"]).toBe("no-store")
    expect(svgResponse.headers()["cloudflare-cdn-cache-control"]).toBe("no-store")
  })

  test("re-editing updates the preview image", async ({ page }) => {
    const { copiedId, copiedFilename } = await setUpDuplicatedDiagram(page)
    const editedSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="#00ff00"/></svg>'
    await mockDrawioEditor(page, editedSvg)

    const previewImage = page.locator(`#preview-panel img[src^="/uploads/${copiedFilename}?v="]`)
    const initialImageSrc = await previewImage.getAttribute("src")

    const mediaSave = page.waitForResponse(response =>
      response.url().includes(`/api/media/${copiedId}`)
      && response.request().method() === "PUT",
    )
    await page.getByRole("button", { name: "draw.ioで再編集" }).click()
    await page.frameLocator('iframe[title="draw.io editor"]').getByRole("button", { name: "Save" }).click()
    expect((await mediaSave).ok()).toBeTruthy()

    await expect.poll(() => previewImage.getAttribute("src")).not.toBe(initialImageSrc)
    expect(await (await page.request.get(`/uploads/${copiedFilename}`)).text()).toBe(editedSvg)
  })

  test("the re-edited image survives saving and reopening the page", async ({ page }) => {
    const { targetPath, copiedContent, copiedFilename } = await setUpDuplicatedDiagram(page)
    const editedSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="#00ff00"/></svg>'
    await mockDrawioEditor(page, editedSvg)

    const previewImage = page.locator(`#preview-panel img[src^="/uploads/${copiedFilename}?v="]`)
    const initialImageSrc = await previewImage.getAttribute("src")
    await page.getByRole("button", { name: "draw.ioで再編集" }).click()
    await page.frameLocator('iframe[title="draw.io editor"]').getByRole("button", { name: "Save" }).click()
    await expect.poll(() => previewImage.getAttribute("src")).not.toBe(initialImageSrc)
    const updatedImageSrc = await previewImage.getAttribute("src")
    expect(updatedImageSrc).toBeTruthy()

    await page.getByRole("button", { name: "保存", exact: true }).click()
    await expect(page).toHaveURL(`/wiki/${targetPath}`)
    // The rendered page shows the same (now-edited) image src instead of
    // re-decoding pixels off a canvas: the src update plus the raw SVG
    // content fetched below together prove the edit persisted.
    await expect(page.locator(`img[src="${updatedImageSrc}"]`).first()).toBeVisible()
    expect(await (await page.request.get(`/uploads/${copiedFilename}`)).text()).toBe(editedSvg)

    await page.getByRole("link", { name: "編集" }).click()
    await expect(page).toHaveURL(`/edit/${targetPath}`)
    await expect(page.getByRole("button", { name: "draw.ioで再編集" })).toBeVisible()
    await expect(markdownEditor(page)).toHaveValue(copiedContent)
  })
})

test("editor tabs fit the viewport and work on mobile", async ({ page }) => {
  const path = `e2e-mobile-${Date.now()}`

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/edit/${path}`)
  await expect(page.getByRole("button", { name: "メニューを開く" })).toBeVisible()

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
