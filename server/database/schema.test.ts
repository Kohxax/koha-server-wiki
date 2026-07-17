import process from "node:process"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import * as schema from "./schema"
import { requireTestDatabaseUrl } from "./test-url"

const url = requireTestDatabaseUrl(process.env.TEST_DATABASE_URL)

const client = postgres(url)
const db = drizzle(client, { schema })

beforeAll(async () => {
  await db.delete(schema.pageRevisions)
  await db.delete(schema.media)
  await db.delete(schema.pages)
  await db.delete(schema.settings)
  await db.delete(schema.users)
})

afterAll(async () => {
  await client.end()
})

describe("schema crud", () => {
  it("creates a user and enforces unique discordId", async () => {
    const [user] = await db.insert(schema.users).values({
      discordId: "123456789",
      username: "koha",
      role: "admin",
    }).returning()

    expect(user.id).toBeTypeOf("number")
    expect(user.role).toBe("admin")

    await expect(db.insert(schema.users).values({
      discordId: "123456789",
      username: "dup",
    })).rejects.toThrow()
  })

  it("creates a page, revision, and media tied to the user", async () => {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.discordId, "123456789"))

    const [page] = await db.insert(schema.pages).values({
      path: "home",
      title: "ホーム",
      description: "こは鯖のトップページ",
      content: "# ようこそ",
      createdBy: user.id,
      updatedBy: user.id,
    }).returning()

    expect(page.path).toBe("home")
    expect(page.description).toBe("こは鯖のトップページ")

    const [revision] = await db.insert(schema.pageRevisions).values({
      pageId: page.id,
      title: page.title,
      description: page.description,
      content: page.content,
      editedBy: user.id,
    }).returning()

    expect(revision.pageId).toBe(page.id)

    const [file] = await db.insert(schema.media).values({
      filename: "abc123.webp",
      originalName: "screenshot.png",
      mime: "image/webp",
      size: 1024,
      kind: "image",
      uploadedBy: user.id,
    }).returning()

    expect(file.kind).toBe("image")

    await expect(db.insert(schema.pages).values({
      path: "home",
      title: "dup",
      content: "dup",
    })).rejects.toThrow()
  })

  it("stores jsonb settings", async () => {
    const [setting] = await db.insert(schema.settings).values({
      key: "sidebar_mode",
      value: "auto",
    }).returning()

    expect(setting.value).toBe("auto")

    const [updated] = await db.update(schema.settings)
      .set({ value: { mode: "manual" } })
      .where(eq(schema.settings.key, "sidebar_mode"))
      .returning()

    expect(updated.value).toEqual({ mode: "manual" })
  })
})
