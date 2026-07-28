import { describe, expect, it } from "vitest"
import { canAdmin, canEdit } from "./permissions"

describe("canEdit", () => {
  it("allows editor and admin", () => {
    expect(canEdit("editor")).toBe(true)
    expect(canEdit("admin")).toBe(true)
  })

  it("denies viewer and unset roles", () => {
    expect(canEdit("viewer")).toBe(false)
    expect(canEdit(null)).toBe(false)
    expect(canEdit(undefined)).toBe(false)
  })
})

describe("canAdmin", () => {
  it("allows only admin", () => {
    expect(canAdmin("admin")).toBe(true)
    expect(canAdmin("editor")).toBe(false)
    expect(canAdmin("viewer")).toBe(false)
    expect(canAdmin(undefined)).toBe(false)
  })
})
