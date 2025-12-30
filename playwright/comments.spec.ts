import { test, expect, Page } from "@playwright/test";
import {
  seedAndNavigateToBoard,
  waitForSidebarOpen,
  waitForSidebarClose,
} from "./utils/playwright";

/**
 * Helper to set up a comment editor with an author selected.
 * Returns the editor element ready for content input.
 */
async function setupCommentEditor(page: Page, boardName: string) {
  await seedAndNavigateToBoard(page, { title: boardName });

  // Create a task
  const addTaskButton = page.getByRole("button", { name: /add task/i }).first();
  await addTaskButton.click();
  const sidebar = await waitForSidebarOpen(page);

  // Create an author
  const authorSelect = sidebar.getByRole("combobox", { name: /who are you/i });
  await authorSelect.click();
  const authorInput = page.getByPlaceholder(/search or create/i);
  await authorInput.fill("Test Author");
  await page.getByRole("option", { name: /create.*test author/i }).click();

  const editor = sidebar.locator('[contenteditable="true"]').first();
  await editor.click();

  return { sidebar, editor };
}

test.describe("Comments", () => {
  // Note: Basic "add comment" is covered by the polling persistence test below

  test("should remember author selection and update comment count", async ({ page }) => {
    // This test combines author memory and comment count verification
    await seedAndNavigateToBoard(page, { title: "Author Memory Test" });

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first();
    await addTaskButton.click();
    const sidebar = await waitForSidebarOpen(page);

    // Before selecting author, should show "Missing an author" disabled reason
    await expect(sidebar.getByText(/missing an author/i)).toBeVisible();

    // Create an author and add a comment
    const authorSelect = sidebar.getByRole("combobox", { name: /who are you/i });
    await authorSelect.click();
    const authorInput = page.getByPlaceholder(/search or create/i);
    await authorInput.fill("Remembered Author");
    await page.getByRole("option", { name: /create.*remembered author/i }).click();

    // After selecting author but before writing, should show "Missing content"
    await expect(sidebar.getByText(/missing content/i)).toBeVisible();

    const editor = sidebar.locator('[contenteditable="true"]').first();
    await editor.click();
    await editor.fill("First comment");

    // After writing content, disabled reason should not be visible
    await expect(sidebar.getByText(/missing an author|missing content/i)).not.toBeVisible();

    await page.getByRole("button", { name: /add comment/i }).click();
    await expect(page.getByText(/comment added/i)).toBeVisible();

    // Close sidebar using Back button
    await sidebar.getByRole("button", { name: /back/i }).click();
    await waitForSidebarClose(page);

    // Verify comment count shows on task card
    const taskCard = page
      .getByText(/new task/i)
      .locator("..")
      .locator("..");
    await expect(taskCard.getByText(/1/)).toBeVisible();

    // Create another task
    const addTaskButton2 = page.getByRole("button", { name: /add task/i }).first();
    await addTaskButton2.click();
    const sidebar2 = await waitForSidebarOpen(page);

    // Author should be pre-selected
    await expect(sidebar2.getByRole("combobox").getByText(/remembered author/i)).toBeVisible();
  });

  test("should embed YouTube video when pasting a YouTube URL", async ({ page, context }) => {
    const { editor } = await setupCommentEditor(page, "YouTube Embed Test");

    // Grant clipboard permissions
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // Paste a YouTube URL
    const youtubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    await page.evaluate((url) => navigator.clipboard.writeText(url), youtubeUrl);
    await editor.press("ControlOrMeta+v");

    // Wait for the embed to appear (iframe with YouTube embed URL)
    const youtubeEmbed = page.locator('iframe[src*="youtube.com/embed"]');
    await expect(youtubeEmbed).toBeVisible({ timeout: 5000 });

    // Verify the embed has the correct video ID
    await expect(youtubeEmbed).toHaveAttribute("src", /dQw4w9WgXcQ/);
  });

  test("should embed Loom video when pasting a Loom URL", async ({ page, context }) => {
    const { editor } = await setupCommentEditor(page, "Loom Embed Test");

    // Grant clipboard permissions
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // Paste a Loom URL
    const loomUrl = "https://www.loom.com/share/abc123def456";
    await page.evaluate((url) => navigator.clipboard.writeText(url), loomUrl);
    await editor.press("ControlOrMeta+v");

    // Wait for the embed to appear (iframe with Loom embed URL)
    const loomEmbed = page.locator('iframe[src*="loom.com/embed"]');
    await expect(loomEmbed).toBeVisible({ timeout: 5000 });

    // Verify the embed has the correct video ID
    await expect(loomEmbed).toHaveAttribute("src", /abc123def456/);
  });

  test("should edit a comment", async ({ page }) => {
    await seedAndNavigateToBoard(page, { title: "Edit Comment Test" });

    // Create a task and add a comment
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first();
    await addTaskButton.click();
    const sidebar = await waitForSidebarOpen(page);
    const authorSelect = sidebar.getByRole("combobox", { name: /who are you/i });
    await authorSelect.click();
    const authorInput = page.getByPlaceholder(/search or create/i);
    await authorInput.fill("Editor");
    await page.getByRole("option", { name: /create.*editor/i }).click();

    const editor = sidebar.locator('[contenteditable="true"]').first();
    await editor.click();
    await editor.fill("Original comment");
    await page.getByRole("button", { name: /add comment/i }).click();
    await expect(page.getByText(/comment added/i)).toBeVisible();

    // Find the comment and click edit (should be a menu button)
    await page.getByText(/original comment/i).hover();
    await page.getByRole("button", { name: /comment actions/i }).click();

    // Click edit
    await page.getByRole("menuitem", { name: /edit/i }).click();

    // Edit the comment
    const editEditor = page
      .locator('[contenteditable="true"]')
      .filter({ hasText: /original comment/i });
    await editEditor.fill("Edited comment");
    await page.getByRole("button", { name: /save/i }).click();

    // Verify comment was updated
    await expect(page.getByText(/edited comment/i)).toBeVisible();
  });

  test("should delete a comment with confirmation", async ({ page }) => {
    await seedAndNavigateToBoard(page, { title: "Delete Comment Test" });

    // Create a task and add a comment
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first();
    await addTaskButton.click();
    const sidebar = await waitForSidebarOpen(page);
    const authorSelect = sidebar.getByRole("combobox", { name: /who are you/i });
    await authorSelect.click();
    const authorInput = page.getByPlaceholder(/search or create/i);
    await authorInput.fill("Deleter");
    await page.getByRole("option", { name: /create.*deleter/i }).click();

    const editor = sidebar.locator('[contenteditable="true"]').first();
    await editor.click();
    await editor.fill("Comment to delete");
    await page.getByRole("button", { name: /add comment/i }).click();
    await expect(page.getByText(/comment added/i)).toBeVisible();

    // Find comment and delete it
    await page.getByText(/comment to delete/i).hover();
    await page.getByRole("button", { name: /comment actions/i }).click();

    // Click delete
    await page.getByRole("menuitem", { name: /delete/i }).click();

    // Confirm deletion
    const confirmDialog = page.getByRole("dialog", { name: /delete comment/i });
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole("button", { name: /^delete$/i }).click();

    // Comment should be gone
    await expect(page.getByText(/comment to delete/i)).not.toBeVisible();
  });

  test("should show @mention suggestions when typing @", async ({ page }) => {
    await seedAndNavigateToBoard(page, { title: "Mention Suggestions Test" });

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first();
    await addTaskButton.click();
    const sidebar = await waitForSidebarOpen(page);

    // Create an author first
    const authorSelect = sidebar.getByRole("combobox", { name: /who are you/i });
    await authorSelect.click();
    const authorInput = page.getByPlaceholder(/search or create/i);
    await authorInput.fill("Author");
    await page.getByRole("option", { name: /create.*author/i }).click();

    // Create another contributor to mention using the author select dropdown
    await authorSelect.click();
    const mentionInput = page.getByPlaceholder(/search or create/i);
    await mentionInput.fill("Mentionable Person");
    await page.getByRole("option", { name: /create.*mentionable person/i }).click();

    // Now the "Mentionable Person" should be available for mentions
    // Type @ in the editor
    const editor = sidebar.locator('[contenteditable="true"]').first();
    await editor.click();
    await editor.pressSequentially("Hello @Ment");

    // Wait for the mention suggestions dropdown (the one that appears below the editor)
    // The dropdown has a specific structure with a button containing the contributor name
    const mentionDropdown = page
      .locator('[class*="rounded-md border bg-popover"]')
      .getByText("Mentionable Person");
    await expect(mentionDropdown).toBeVisible({ timeout: 3000 });
  });

  test("should insert @mention and trigger notification", async ({ page }) => {
    // Create board with a contributor that has an email
    const { boardId } = await seedAndNavigateToBoard(page, {
      title: "Mention Notification Test",
      contributors: [{ name: "Recipient", email: "recipient@test.com" }],
    });

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first();
    await addTaskButton.click();
    const sidebar = await waitForSidebarOpen(page);

    // Create an author first (so we can use them to write the comment)
    const authorSelect = sidebar.getByRole("combobox", { name: /who are you/i });
    await authorSelect.click();
    const authorInput = page.getByPlaceholder(/search or create/i);
    await authorInput.fill("Comment Author");
    await page.getByRole("option", { name: /create.*comment author/i }).click();

    // Also assign Recipient to the task (to test deduplication: mentioned + assigned = 1 notification)
    const assigneesSelect = sidebar.getByRole("combobox", { name: /assignees/i });
    await assigneesSelect.click();
    await page.getByRole("option", { name: /recipient/i }).first().click();
    await expect(sidebar.locator("span").filter({ hasText: "Recipient" }).first()).toBeVisible();
    // Close assignees dropdown
    await page.keyboard.press("Escape");

    // Type a comment with @mention
    const editor = sidebar.locator('[contenteditable="true"]').first();
    await editor.click();
    await editor.pressSequentially("Hey @Reci");

    // Wait for mention dropdown to appear
    const mentionOption = page
      .locator('[class*="rounded-md border bg-popover"]')
      .getByText("Recipient");
    await expect(mentionOption).toBeVisible({ timeout: 3000 });

    // Use keyboard to select the mention (Enter key)
    await editor.press("Enter");

    // Continue typing
    await editor.pressSequentially(" check this out!");

    // Submit comment
    await page.getByRole("button", { name: /add comment/i }).click();
    await expect(page.getByText(/comment added/i)).toBeVisible();

    // Verify mention is displayed in the comment
    await expect(sidebar.locator(".mention")).toContainText("Recipient");

    // Process notifications
    await page.request.post(`/api/boards/${boardId}/emails`);

    // Check that mention notification was sent
    const response = await page.request.get(`/api/boards/${boardId}/emails`);
    const { emails } = await response.json();

    // Recipient is both assigned AND mentioned, should only get ONE email (not two)
    const recipientEmails = emails.filter(
      (e: { recipientEmail: string }) => e.recipientEmail === "recipient@test.com",
    );
    expect(recipientEmails.length).toBe(1);

    // Verify email content
    const emailResponse = await page.request.get(
      `/api/boards/${boardId}/emails/${recipientEmails[0].id}`,
    );
    const { email } = await emailResponse.json();

    // Should contain "mentioned you" (the more specific notification)
    expect(email.htmlContent).toContain("mentioned you");

    // Should contain "@Recipient" in the preview (the @mention name should be visible)
    expect(email.htmlContent).toContain("@Recipient");

    // Should NOT contain a separate "commented:" line (deduplication worked)
    expect(email.htmlContent).not.toMatch(/commented.*:.*&quot;/);
  });

  test("should show no-email indicator for contributors without email", async ({ page }) => {
    await seedAndNavigateToBoard(page, { title: "No Email Indicator Test" });

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first();
    await addTaskButton.click();
    const sidebar = await waitForSidebarOpen(page);

    // Create an author (which also creates a contributor without email)
    const authorSelect = sidebar.getByRole("combobox", { name: /who are you/i });
    await authorSelect.click();
    const authorInput = page.getByPlaceholder(/search or create/i);
    await authorInput.fill("NoEmail Person");
    await page.getByRole("option", { name: /create.*noemail person/i }).click();

    // Type @ in the editor
    const editor = sidebar.locator('[contenteditable="true"]').first();
    await editor.click();
    await editor.pressSequentially("@NoEmail");

    // Wait for the mention suggestions dropdown
    const mentionPopup = page.locator('[class*="rounded-md border bg-popover"]');
    const mentionDropdown = mentionPopup.getByText("NoEmail Person");
    await expect(mentionDropdown).toBeVisible({ timeout: 3000 });

    // Verify the no-email icon is visible (crossed-out mail icon)
    // The icon is in the popover and has a title
    const noEmailIndicator = mentionPopup.locator('[title*="No email configured"]');
    await expect(noEmailIndicator).toBeVisible();
  });
});
