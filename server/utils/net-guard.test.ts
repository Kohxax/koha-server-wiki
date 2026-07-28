import { describe, expect, it } from "vitest"
import { isPublicIpAddress } from "./net-guard"

describe("isPublicIpAddress", () => {
  it.each([
    "0.0.0.1",
    "10.0.0.1",
    "100.64.0.1",
    "100.100.0.1",
    "100.127.255.255",
    "127.0.0.1",
    "169.254.1.1",
    "172.16.0.1",
    "172.31.255.255",
    "192.0.0.1",
    "192.168.0.1",
    "198.18.0.1",
    "198.19.255.255",
    "198.51.100.5",
    "203.0.113.1",
    "224.0.0.1",
    "255.255.255.255",
  ])("rejects non-public IPv4 address %s", (address) => {
    expect(isPublicIpAddress(address)).toBe(false)
  })

  it.each([
    "8.8.8.8",
    "1.1.1.1",
    "203.0.114.10",
    "198.51.99.5",
    "198.51.101.5",
  ])("allows a public IPv4 address %s", (address) => {
    expect(isPublicIpAddress(address)).toBe(true)
  })

  it.each([
    "::",
    "::1",
    "fc00::1",
    "fd12:3456::1",
    "fe80::1",
    "fe90::1",
    "ff02::1",
    "2001:db8::1",
    "::ffff:10.0.0.1",
    "::ffff:127.0.0.1",
  ])("rejects non-public IPv6 address %s", (address) => {
    expect(isPublicIpAddress(address)).toBe(false)
  })

  it.each([
    "2606:4700:4700::1111",
    "2001:4860:4860::8888",
    "::ffff:8.8.8.8",
  ])("allows a public IPv6 address %s", (address) => {
    expect(isPublicIpAddress(address)).toBe(true)
  })

  it("rejects non-IP input", () => {
    expect(isPublicIpAddress("example.com")).toBe(false)
    expect(isPublicIpAddress("")).toBe(false)
  })
})
