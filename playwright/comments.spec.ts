import { test, expect } from "@playwright/test"
import { createTestBoard, waitForBoardLoad } from "./utils/playwright"

test.describe("Comments", () => {
  test("should add a comment to a task", async ({ page }) => {
    const boardId = await createTestBoard(page, "Comment Test Board", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    await page.waitForURL(/task=/)

    const sidebar = page.getByRole("dialog").filter({ hasText: /task details/i }).first()

    // Wait for sidebar to fully load
    await expect(sidebar.getByRole("heading", { name: /^comments$/i })).toBeVisible()

    // Select an author (should be a dropdown)
    const authorSelect = sidebar.getByRole("combobox", { name: /who are you/i })
    await authorSelect.click()

    // Create a new contributor/author
    const authorInput = page.getByPlaceholder(/search or create/i)
    await authorInput.fill("Test Author")
    await page.getByRole("option", { name: /create.*test author/i }).click()

    // Type a comment in the rich text editor
    const editor = sidebar.locator('[contenteditable="true"]').first()
    await editor.click()
    await editor.fill("This is a test comment")

    // Submit comment
    await page.getByRole("button", { name: /add comment/i }).click()

    // Wait for toast
    await expect(page.getByText(/comment added/i)).toBeVisible()

    // Verify comment appears
    await expect(page.getByText(/this is a test comment/i)).toBeVisible()
  })

  test("should remember author selection", async ({ page, context }) => {
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

    // Close sidebar and create another task
    await page.keyboard.press("Escape")
    await page.waitForURL(new RegExp(`/boards/${boardId}$`))

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

  test("should update comment count on task card", async ({ page }) => {
    const boardId = await createTestBoard(page, "Comment Count Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    await page.waitForURL(/task=/)

    // Add a comment
    const sidebar = page.getByRole("dialog").filter({ hasText: /task details/i }).first()
    const authorSelect = sidebar.getByRole("combobox", { name: /who are you/i })
    await authorSelect.click()
    const authorInput = page.getByPlaceholder(/search or create/i)
    await authorInput.fill("Counter")
    await page.getByRole("option", { name: /create.*counter/i }).click()

    const editor = sidebar.locator('[contenteditable="true"]').first()
    await editor.click()
    await editor.fill("Comment for count")
    await page.getByRole("button", { name: /add comment/i }).click()
    await expect(page.getByText(/comment added/i)).toBeVisible()

    // Close sidebar
    await page.keyboard.press("Escape")
    await page.waitForURL(new RegExp(`/boards/${boardId}$`))

    // Verify comment count shows on task card (should show "1")
    const taskCard = page.getByText(/new task/i).locator("..").locator("..")
    await expect(taskCard.getByText(/1/)).toBeVisible()
  })
})
