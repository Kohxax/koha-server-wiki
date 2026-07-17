import { describe, expect, it } from "vitest"
import { requireTestDatabaseUrl } from "./test-url"

describe("requireTestDatabaseUrl", () => {
  it("accepts a database name ending in _test", () => {
    expect(requireTestDatabaseUrl("postgres://user:password@localhost:5432/wiki_test"))
      .toBe("postgres://user:password@localhost:5432/wiki_test")
  })

  it("rejects an unset or invalid database URL", () => {
    expect(() => requireTestDatabaseUrl(undefined)).toThrow("TEST_DATABASE_URL is not set")
    expect(() => requireTestDatabaseUrl("not a URL")).toThrow("must be a valid database URL")
  })

  it("rejects a database name without the _test suffix", () => {
    expect(() => requireTestDatabaseUrl("postgres://user:password@localhost:5432/wiki"))
      .toThrow("ends with _test")
  })
})
