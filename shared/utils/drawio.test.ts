import { describe, expect, it } from "vitest"
import {
  buildExitAction,
  buildExportRequestAction,
  buildLoadAction,
  dataUrlToBlob,
  DRAWIO_ORIGIN,
  EMPTY_DIAGRAM_XML,
  parseDrawioMessage,
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
