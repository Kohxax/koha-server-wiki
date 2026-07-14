import { relations } from "drizzle-orm"
import { integer, jsonb, pgEnum, pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core"

export const userRole = pgEnum("user_role", ["admin", "editor", "viewer"])
export const mediaKind = pgEnum("media_kind", ["image", "diagram"])

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  discordId: text("discord_id").notNull().unique(),
  username: text("username").notNull(),
  avatarUrl: text("avatar_url"),
  role: userRole("role").notNull().default("viewer"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  path: text("path").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const pageRevisions = pgTable("page_revisions", {
  id: serial("id").primaryKey(),
  pageId: integer("page_id").notNull().references(() => pages.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  editedBy: integer("edited_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  kind: mediaKind("kind").notNull().default("image"),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [
  unique().on(table.filename),
])

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
})

export const usersRelations = relations(users, ({ many }) => ({
  createdPages: many(pages, { relationName: "createdPages" }),
  updatedPages: many(pages, { relationName: "updatedPages" }),
  revisions: many(pageRevisions),
  media: many(media),
}))

export const pagesRelations = relations(pages, ({ one, many }) => ({
  creator: one(users, { fields: [pages.createdBy], references: [users.id], relationName: "createdPages" }),
  updater: one(users, { fields: [pages.updatedBy], references: [users.id], relationName: "updatedPages" }),
  revisions: many(pageRevisions),
}))

export const pageRevisionsRelations = relations(pageRevisions, ({ one }) => ({
  page: one(pages, { fields: [pageRevisions.pageId], references: [pages.id] }),
  editor: one(users, { fields: [pageRevisions.editedBy], references: [users.id] }),
}))

export const mediaRelations = relations(media, ({ one }) => ({
  uploader: one(users, { fields: [media.uploadedBy], references: [users.id] }),
}))

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Page = typeof pages.$inferSelect
export type NewPage = typeof pages.$inferInsert
export type PageRevision = typeof pageRevisions.$inferSelect
export type Media = typeof media.$inferSelect
export type NewMedia = typeof media.$inferInsert
export type Setting = typeof settings.$inferSelect
