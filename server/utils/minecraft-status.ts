import { lookup, resolveSrv } from "node:dns/promises"
import net from "node:net"
import type { MinecraftServerStatus } from "../../shared/types/api"
import { createCachedFetcher } from "./cached-single-flight"
import { isPublicIpAddress } from "./net-guard"

const DEFAULT_PORT = 25565
const STATUS_TIMEOUT_MS = 3_000
const CACHE_TTL_MS = 60_000
const MAX_CACHE_ENTRIES = 100
const MAX_PACKET_SIZE = 1_048_576
const JAVA_PROTOCOL_VERSION = 758

export interface MinecraftServerAddress {
  host: string
  port: number
  hasExplicitPort: boolean
}

export class InvalidMinecraftServerAddressError extends Error {}

export class InvalidMinecraftStatusTargetsError extends Error {}

interface ResolvedMinecraftServer extends MinecraftServerAddress {
  connectHost: string
}

const getCachedStatus = createCachedFetcher<MinecraftServerStatus>({ ttlMs: CACHE_TTL_MS, maxEntries: MAX_CACHE_ENTRIES })

export function parseMinecraftServerAddress(raw: string): MinecraftServerAddress {
  const value = raw.trim()
  if (!value || value.length > 253 || /\s/.test(value))
    throw new InvalidMinecraftServerAddressError("Invalid server address")

  const ipv6 = value.match(/^\[([^\]]+)\](?::(\d+))?$/)
  if (ipv6)
    throw new InvalidMinecraftServerAddressError("IPv6 server addresses are not supported")

  const parts = value.match(/^([^:]+?)(?::(\d+))?$/)
  if (!parts)
    throw new InvalidMinecraftServerAddressError("Invalid server address")

  const host = parts[1]!.toLowerCase()
  const port = parts[2] ? Number(parts[2]) : DEFAULT_PORT
  const isIpv4 = net.isIP(host) === 4
  const isHostname = isValidHostname(host)

  if ((!isIpv4 && !isHostname) || !Number.isInteger(port) || port < 1 || port > 65_535)
    throw new InvalidMinecraftServerAddressError("Invalid server address")

  return { host, port, hasExplicitPort: !!parts[2] }
}

/**
 * Parses server-controlled target overrides. The public name remains the
 * handshake host, while only this explicit configuration may use a private
 * network destination.
 */
export function parseMinecraftStatusTargets(raw: unknown): Map<string, MinecraftServerAddress> {
  let value: unknown
  if (typeof raw === "string") {
    if (!raw.trim())
      return new Map()

    try {
      value = JSON.parse(raw)
    } catch {
      throw new InvalidMinecraftStatusTargetsError("Minecraft status targets must be JSON")
    }
  } else {
    value = raw
  }

  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new InvalidMinecraftStatusTargetsError("Minecraft status targets must be an object")

  const targets = new Map<string, MinecraftServerAddress>()
  for (const [publicHost, target] of Object.entries(value)) {
    if (typeof target !== "string")
      throw new InvalidMinecraftStatusTargetsError("Minecraft status target must be a string")

    const source = parseMinecraftServerAddress(publicHost)
    if (source.hasExplicitPort)
      throw new InvalidMinecraftStatusTargetsError("Minecraft status target keys must not include a port")

    targets.set(source.host, parseMinecraftServerAddress(target))
  }
  return targets
}

function isValidHostname(host: string): boolean {
  return /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(host)
}

async function resolvePublicMinecraftServer(address: MinecraftServerAddress): Promise<ResolvedMinecraftServer> {
  const endpoint = await resolveMinecraftEndpoint(address)
  if (net.isIP(endpoint.host) === 4) {
    if (!isPublicIpAddress(endpoint.host))
      throw new InvalidMinecraftServerAddressError("Private server addresses are not allowed")
    return { ...address, port: endpoint.port, connectHost: endpoint.host }
  }

  let records: { address: string }[]
  try {
    records = await lookup(endpoint.host, { all: true, family: 4, verbatim: true })
  } catch {
    throw new InvalidMinecraftServerAddressError("Server host could not be resolved")
  }

  const connectHost = records.find(record => isPublicIpAddress(record.address))?.address
  if (!connectHost)
    throw new InvalidMinecraftServerAddressError("Private server addresses are not allowed")

  return { ...address, port: endpoint.port, connectHost }
}

function resolveConfiguredMinecraftServer(address: MinecraftServerAddress, targets: ReadonlyMap<string, MinecraftServerAddress>): ResolvedMinecraftServer | undefined {
  const target = targets.get(address.host)
  if (!target)
    return undefined

  return { ...address, port: target.port, connectHost: target.host }
}

async function resolveMinecraftEndpoint(address: MinecraftServerAddress): Promise<{ host: string, port: number }> {
  if (address.hasExplicitPort || net.isIP(address.host) !== 0)
    return address

  try {
    const records = await resolveSrv(`_minecraft._tcp.${address.host}`)
    const record = records.sort((a, b) => a.priority - b.priority || b.weight - a.weight)[0]
    const host = record?.name.replace(/\.$/, "").toLowerCase()
    if (record && host && isValidHostname(host))
      return { host, port: record.port }
  } catch {
    // SRV records are optional in the Java Edition protocol. Fall back to 25565.
  }

  return address
}

function encodeVarInt(value: number): Buffer {
  const bytes: number[] = []
  let remaining = value >>> 0
  do {
    let current = remaining & 0x7f
    remaining >>>= 7
    if (remaining !== 0)
      current |= 0x80
    bytes.push(current)
  } while (remaining !== 0)
  return Buffer.from(bytes)
}

