export const DRAWIO_ORIGIN = "https://embed.diagrams.net"

export const EMPTY_DIAGRAM_XML = "<mxGraphModel dx=\"800\" dy=\"600\" grid=\"1\" gridSize=\"10\" guides=\"1\" tooltips=\"1\" connect=\"1\" arrows=\"1\" fold=\"1\" page=\"1\" pageScale=\"1\" pageWidth=\"850\" pageHeight=\"1100\" math=\"0\" shadow=\"0\"><root><mxCell id=\"0\" /><mxCell id=\"1\" parent=\"0\" /></root></mxGraphModel>"

export interface DrawioMessage {
  event?: string
  xml?: string
  data?: string
  [key: string]: unknown
}

export function parseDrawioMessage(raw: string): DrawioMessage | null {
  try {
    const parsed = JSON.parse(raw)
    return typeof parsed === "object" && parsed !== null ? parsed as DrawioMessage : null
  } catch {
    return null
  }
}

export function buildLoadAction(xml: string) {
  return { action: "load", xml: xml || EMPTY_DIAGRAM_XML, autosave: 1 }
}

export function buildExportRequestAction(xml: unknown) {
  return { action: "export", format: "xmlsvg", xml, spin: "保存中..." }
}

export function buildExitAction() {
  return { action: "exit" }
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",")
  const mimeMatch = /data:(.*);base64/.exec(header ?? "")
  const mime = mimeMatch?.[1] ?? "image/svg+xml"
  const binary = atob(base64 ?? "")
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}
