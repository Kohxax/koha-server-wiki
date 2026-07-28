import type { Page } from "@playwright/test"
import { test as base, expect } from "@playwright/test"
import type { MediaDto, PageDto } from "../shared/types/api"

/**
 * Waits until Nuxt has hydrated the page, i.e. Vue has mounted and attached
 * its event listeners on top of the server-rendered HTML.
 *
 * Without this, Playwright's actionability checks can see an SSR-rendered
 * button/input as "ready" (visible, enabled, stable) before Vue has actually
 * attached its `@click`/`v-model` handlers. A `.click()`/`.fill()` that lands
 * in that window is silently dropped: the DOM looks right for a moment, but
 * the component's reactive state never saw the interaction. That produces
 * exactly the "old data after save" flakes this suite used to see - a save
 * button click that didn't register, or a filled input that didn't update
 * `v-model`, means the following save (if any) persists stale/default
 * values, and a subsequent read shows the "old" data.
 */
export async function waitForNuxtHydration(page: Page): Promise<void> {
  await expect.poll(() => page.locator("#__nuxt").evaluate(element => "__vue_app__" in element)).toBe(true)
}

/**
 * `test`/`expect` with hydration-safety baked in: every `page.goto()` waits
 * for Nuxt hydration before returning control to the test, so specs don't
 * need to (and can't forget to) call `waitForNuxtHydration` after each
 * navigation. Client-side navigations (`NuxtLink` clicks, `navigateTo`)
 * don't need this since the app is already hydrated by then.
 */
export const test = base.extend<object>({
  page: async ({ page }, use) => {
    const originalGoto = page.goto.bind(page)
    page.goto = (async (url: string, options?: Parameters<Page["goto"]>[1]) => {
      const response = await originalGoto(url, options)
      await waitForNuxtHydration(page)
      return response
    }) as Page["goto"]
    await use(page)
  },
})

export { expect }

/**
 * Creates (or overwrites) a page via the API, the same boilerplate PUT that
 * most specs need before they can exercise the UI against known content.
 */
export async function createPage(page: Page, path: string, options: { title: string, content: string, description?: string }): Promise<PageDto> {
  const response = await page.request.put(`/api/pages/${path}`, {
    data: {
      title: options.title,
      description: options.description ?? "",
      content: options.content,
      expectedUpdatedAt: null,
    },
  })
  expect(response.ok()).toBeTruthy()
  return await response.json() as PageDto
}

/**
 * Uploads a 1x1 SVG (or custom `svgContent`) as media, the multipart
 * boilerplate every image/diagram-related spec needs. Pass `kind: "diagram"`
 * for draw.io-editable diagrams.
 */
export async function uploadSvg(page: Page, name: string, svgContent?: string, kind?: "diagram"): Promise<MediaDto> {
  const upload = await page.request.post("/api/media", {
    multipart: {
      file: {
        name,
        mimeType: "image/svg+xml",
        buffer: Buffer.from(svgContent ?? '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>'),
      },
      ...(kind ? { kind } : {}),
    },
  })
  expect(upload.ok()).toBeTruthy()
  return await upload.json() as MediaDto
}
