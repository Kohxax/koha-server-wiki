import process from "node:process"
import { afterEach, describe, expect, it } from "vitest"
import { isDevAuthBypassEnabled } from "./dev-auth"

describe("isDevAuthBypassEnabled", () => {
  const original = process.env.NUXT_DEV_AUTH_BYPASS

  afterEach(() => {
    if (original === undefined)
      delete process.env.NUXT_DEV_AUTH_BYPASS
    else
      process.env.NUXT_DEV_AUTH_BYPASS = original
  })

  it("is false when unset", () => {
    delete process.env.NUXT_DEV_AUTH_BYPASS
    expect(isDevAuthBypassEnabled()).toBe(false)
  })

  it("is true when set to 1", () => {
    process.env.NUXT_DEV_AUTH_BYPASS = "1"
    expect(isDevAuthBypassEnabled()).toBe(true)
  })
})
