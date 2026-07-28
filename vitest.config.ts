import process from "node:process"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

try {
  process.loadEnvFile(".env")
}
catch {
  // CI may inject TEST_DATABASE_URL directly.
}

// resolve.alias isn't inherited from the root config by `test.projects`
// entries, so each project below repeats it explicitly.
const alias = {
  "~": fileURLToPath(new URL(".", import.meta.url)),
}

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          environment: "node",
          include: ["app/**/*.test.ts", "server/**/*.test.ts", "shared/**/*.test.ts"],
          exclude: ["server/database/schema.test.ts"],
        },
      },
      {
        resolve: { alias },
        test: {
          name: "integration",
          environment: "node",
          include: ["server/database/schema.test.ts"],
        },
      },
    ],
  },
})
