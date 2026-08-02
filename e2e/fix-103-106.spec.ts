import { createPage, expect, test, uploadSvg } from "./helpers"

test.use({ storageState: "e2e/.auth/editor.json" })

test("link previews stay inside the viewport near the bottom of a page", async ({ page }) => {
  const suffix = Date.now()
  const targetPath = `e2e-bottom-preview-target-${suffix}`
  const sourcePath = `e2e-bottom-preview-source-${suffix}`
  await createPage(page, targetPath, {
    title: "下端リンク先",
    content: "プレビュー対象です",
  })
  await createPage(page, sourcePath, {
    title: "下端リンクのテスト",
    content: `${Array.from({ length: 30 }, (_, index) => `段落 ${index + 1} の本文です。`).join("\n\n")}\n\n[下端リンク](/wiki/${targetPath})`,
  })

  await page.setViewportSize({ width: 1280, height: 600 })
  await page.goto(`/wiki/${sourcePath}`)
  const link = page.getByRole("link", { name: "下端リンク", exact: true })
  await link.evaluate(element => element.scrollIntoView({ block: "end", inline: "nearest" }))
  await link.hover()

  const preview = page.getByRole("tooltip")
  await expect(preview).toBeVisible()
  const linkBox = await link.boundingBox()
  const previewBox = await preview.boundingBox()
  expect(linkBox).toBeTruthy()
  expect(previewBox).toBeTruthy()
  expect(previewBox!.y + previewBox!.height).toBeLessThanOrEqual(600)
  expect(previewBox!.y).toBeLessThan(linkBox!.y)
})

test("draw.io links show the same link preview", async ({ page }) => {
  const suffix = Date.now()
  const targetPath = `e2e-diagram-preview-target-${suffix}`
  const sourcePath = `e2e-diagram-preview-source-${suffix}`
  const linkedSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="240" height="100"><a xlink:href="/wiki/${targetPath}"><rect width="240" height="100" fill="#22c55e"/></a></svg>`
  const media = await uploadSvg(page, `diagram-preview-${suffix}.svg`, linkedSvg, "diagram")

  await createPage(page, targetPath, {
    title: "図表リンク先",
    content: "図表から開くページです",
  })
  await createPage(page, sourcePath, {
    title: "図表リンクプレビュー",
    content: `::diagram{src="/uploads/${media.filename}" media-id="${media.id}"}\n::`,
  })

  await page.goto(`/wiki/${sourcePath}`)
  const diagram = page.locator('object[aria-label="図表"]')
  await expect(diagram).toBeVisible()
  await expect.poll(() => diagram.evaluate((element: HTMLObjectElement) => {
    const link = element.contentDocument?.querySelector("a")
    return link?.getAttribute("xlink:href")
  })).toBe(`/wiki/${targetPath}`)

  await diagram.evaluate((element: HTMLObjectElement) => {
    const document = element.contentDocument
    const link = document?.querySelector("a")
    const MouseEvent = document?.defaultView?.MouseEvent
    if (!link || !MouseEvent)
      throw new Error("draw.io link is not ready")
    link.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }))
  })

  const preview = page.getByRole("tooltip")
  await expect(preview).toBeVisible()
  await expect(preview).toContainText("図表リンク先")
})
