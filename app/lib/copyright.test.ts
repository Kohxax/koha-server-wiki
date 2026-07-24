import { describe, expect, it } from "vitest"
import { formatCopyrightYears } from "./copyright"

describe("formatCopyrightYears", () => {
  it("shows only the starting year in 2026", () => {
    expect(formatCopyrightYears(2026)).toBe("2026")
  })

  it("shows a year range after 2026", () => {
    expect(formatCopyrightYears(2027)).toBe("2026 - 2027")
  })
})
