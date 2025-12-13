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

  // Submit the form and wait for navigation
  // Use response wait for faster detection - wait for the board page to load
  const [response] = await Promise.all([
    page.waitForResponse((response) => response.url().includes('/boards/') && response.status() === 200),
    page.getByRole("button", { name: /create/i }).click(),
  ])

  // Wait for header to ensure page is rendered
  await page.waitForSelector('header')

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

  // Click unlock button and wait for navigation
  const [response] = await Promise.all([
    page.waitForResponse((response) => response.url().includes(`/boards/${boardId}`) && !response.url().includes('/unlock') && response.status() === 200),
    page.getByRole("button", { name: /unlock.*board/i }).click(),
  ])

  // Wait for header to ensure page is rendered
  await page.waitForSelector('header')
}

/**
 * Waits for the board to be fully loaded
 * Uses global timeout configuration (10s)
 */
export async function waitForBoardLoad(page: Page): Promise<void> {
  // Wait for board header and at least one column to be visible
  // Using Promise.all for parallel waiting instead of sequential
  await Promise.all([
    page.waitForSelector('header'),
    page.waitForSelector('text=/.*to do|.*doing|.*done/i'),
  ])
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
