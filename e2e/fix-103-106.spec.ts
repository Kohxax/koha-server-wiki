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
