import { Page, expect } from "@playwright/test"

/**
 * Creates a board via the UI and returns the board ID from the URL
 */
export async function createTestBoard(page: Page, title: string = "Test Board", password: string = "testpass123"): Promise<string> {
  // Navigate to homepage
  await page.goto("/")

  // Click "Create a Board" button
  await page.getByRole("button", { name: /create.*board/i }).click()

  // Fill in the board creation form
  await page.getByLabel(/title/i).fill(title)
  await page.getByLabel(/password/i).fill(password)

  // Submit the form
  await page.getByRole("button", { name: /create/i }).click()

  // Wait for redirect to board page
  await page.waitForURL(/\/boards\/[a-f0-9-]+$/, { timeout: 10000 })

  // Extract board ID from URL
  const url = page.url()
  const match = url.match(/\/boards\/([a-f0-9-]+)$/)
  if (!match) {
    throw new Error(`Failed to extract board ID from URL: ${url}`)
  }

  return match[1]
}

/**
 * Unlocks a board by navigating to the unlock page and entering the password
 */
export async function unlockTestBoard(page: Page, boardId: string, password: string): Promise<void> {
  // Navigate to unlock page
  await page.goto(`/boards/${boardId}/unlock`)

  // Fill in password
  await page.getByLabel(/password/i).fill(password)

  // Click unlock button
  await page.getByRole("button", { name: /unlock.*board/i }).click()

  // Wait for redirect to board page
  await page.waitForURL(`/boards/${boardId}`, { timeout: 10000 })
}

/**
 * Waits for the board to be fully loaded
 */
export async function waitForBoardLoad(page: Page): Promise<void> {
  // Wait for board header to be visible
  await page.waitForSelector('header', { timeout: 10000 })

  // Wait for at least one column to be visible (look for column text like "To do", "Doing", "Done" - may have emoji prefix)
  await page.waitForSelector('text=/.*to do|.*doing|.*done/i', { timeout: 10000 })
}

/**
 * Gets the test database context
 * Returns the database URL for test database
 */
export function getTestContext(): { databaseUrl: string } {
  return {
    databaseUrl: "file:test.db",
  }
}
