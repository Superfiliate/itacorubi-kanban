import { test, expect } from "@playwright/test"
import { createTestBoard, waitForBoardLoad } from "./utils/playwright"

test.describe("Comments", () => {
  // Note: Basic "add comment" is covered by the polling persistence test below

  test("should remember author selection and update comment count", async ({ page }) => {
    // This test combines author memory and comment count verification
    const boardId = await createTestBoard(page, "Author Memory Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    await page.waitForURL(/task=/)

    const sidebar = page.getByRole("dialog").filter({ hasText: /task details/i }).first()

    // Create an author and add a comment
    const authorSelect = sidebar.getByRole("combobox", { name: /who are you/i })
    await authorSelect.click()
    const authorInput = page.getByPlaceholder(/search or create/i)
    await authorInput.fill("Remembered Author")
    await page.getByRole("option", { name: /create.*remembered author/i }).click()

    const editor = sidebar.locator('[contenteditable="true"]').first()
    await editor.click()
    await editor.fill("First comment")
    await page.getByRole("button", { name: /add comment/i }).click()
    await expect(page.getByText(/comment added/i)).toBeVisible()

    // Close sidebar using Back button
    await sidebar.getByRole("button", { name: /back/i }).click()
    await page.waitForURL(new RegExp(`/boards/${boardId}$`))

    // Verify comment count shows on task card
    const taskCard = page.getByText(/new task/i).locator("..").locator("..")
    await expect(taskCard.getByText(/1/)).toBeVisible()

    // Create another task
    const addTaskButton2 = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton2.click()
    await page.waitForURL(/task=/)

    // Author should be pre-selected
    const sidebar2 = page.getByRole("dialog").filter({ hasText: /task details/i }).first()
    await expect(sidebar2.getByRole("combobox").getByText(/remembered author/i)).toBeVisible()
  })

  test("should edit a comment", async ({ page }) => {
    const boardId = await createTestBoard(page, "Edit Comment Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task and add a comment
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    await page.waitForURL(/task=/)

    // Create author and comment
    const sidebar = page.getByRole("dialog").filter({ hasText: /task details/i }).first()
    const authorSelect = sidebar.getByRole("combobox", { name: /who are you/i })
    await authorSelect.click()
    const authorInput = page.getByPlaceholder(/search or create/i)
    await authorInput.fill("Editor")
    await page.getByRole("option", { name: /create.*editor/i }).click()

    const editor = sidebar.locator('[contenteditable="true"]').first()
    await editor.click()
    await editor.fill("Original comment")
    await page.getByRole("button", { name: /add comment/i }).click()
    await expect(page.getByText(/comment added/i)).toBeVisible()

    // Find the comment and click edit (should be a menu button)
    await page.getByText(/original comment/i).hover()
    await page.getByRole("button", { name: /comment actions/i }).click()

    // Click edit
    await page.getByRole("menuitem", { name: /edit/i }).click()

    // Edit the comment
    const editEditor = page.locator('[contenteditable="true"]').filter({ hasText: /original comment/i })
    await editEditor.fill("Edited comment")
    await page.getByRole("button", { name: /save/i }).click()

    // Verify comment was updated
    await expect(page.getByText(/edited comment/i)).toBeVisible()
  })

  test("should delete a comment with confirmation", async ({ page }) => {
    const boardId = await createTestBoard(page, "Delete Comment Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task and add a comment
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    await page.waitForURL(/task=/)

    // Create author and comment
    const sidebar = page.getByRole("dialog").filter({ hasText: /task details/i }).first()
    const authorSelect = sidebar.getByRole("combobox", { name: /who are you/i })
    await authorSelect.click()
    const authorInput = page.getByPlaceholder(/search or create/i)
    await authorInput.fill("Deleter")
    await page.getByRole("option", { name: /create.*deleter/i }).click()

    const editor = sidebar.locator('[contenteditable="true"]').first()
    await editor.click()
    await editor.fill("Comment to delete")
    await page.getByRole("button", { name: /add comment/i }).click()
    await expect(page.getByText(/comment added/i)).toBeVisible()

    // Find comment and delete it
    await page.getByText(/comment to delete/i).hover()
    await page.getByRole("button", { name: /comment actions/i }).click()

    // Click delete
    await page.getByRole("menuitem", { name: /delete/i }).click()

    // Confirm deletion
    const confirmDialog = page.getByRole("dialog", { name: /delete comment/i })
    await expect(confirmDialog).toBeVisible()
    await confirmDialog.getByRole("button", { name: /^delete$/i }).click()

    // Comment should be gone
    await expect(page.getByText(/comment to delete/i)).not.toBeVisible()
  })

  test("should persist comment after background polling (local-first)", async ({ page }) => {
    // This test catches a bug where comments would disappear after the board
    // polling cycle re-hydrates the store. Comments should persist because:
    // 1. The local store should preserve taskDetailsById during board hydration
    // 2. The comment count metadata should also be preserved

    const boardId = await createTestBoard(page, "Persist Comment Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    await page.waitForURL(/task=/)

    const sidebar = page.getByRole("dialog").filter({ hasText: /task details/i }).first()
    await expect(sidebar.getByRole("heading", { name: /^comments$/i })).toBeVisible()

    // Select an author
    const authorSelect = sidebar.getByRole("combobox", { name: /who are you/i })
    await authorSelect.click()
    const authorInput = page.getByPlaceholder(/search or create/i)
    await authorInput.fill("Persistent Author")
    await page.getByRole("option", { name: /create.*persistent author/i }).click()

    // Add comment
    const editor = sidebar.locator('[contenteditable="true"]').first()
    await editor.click()
    await editor.fill("This comment should persist after polling")
    await page.getByRole("button", { name: /add comment/i }).click()
    await expect(page.getByText(/comment added/i)).toBeVisible()

    // Verify comment appears immediately (optimistic update)
    await expect(page.getByText(/this comment should persist after polling/i)).toBeVisible()

    // Wait for outbox to flush and polling to potentially overwrite
    // The polling interval is 1 second, so waiting 3 seconds should be enough
    await page.waitForTimeout(3000)

    // Comment should STILL be visible after polling
    await expect(page.getByText(/this comment should persist after polling/i)).toBeVisible()

    // Close sidebar and reopen to verify persistence across sidebar re-renders
    await sidebar.getByRole("button", { name: /back/i }).click()
    await page.waitForURL(new RegExp(`/boards/${boardId}$`))

    // Verify task card shows comment count
    const taskCard = page.getByText(/new task/i).locator("..").locator("..")
    await expect(taskCard.getByText(/1/)).toBeVisible()

    // Reopen sidebar
    await page.getByRole("button", { name: /new task/i }).click()
    await page.waitForURL(/task=/)

    // Comment should still be visible after reopening
    const reopenedSidebar = page.getByRole("dialog").filter({ hasText: /task details/i }).first()
    await expect(reopenedSidebar.getByText(/this comment should persist after polling/i)).toBeVisible()
  })
})
