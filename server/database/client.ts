import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import * as schema from "./schema"

let _client: ReturnType<typeof postgres> | undefined
let _db: ReturnType<typeof drizzle<typeof schema>> | undefined

export function useDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL
    if (!url)
      throw new Error("DATABASE_URL is not set")
    _client = postgres(url)
    _db = drizzle(_client, { schema })
  }
  return _db
}
