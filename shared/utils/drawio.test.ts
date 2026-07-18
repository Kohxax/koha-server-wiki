import { describe, expect, it } from "vitest"
import { parseMarkdown } from "@nuxtjs/mdc/runtime"
import {
  buildExitAction,
  buildExportRequestAction,
  buildLoadAction,
  createDiagramMarkdown,
  dataUrlToBlob,
  DRAWIO_ORIGIN,
  EMPTY_DIAGRAM_XML,
  parseDrawioMessage,
  shouldHandleDrawioMessage,
} from "./drawio"

describe("parseDrawioMessage", () => {
  it("parses a valid postMessage JSON payload", () => {
    expect(parseDrawioMessage("{\"event\":\"init\"}")).toEqual({ event: "init" })
  })

  it("returns null for invalid JSON", () => {
    expect(parseDrawioMessage("not json")).toBeNull()
  })

  it("returns null for non-object JSON", () => {
    expect(parseDrawioMessage("42")).toBeNull()
    expect(parseDrawioMessage("null")).toBeNull()
  })
})

describe("draw.io postMessage protocol (mocked message flow)", () => {
  it("responds to init with a load action containing the initial xml", () => {
    const initMessage = parseDrawioMessage(JSON.stringify({ event: "init" }))
    expect(initMessage?.event).toBe("init")

    const response = buildLoadAction("<mxGraphModel>existing</mxGraphModel>")
    expect(response).toEqual({ action: "load", xml: "<mxGraphModel>existing</mxGraphModel>", autosave: 1 })
  })

  it("falls back to an empty diagram when no initial xml is provided", () => {
    expect(buildLoadAction("")).toEqual({ action: "load", xml: EMPTY_DIAGRAM_XML, autosave: 1 })
  })

  it("responds to save with an export request carrying the current xml", () => {
    const saveMessage = parseDrawioMessage(JSON.stringify({ event: "save", xml: "<mxGraphModel>edited</mxGraphModel>" }))
    const response = buildExportRequestAction(saveMessage?.xml)
    expect(response).toEqual({ action: "export", format: "xmlsvg", xml: "<mxGraphModel>edited</mxGraphModel>", spin: "保存中..." })
  })

  it("builds an exit action after a successful export", () => {
    expect(buildExitAction()).toEqual({ action: "exit" })
  })

  it("only trusts messages from the draw.io origin", () => {
    expect(DRAWIO_ORIGIN).toBe("https://embed.diagrams.net")
  })

  it("only lets the active dialog handle messages from its own iframe", () => {
    const activeIframe = {} as Window
    const anotherIframe = {} as Window

    expect(shouldHandleDrawioMessage({
      origin: DRAWIO_ORIGIN,
      isOpen: true,
      source: activeIframe,
      iframeWindow: activeIframe,
    })).toBe(true)
    expect(shouldHandleDrawioMessage({
      origin: DRAWIO_ORIGIN,
      isOpen: false,
      source: activeIframe,
      iframeWindow: activeIframe,
    })).toBe(false)
    expect(shouldHandleDrawioMessage({
      origin: DRAWIO_ORIGIN,
      isOpen: true,
      source: anotherIframe,
      iframeWindow: activeIframe,
    })).toBe(false)
  })
})

describe("dataUrlToBlob", () => {
  it("decodes a base64 svg data url into a Blob with the correct mime type", async () => {
    const svg = "<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>"
    const base64 = Buffer.from(svg, "utf8").toString("base64")
    const blob = dataUrlToBlob(`data:image/svg+xml;base64,${base64}`)

    expect(blob.type).toBe("image/svg+xml")
    const text = await blob.text()
    expect(text).toBe(svg)
  })
})

describe("createDiagramMarkdown", () => {
  it("uses the re-editable MDC diagram format for newly created diagrams", () => {
    expect(createDiagramMarkdown({ id: 42, filename: "diagram.svg" })).toBe(
      "::diagram{src=\"/uploads/diagram.svg\" media-id=\"42\"}\n::",
    )
  })

  it("is parsed as an MDC diagram component", async () => {
    const markdown = createDiagramMarkdown({ id: 42, filename: "diagram.svg" })
    const parsed = await parseMarkdown(markdown)

    expect(parsed.body.children).toEqual(expect.arrayContaining([
      expect.objectContaining({
        tag: "diagram",
        props: { src: "/uploads/diagram.svg", "media-id": "42" },
      }),
    ]))
  })

  it("passes diagram body text to the default slot for captions", async () => {
    const parsed = await parseMarkdown(
      "::diagram{src=\"/uploads/diagram.svg\" media-id=\"42\"}\n農場の配置図\n::",
    )

    expect(parsed.body.children).toEqual(expect.arrayContaining([
      expect.objectContaining({
        tag: "diagram",
        children: [
          expect.objectContaining({
            tag: "p",
            children: [{ type: "text", value: "農場の配置図" }],
          }),
        ],
      }),
    ]))
  })
})
