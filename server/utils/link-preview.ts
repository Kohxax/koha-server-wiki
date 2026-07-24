import { lookup } from "node:dns/promises"
import net from "node:net"

const CACHE_TTL_MS = 24 * 60 * 60 * 1_000
const MAX_CACHE_ENTRIES = 200
const MAX_HTML_BYTES = 512 * 1_024
const REQUEST_TIMEOUT_MS = 5_000
const MAX_REDIRECTS = 3

interface CachedPreview {
  expiresAt: number
  value: ExternalLinkPreview
}

export interface ExternalLinkPreview {
  title: string
  description: string | null
  imageUrl: string | null
  siteName: string | null
}

const previewCache = new Map<string, CachedPreview>()
const pendingPreviews = new Map<string, Promise<ExternalLinkPreview>>()

function isUnsafeAddress(address: string): boolean {
  if (net.isIP(address) === 4) {
    const [first, second] = address.split(".").map(Number)
    return first === 0
      || first === 10
      || first === 127
      || first! >= 224
      || (first === 100 && second! >= 64 && second! <= 127)
      || (first === 169 && second === 254)
      || (first === 172 && second! >= 16 && second! <= 31)
      || (first === 192 && (second === 0 || second === 168))
      || (first === 198 && (second === 18 || second === 19))
  }

  if (net.isIP(address) === 6) {
    const value = address.toLowerCase()
    const mappedV4 = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    return value === "::"
      || value === "::1"
      || value.startsWith("fc")
      || value.startsWith("fd")
      || /^fe[89ab]/.test(value)
      || (mappedV4 ? isUnsafeAddress(mappedV4[1]!) : false)
  }

  return true
}

async function assertSafeDestination(url: URL) {
  if (url.protocol !== "https:" || !url.hostname || url.username || url.password || net.isIP(url.hostname))
    throw new Error("Unsupported preview URL")

  const addresses = await lookup(url.hostname, { all: true, verbatim: true })
  if (!addresses.length || addresses.some(({ address }) => isUnsafeAddress(address)))
    throw new Error("Unsafe preview destination")
}

function decodeHtmlEntities(value: string): string {
  const named: Record<string, string> = { amp: "&", apos: "'", gt: ">", lt: "<", quot: '"' }
  return value.replace(/&(#x[\da-f]+|#\d+|amp|apos|gt|lt|quot);/gi, (entity, code: string) => {
    if (code[0] !== "#")
      return named[code.toLowerCase()] ?? entity
    const value = Number.parseInt(code.slice(code[1]?.toLowerCase() === "x" ? 2 : 1), code[1]?.toLowerCase() === "x" ? 16 : 10)
    return Number.isFinite(value) ? String.fromCodePoint(value) : entity
  })
}

function normalizeText(value: string | undefined, maxLength = 500): string | null {
  if (!value)
    return null
  const text = decodeHtmlEntities(value).replace(/\s+/g, " ").trim()
  return text ? text.slice(0, maxLength) : null
}

function attributesFromTag(tag: string): Map<string, string> {
  const attributes = new Map<string, string>()
  for (const match of tag.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
    const name = match[1]?.toLowerCase()
    const value = match[2] ?? match[3] ?? match[4]
    if (name && value !== undefined)
      attributes.set(name, value)
  }
  return attributes
}

function metadata(html: string, name: string): string | null {
  for (const tag of html.match(/<meta\s+[^>]*>/gi) ?? []) {
    const attributes = attributesFromTag(tag)
    if (attributes.get("property")?.toLowerCase() === name || attributes.get("name")?.toLowerCase() === name)
      return normalizeText(attributes.get("content"))
  }
  return null
}

function titleFromDocument(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return normalizeText(match?.[1])
}

function safeImageUrl(value: string | null, pageUrl: URL): string | null {
  if (!value)
    return null
  try {
    const imageUrl = new URL(value, pageUrl)
    return imageUrl.protocol === "https:" ? imageUrl.href : null
  } catch {
    return null
  }
}

async function readHtml(response: Response): Promise<string> {
  const contentLength = Number(response.headers.get("content-length"))
  if (Number.isFinite(contentLength) && contentLength > MAX_HTML_BYTES)
    throw new Error("Preview document is too large")
  if (!response.body)
    return ""

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const chunks: string[] = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done)
      break
    size += value.byteLength
    if (size > MAX_HTML_BYTES) {
      await reader.cancel()
      throw new Error("Preview document is too large")
    }
    chunks.push(decoder.decode(value, { stream: true }))
  }
  chunks.push(decoder.decode())
  return chunks.join("")
}

async function fetchPreviewDocument(initialUrl: URL): Promise<{ html: string, url: URL }> {
  let url = initialUrl
  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    await assertSafeDestination(url)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    try {
      const response = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: { Accept: "text/html,application/xhtml+xml" },
      })
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location")
        if (!location)
          throw new Error("Preview redirect has no location")
        url = new URL(location, url)
        continue
      }
      if (!response.ok || !response.headers.get("content-type")?.toLowerCase().includes("text/html"))
        throw new Error("Preview URL did not return HTML")
      return { html: await readHtml(response), url }
    } finally {
      clearTimeout(timer)
    }
  }
  throw new Error("Too many preview redirects")
}

async function fetchExternalLinkPreview(rawUrl: string): Promise<ExternalLinkPreview> {
  if (rawUrl.length > 2_000)
    throw new Error("Preview URL is too long")
  const url = new URL(rawUrl)
  if (url.protocol !== "https:")
    throw new Error("Only HTTPS previews are supported")

  const { html, url: finalUrl } = await fetchPreviewDocument(url)
  return {
    title: metadata(html, "og:title") ?? titleFromDocument(html) ?? finalUrl.hostname,
    description: metadata(html, "og:description") ?? metadata(html, "description"),
    imageUrl: safeImageUrl(metadata(html, "og:image"), finalUrl),
    siteName: metadata(html, "og:site_name"),
  }
}

export async function getExternalLinkPreview(rawUrl: string): Promise<ExternalLinkPreview> {
  const cached = previewCache.get(rawUrl)
  if (cached && cached.expiresAt > Date.now())
    return cached.value

  const pending = pendingPreviews.get(rawUrl)
  if (pending)
    return await pending

  const request = fetchExternalLinkPreview(rawUrl)
  pendingPreviews.set(rawUrl, request)
  try {
    const value = await request
    if (previewCache.size >= MAX_CACHE_ENTRIES)
      previewCache.delete(previewCache.keys().next().value!)
    previewCache.set(rawUrl, { value, expiresAt: Date.now() + CACHE_TTL_MS })
    return value
  } finally {
    pendingPreviews.delete(rawUrl)
  }
}
