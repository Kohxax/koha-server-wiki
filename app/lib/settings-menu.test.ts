import { describe, expect, it } from "vitest"
import { visibleSettingsMenu } from "./settings-menu"

describe("visibleSettingsMenu", () => {
  it("hides all settings from viewers", () => {
    expect(visibleSettingsMenu("viewer")).toEqual([])
  })

  it("shows editor settings without user management", () => {
    expect(visibleSettingsMenu("editor").map(item => item.id)).toEqual([
      "overview", "pages", "sidebar", "media",
    ])
  })

  it("shows all registered settings to admins", () => {
    expect(visibleSettingsMenu("admin").map(item => item.id)).toEqual([
      "overview", "pages", "sidebar", "media", "users",
    ])
  })
})
