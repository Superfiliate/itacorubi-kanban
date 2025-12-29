import { test, expect, Page } from "@playwright/test";
import {
  createTestBoard,
  waitForBoardLoad,
  waitForSidebarOpen,
  waitForSidebarClose,
} from "./utils/playwright";

/**
 * Helper to set up a contributor with an email address
 */
async function createContributorWithEmail(
  page: Page,
  email: string,
): Promise<void> {
  // Open contributors dialog
  await page.getByRole("button", { name: /manage contributors/i }).click();
  const dialog = page.getByRole("dialog", { name: /contributors/i });
  await expect(dialog).toBeVisible();

  // Click on "Add email for notifications" button for this contributor
  const addEmailButton = dialog.getByTitle(/click to add email/i);
  await addEmailButton.click();

  // Now the email input should be visible
  const emailInput = dialog.getByPlaceholder("email@example.com");
  await expect(emailInput).toBeVisible();
  await emailInput.fill(email);
  await emailInput.press("Enter");

  // Wait for the email to be displayed (confirms it was saved)
  await expect(dialog.getByText(email)).toBeVisible();

  // Close dialog
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();

  // Wait for the outbox to flush
  await page.waitForTimeout(500);
}

/**
 * Helper to process notifications via API
 */
async function processNotifications(page: Page): Promise<void> {
  await page.request.post("/api/dev/emails");
}

/**
 * Helper to clear all sent emails via API
 */
async function clearSentEmails(page: Page): Promise<void> {
  await page.request.delete("/api/dev/emails");
}

/**
 * Helper to get sent emails via API
 */
async function getSentEmails(page: Page): Promise<{
  emails: Array<{
    id: string;
    fromEmail: string;
    recipientEmail: string;
    recipientName: string;
    subject: string;
    boardTitle: string;
    sentToResend: boolean;
  }>;
}> {
  const response = await page.request.get("/api/dev/emails");
  return response.json();
}

/**
 * Helper to get a single email with full content
 */
async function getEmailById(
  page: Page,
  id: string,
): Promise<{
  email: {
    id: string;
    fromEmail: string;
    recipientEmail: string;
    recipientName: string;
    subject: string;
    boardTitle: string;
    htmlContent: string;
    notificationIds: string;
    sentToResend: boolean;
  };
}> {
  const response = await page.request.get(`/api/dev/emails/${id}`);
  return response.json();
}

