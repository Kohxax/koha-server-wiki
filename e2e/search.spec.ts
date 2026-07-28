import { createPage, expect, test } from "./helpers"

test.use({ storageState: "e2e/.auth/editor.json" })

test("finds pages by partial match in japanese title and content", async ({ page }) => {
  const path = `e2e-search-${Date.now()}`
  const uniqueWord = `拠点${Date.now()}`

  await createPage(page, path, {
    title: `検索テスト${Date.now()}`,
    content: `このページには${uniqueWord}についての説明があります。`,
  })

  await page.goto(`/wiki/${path}`)

  await page.getByPlaceholder("検索...").fill(uniqueWord)
  await expect(page.getByRole("option", { name: new RegExp(uniqueWord) }).first()).toBeVisible()
  await page.getByRole("option", { name: new RegExp(uniqueWord) }).first().click()
  await expect(page).toHaveURL(`/wiki/${path}`)

  await page.getByPlaceholder("検索...").fill(uniqueWord)
  await page.getByPlaceholder("検索...").press("Enter")

  await expect(page).toHaveURL(new RegExp(`/search\\?q=`))
  await expect(page.getByText(uniqueWord).first()).toBeVisible()
})
