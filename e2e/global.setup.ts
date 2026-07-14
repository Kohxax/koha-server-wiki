import { mkdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { test as setup } from "@playwright/test"

const authDir = fileURLToPath(new URL(".auth", import.meta.url))
mkdirSync(authDir, { recursive: true })

const roles = ["admin", "editor", "viewer"] as const

for (const role of roles) {
  setup(`authenticate as ${role}`, async ({ page, baseURL }) => {
    const response = await page.request.post(`${baseURL}/api/dev/login`, {
      data: { role },
    })
    if (!response.ok())
      throw new Error(`dev login failed for role=${role}: ${response.status()}`)

    await page.goto("/")
    await page.context().storageState({ path: `${authDir}/${role}.json` })
  })
}