test.describe("Email Notifications", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing emails before each test
    await clearSentEmails(page);
  });

  test("should send email notification when task is moved to different column", async ({
    page,
  }) => {
    // Create board and task
    await createTestBoard(page, "Move Notification Test", "testpass123");
    await waitForBoardLoad(page);

    // Create a task
    await page.getByRole("button", { name: /add task/i }).first().click();
    const sidebar = await waitForSidebarOpen(page);

    // Create an assignee with email
    const assigneesSelect = sidebar.getByRole("combobox", { name: /assignees/i });
    await assigneesSelect.click();
    await page.getByPlaceholder(/search or create/i).fill("Move Watcher");
    await page.getByRole("option", { name: /create.*move watcher/i }).click();

    // Wait for assignment to persist
    await expect(sidebar.locator("span").filter({ hasText: "Move Watcher" }).first()).toBeVisible();

    // Close sidebar
    await sidebar.getByRole("button", { name: /back/i }).click();
    await waitForSidebarClose(page);

    // Wait for sync
    await page.waitForTimeout(500);

    // Add email to the assignee
    await createContributorWithEmail(page, "watcher@example.com");

    // Re-open task and move it via Status dropdown
    await page.getByRole("link", { name: /open task.*new task/i }).click();
    const sidebar2 = await waitForSidebarOpen(page);

    const statusLabel = sidebar2.getByText("Status");
    const statusSelect = statusLabel.locator("..").getByRole("combobox");
    await statusSelect.click();
    await page.getByRole("option", { name: /doing/i }).click();

    // Wait for move to persist
    await page.waitForTimeout(500);

    // Close sidebar
    await sidebar2.getByRole("button", { name: /back/i }).click();
    await waitForSidebarClose(page);

    // Process notifications via API
    await processNotifications(page);

    // Verify email was captured - filter by board to avoid isolation issues
    const { emails } = await getSentEmails(page);
    const moveEmails = emails.filter((e) => e.boardTitle === "Move Notification Test");

    expect(moveEmails.length).toBeGreaterThan(0);

    const emailMeta = moveEmails.find((e) => e.recipientEmail === "watcher@example.com");
    expect(emailMeta).toBeDefined();

    // Get full email content to verify
    const { email } = await getEmailById(page, emailMeta!.id);
    expect(email.htmlContent).toContain("moved task from");
    expect(email.htmlContent).toContain("To do");
    expect(email.htmlContent).toContain("Doing");

    // Verify from address is saved
    expect(email.fromEmail).toBeDefined();
    expect(email.fromEmail).toMatch(/@/); // Should be a valid email address
  });

  test("dev email API should be accessible in test environment", async ({ page }) => {
    // Verify the email API is accessible
    const response = await page.request.get("/api/dev/emails");
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("emails");
    expect(Array.isArray(data.emails)).toBe(true);
  });

  test("should be able to clear sent emails", async ({ page }) => {
    // Clear should work without errors
    const response = await page.request.delete("/api/dev/emails");
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.message).toBe("All sent emails cleared");
  });

  test("should be able to trigger notification processing", async ({ page }) => {
    // Trigger should work without errors
    const response = await page.request.post("/api/dev/emails");
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("message");
  });

  test("should save from email address in sent emails", async ({ page }) => {
    // Create board and task with assignee
    await createTestBoard(page, "From Address Test", "testpass123");
    await waitForBoardLoad(page);

    // Create a task
    await page.getByRole("button", { name: /add task/i }).first().click();
    const sidebar = await waitForSidebarOpen(page);

    // Create an assignee
    const assigneesSelect = sidebar.getByRole("combobox", { name: /assignees/i });
    await assigneesSelect.click();
    await page.getByPlaceholder(/search or create/i).fill("From Test User");
    await page.getByRole("option", { name: /create.*from test user/i }).click();

    // Wait for assignment to persist
    await expect(
      sidebar.locator("span").filter({ hasText: "From Test User" }).first(),
    ).toBeVisible();

    // Close sidebar
    await sidebar.getByRole("button", { name: /back/i }).click();
    await waitForSidebarClose(page);
    await page.waitForTimeout(500);

    // Add email to the assignee
    await createContributorWithEmail(page, "fromtest@example.com");

    // Re-open task and move it to trigger notification
    await page.getByRole("link", { name: /open task.*new task/i }).click();
    const sidebar2 = await waitForSidebarOpen(page);

    const statusLabel = sidebar2.getByText("Status");
    const statusSelect = statusLabel.locator("..").getByRole("combobox");
    await statusSelect.click();
    await page.getByRole("option", { name: /doing/i }).click();
    await page.waitForTimeout(500);

    await sidebar2.getByRole("button", { name: /back/i }).click();
    await waitForSidebarClose(page);

    // Process notifications
    await processNotifications(page);

    // Verify email has from address in list response
    const { emails } = await getSentEmails(page);
    const testEmails = emails.filter((e) => e.boardTitle === "From Address Test");
    expect(testEmails.length).toBeGreaterThan(0);

    const emailMeta = testEmails[0];
    expect(emailMeta.fromEmail).toBeDefined();
    expect(emailMeta.fromEmail).toBe("notifications@resend.dev"); // Default from address

    // Verify from address in full email response
    const { email } = await getEmailById(page, emailMeta.id);
    expect(email.fromEmail).toBe("notifications@resend.dev");
  });
});
