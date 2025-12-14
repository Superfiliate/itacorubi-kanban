import { execSync } from "child_process"
import { existsSync, unlinkSync } from "fs"
import path from "path"

const TEST_DB_PATH = path.join(process.cwd(), "test.db")
const TEST_DB_JOURNAL_PATH = path.join(process.cwd(), "test.db-journal")

/**
 * Resets the test database by deleting it and running migrations
 * Note: This should be called before tests run, not during test execution
 * to avoid database lock issues
 */
export function resetTestDb() {
  // Delete test database if it exists
  try {
    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH)
    }
    if (existsSync(TEST_DB_JOURNAL_PATH)) {
      unlinkSync(TEST_DB_JOURNAL_PATH)
    }
  } catch (error) {
    // Ignore errors if file is locked or doesn't exist
    console.warn("Could not delete test database:", error)
  }

  // Run database migrations to create fresh schema
  try {
    execSync("pnpm db:migrate", {
      env: {
        ...process.env,
        TURSO_DATABASE_URL: "file:test.db",
      },
      stdio: "pipe",
      cwd: process.cwd(),
    })
  } catch (error) {
    console.error("Failed to initialize test database:", error)
    throw error
  }
}

/**
 * Cleans up the test database after tests
 */
export function cleanupTestDb() {
  if (existsSync(TEST_DB_PATH)) {
    unlinkSync(TEST_DB_PATH)
  }
  if (existsSync(TEST_DB_JOURNAL_PATH)) {
    unlinkSync(TEST_DB_JOURNAL_PATH)
  }
}

/**
 * Sets up the test database environment
 */
export function setupTestDb() {
  // Ensure test database is clean
  resetTestDb()
}
