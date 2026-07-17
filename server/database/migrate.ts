import process from "node:process"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"

try {
  process.loadEnvFile(".env")
}
catch {
  // CI and production inject environment variables directly.
}

const url = process.env.DATABASE_URL
if (!url)
  throw new Error("DATABASE_URL is not set")

const client = postgres(url, { max: 1 })
const db = drizzle(client)

await migrate(db, { migrationsFolder: "./server/database/migrations" })
await client.end()

// eslint-disable-next-line no-console
console.log("Migrations applied.")
