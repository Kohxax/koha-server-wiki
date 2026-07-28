import { describe, expect, it } from "vitest"
import { parseMinecraftServerAddress, parseMinecraftStatusTargets } from "./minecraft-status"

describe("parseMinecraftServerAddress", () => {
  it("uses the default Java port when omitted", () => {
    expect(parseMinecraftServerAddress("Play.Example.net")).toEqual({ host: "play.example.net", port: 25565, hasExplicitPort: false })
  })

  it("accepts an explicit port", () => {
    expect(parseMinecraftServerAddress("203.0.114.10:25570")).toEqual({ host: "203.0.114.10", port: 25570, hasExplicitPort: true })
  })

  it.each(["", "http://example.com", "example.com:0", "example.com:65536", "[::1]", "bad host"])("rejects invalid addresses: %s", (address) => {
    expect(() => parseMinecraftServerAddress(address)).toThrow()
  })
})

describe("parseMinecraftStatusTargets", () => {
  it("allows a public host to use a private, server-configured target", () => {
    expect(parseMinecraftStatusTargets('{"mc.example.net":"192.168.1.10:25577"}')).toEqual(new Map([
      ["mc.example.net", { host: "192.168.1.10", port: 25577, hasExplicitPort: true }],
    ]))
  })

  it("accepts a target object deserialized from Nuxt runtime config", () => {
    expect(parseMinecraftStatusTargets({ "mc.example.net": "192.168.1.10:25577" })).toEqual(new Map([
      ["mc.example.net", { host: "192.168.1.10", port: 25577, hasExplicitPort: true }],
    ]))
  })

  it.each([
    "not-json",
    "[]",
    '{"mc.example.net":123}',
    '{"mc.example.net:25565":"192.168.1.10:25577"}',
  ])("rejects invalid target configuration: %s", (targets) => {
    expect(() => parseMinecraftStatusTargets(targets)).toThrow()
  })
})
