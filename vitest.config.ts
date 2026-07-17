import process from "node:process"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

try {
  process.loadEnvFile(".env")
}
catch {
  // CI may inject TEST_DATABASE_URL directly.
}

export default defineConfig({
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "shared/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "~": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
})
