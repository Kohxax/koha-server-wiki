import { expect, test } from "@playwright/test"

test.use({ storageState: "e2e/.auth/editor.json" })

test("finds pages by partial match in japanese title and content", async ({ page }) => {
  const path = `e2e-search-${Date.now()}`
  const uniqueWord = `拠点${Date.now()}`

  await page.goto("/new")
  await page.getByLabel("パス").fill(path)
  await page.getByRole("button", { name: "次へ" }).click()
  await page.getByLabel("タイトル").fill(`検索テスト${Date.now()}`)
  await page.locator("textarea").first().fill(`このページには${uniqueWord}についての説明があります。`)
  await page.getByRole("button", { name: "保存" }).click()
  await expect(page).toHaveURL(`/wiki/${path}`)

  await page.getByPlaceholder("検索...").fill(uniqueWord)
  await page.getByPlaceholder("検索...").press("Enter")

  await expect(page).toHaveURL(new RegExp(`/search\\?q=`))
  await expect(page.getByText(uniqueWord).first()).toBeVisible()
})
