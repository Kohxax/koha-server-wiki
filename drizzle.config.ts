import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./server/database/schema.ts",
  out: "./server/database/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://koha:koha@localhost:5432/koha_wiki",
  },
})