function decodeVarInt(buffer: Buffer, offset = 0): { value: number, size: number } | null {
  let value = 0
  for (let index = 0; index < 5; index++) {
    const current = buffer[offset + index]
    if (current === undefined)
      return null
    value |= (current & 0x7f) << (7 * index)
    if ((current & 0x80) === 0)
      return { value, size: index + 1 }
  }
  throw new Error("Invalid VarInt")
}

function encodeString(value: string): Buffer {
  const body = Buffer.from(value, "utf8")
  return Buffer.concat([encodeVarInt(body.length), body])
}

function encodePacket(id: number, body: Buffer): Buffer {
  const payload = Buffer.concat([encodeVarInt(id), body])
  return Buffer.concat([encodeVarInt(payload.length), payload])
}

function statusDescription(value: unknown): string | undefined {
  if (typeof value === "string")
    return value
  if (!value || typeof value !== "object")
    return undefined

  const component = value as { text?: unknown, extra?: unknown }
  const text = typeof component.text === "string" ? component.text : ""
  const extra = Array.isArray(component.extra)
    ? component.extra.map(statusDescription).filter((part): part is string => !!part).join("")
    : ""
  return text || extra || undefined
}

function readStatusPacket(buffer: Buffer): MinecraftServerStatus | null {
  const frameLength = decodeVarInt(buffer)
  if (!frameLength)
    return null
  if (frameLength.value < 0 || frameLength.value > MAX_PACKET_SIZE)
    throw new Error("Invalid Minecraft status packet size")

  const frameStart = frameLength.size
  const frameEnd = frameStart + frameLength.value
  if (buffer.length < frameEnd)
    return null

  const packetId = decodeVarInt(buffer, frameStart)
  if (!packetId || packetId.value !== 0)
    throw new Error("Unexpected Minecraft status packet")
  const jsonLength = decodeVarInt(buffer, frameStart + packetId.size)
  if (!jsonLength)
    throw new Error("Missing Minecraft status payload")
  const jsonStart = frameStart + packetId.size + jsonLength.size
  const jsonEnd = jsonStart + jsonLength.value
  if (jsonLength.value < 0 || jsonEnd > frameEnd)
    throw new Error("Invalid Minecraft status payload")

  const payload = JSON.parse(buffer.subarray(jsonStart, jsonEnd).toString("utf8")) as {
    description?: unknown
    version?: { name?: unknown }
    players?: { online?: unknown, max?: unknown }
    favicon?: unknown
  }
  const online = payload.players?.online
  const max = payload.players?.max
  const favicon = typeof payload.favicon === "string" && /^data:image\/png;base64,/.test(payload.favicon) && payload.favicon.length <= 1_000_000
    ? payload.favicon
    : undefined

  return {
    address: "",
    online: true,
    players: typeof online === "number" && typeof max === "number" ? { online, max } : undefined,
    version: typeof payload.version?.name === "string" ? payload.version.name : undefined,
    description: statusDescription(payload.description),
    favicon,
  }
}

async function pingMinecraftServer(server: ResolvedMinecraftServer): Promise<MinecraftServerStatus> {
  return await new Promise<MinecraftServerStatus>((resolve, reject) => {
    const socket = net.createConnection({ host: server.connectHost, port: server.port, family: 4 })
    let received = Buffer.alloc(0)
    const timeout = setTimeout(() => finish(new Error("Minecraft status request timed out")), STATUS_TIMEOUT_MS)

    function cleanup() {
      clearTimeout(timeout)
      socket.removeAllListeners()
      socket.destroy()
    }

    function finish(error?: Error, result?: MinecraftServerStatus) {
      cleanup()
      if (error)
        reject(error)
      else if (result)
        resolve(result)
    }

    socket.once("error", error => finish(error))
    socket.once("connect", () => {
      const handshake = Buffer.concat([
        encodeVarInt(JAVA_PROTOCOL_VERSION),
        encodeString(server.host),
        Buffer.from([server.port >> 8, server.port & 0xff]),
        encodeVarInt(1),
      ])
      socket.write(encodePacket(0, handshake))
      socket.write(encodePacket(0, Buffer.alloc(0)))
    })
    socket.on("data", (chunk: Buffer) => {
      received = Buffer.concat([received, chunk])
      if (received.length > MAX_PACKET_SIZE + 5) {
        finish(new Error("Minecraft status response is too large"))
        return
      }
      try {
        const result = readStatusPacket(received)
        if (result)
          finish(undefined, { ...result, address: `${server.host}:${server.port}` })
      } catch (error) {
        finish(error instanceof Error ? error : new Error("Invalid Minecraft status response"))
      }
    })
  })
}

export async function getMinecraftServerStatus(rawAddress: string, targets: ReadonlyMap<string, MinecraftServerAddress> = new Map()): Promise<MinecraftServerStatus> {
  const address = parseMinecraftServerAddress(rawAddress)
  const key = `${address.host}:${address.port}:${address.hasExplicitPort ? "explicit" : "default"}`
  return await getCachedStatus(key, async () => {
    const server = resolveConfiguredMinecraftServer(address, targets) ?? await resolvePublicMinecraftServer(address)
    try {
      return await pingMinecraftServer(server)
    } catch (error) {
      console.warn("Minecraft status request failed", {
        address: `${address.host}:${server.port}`,
        reason: error instanceof Error ? error.message : "Unknown error",
      })
      return { address: `${server.host}:${server.port}`, online: false }
    }
  })
}
