import { test, expect } from "@playwright/test";
import {
  createTestBoard,
  waitForBoardLoad,
  waitForSidebarOpen,
  waitForSidebarClose,
} from "./utils/playwright";

test.describe("Comments", () => {
  // Note: Basic "add comment" is covered by the polling persistence test below

  test("should remember author selection and update comment count", async ({ page }) => {
    // This test combines author memory and comment count verification
    await createTestBoard(page, "Author Memory Test", "testpass123");
    await waitForBoardLoad(page);

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

  test("should edit a comment", async ({ page }) => {
    await createTestBoard(page, "Edit Comment Test", "testpass123");
    await waitForBoardLoad(page);

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
    await createTestBoard(page, "Delete Comment Test", "testpass123");
    await waitForBoardLoad(page);

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
});
