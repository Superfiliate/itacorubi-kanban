import { Page, expect, Locator } from "@playwright/test";

/**
 * Waits for the task sidebar to be visible
 * Use this after clicking to create/open a task
 */
export async function waitForSidebarOpen(page: Page): Promise<Locator> {
  // The sidebar uses a Sheet which is a Radix Dialog
  // We identify it by the presence of the Back button
  const sidebar = page.getByRole("dialog");
  const backButton = sidebar.getByRole("button", { name: /back/i });
  await expect(backButton).toBeVisible();
  return sidebar;
}

/**
 * Waits for the task sidebar to be closed
 * Use this after clicking the back button to close the sidebar
 */
export async function waitForSidebarClose(page: Page): Promise<void> {
  // Wait for the back button in any dialog to not be visible
  // This is specific to the task sidebar which always has a back button
  const backButton = page.getByRole("button", { name: /back/i });
  await expect(backButton).not.toBeVisible();
}

/**
 * Creates a board via the UI and returns the board ID from the URL
 */
export async function createTestBoard(
  page: Page,
  title: string = "Test Board",
  password: string = "testpass123",
): Promise<string> {
  // Navigate to homepage
  await page.goto("/");

  // Click "Create a Board" button
  await page.getByRole("button", { name: /create.*board/i }).click();

  // Fill in the board creation form
  await page.getByLabel(/title/i).fill(title);
  await page.getByLabel(/password/i).fill(password);

  // Submit the form and wait for navigation
  await page.getByRole("button", { name: /create/i }).click();

  // Wait for either board page or unlock page (cookie timing can vary in tests)
  await page.waitForURL(/\/boards\/[a-f0-9-]+(\/unlock)?$/);

  // Extract board ID from URL (works for both /boards/{id} and /boards/{id}/unlock)
  const url = page.url();
  const match = url.match(/\/boards\/([a-f0-9-]+)(?:\/unlock)?$/);
  if (!match) throw new Error(`Failed to extract board ID from URL: ${url}`);
  const boardId = match[1];

  // If we landed on unlock page, unlock using the provided password
  if (url.endsWith("/unlock")) {
    await unlockTestBoard(page, boardId, password);
  } else {
    // Wait for header to ensure page is rendered
    await page.waitForSelector("header");
  }

  return boardId;
}

/**
 * Unlocks a board by navigating to the unlock page and entering the password
 */
export async function unlockTestBoard(
  page: Page,
  boardId: string,
  password: string,
): Promise<void> {
  // Navigate to unlock page
  await page.goto(`/boards/${boardId}/unlock`);

  // Fill in password
  await page.getByLabel(/password/i).fill(password);

  // Click unlock button and wait for navigation
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes(`/boards/${boardId}`) &&
        !response.url().includes("/unlock") &&
        response.status() === 200,
    ),
    page.getByRole("button", { name: /unlock.*board/i }).click(),
  ]);

  // Wait for header to ensure page is rendered
  await page.waitForSelector("header");
}

/**
 * Waits for the board to be fully loaded
 * Uses global timeout configuration (10s)
 */
export async function waitForBoardLoad(page: Page): Promise<void> {
  // Wait for board header and at least one column to be visible
  // Using Promise.all for parallel waiting instead of sequential
  await Promise.all([
    page.waitForSelector("header"),
    page.waitForSelector("text=/.*to do|.*doing|.*done|.*archive/i"),
  ]);
}

/**
 * Gets the test database context
 * Returns the database URL for test database
 */
export function getTestContext(): { databaseUrl: string } {
  return {
    databaseUrl: "file:test.db",
  };
}
