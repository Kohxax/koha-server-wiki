export function requireTestDatabaseUrl(value: string | undefined): string {
  if (!value)
    throw new Error("TEST_DATABASE_URL is not set")

  let databaseName: string
  try {
    databaseName = decodeURIComponent(new URL(value).pathname.slice(1))
  }
  catch {
    throw new Error("TEST_DATABASE_URL must be a valid database URL")
  }

  if (!databaseName.endsWith("_test"))
    throw new Error("TEST_DATABASE_URL must target a database whose name ends with _test")

  return value
}
