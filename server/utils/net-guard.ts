import net from "node:net"

const IPV4_MAPPED_PATTERN = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/

function isPrivateOrReservedIpv4(address: string): boolean {
  const octets = address.split(".").map(Number)
  if (octets.length !== 4 || octets.some(octet => !Number.isInteger(octet) || octet < 0 || octet > 255))
    return true

  const [a = Number.NaN, b = Number.NaN, c = Number.NaN] = octets
  if (a === 0 || a === 10 || a === 127 || a >= 224)
    return true
  if (a === 100 && b >= 64 && b <= 127)
    return true
  if (a === 169 && b === 254)
    return true
  if (a === 172 && b >= 16 && b <= 31)
    return true
  if (a === 192 && (b === 0 || b === 168))
    return true
  if (a === 198 && (b === 18 || b === 19))
    return true
  if (a === 198 && b === 51 && c === 100)
    return true
  if (a === 203 && b === 0 && c === 113)
    return true
  return false
}

function isPrivateOrReservedIpv6(address: string): boolean {
  const value = address.toLowerCase()
  const mappedV4 = value.match(IPV4_MAPPED_PATTERN)
  if (mappedV4)
    return isPrivateOrReservedIpv4(mappedV4[1]!)

  return value === "::"
    || value === "::1"
    || value.startsWith("fc")
    || value.startsWith("fd")
    || /^fe[89ab]/.test(value)
    || value.startsWith("ff")
    || value.startsWith("2001:db8:")
}

/**
 * Returns true when `address` is an IPv4 or IPv6 literal that is safe to
 * connect to from the server, i.e. it is publicly routable and not a
 * private, loopback, link-local, carrier-grade NAT, multicast, documentation,
 * or otherwise reserved address. Used to guard against SSRF when a
 * server-side fetch/connect target is derived from DNS resolution of
 * user- or admin-supplied input.
 */
export function isPublicIpAddress(address: string): boolean {
  const family = net.isIP(address)
  if (family === 4)
    return !isPrivateOrReservedIpv4(address)
  if (family === 6)
    return !isPrivateOrReservedIpv6(address)
  return false
}
