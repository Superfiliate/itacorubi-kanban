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

    // Wait for sidebar to fully load
    await expect(page.getByText(/comments/i)).toBeVisible()

    // Select an author (should be a dropdown)
    const authorSelect = page.getByRole("combobox", { name: /who are you/i })
    await authorSelect.click()

    // Create a new contributor/author
    const authorInput = page.getByPlaceholder(/search or create/i)
    await authorInput.fill("Test Author")
    await page.getByRole("option", { name: /create.*test author/i }).click()

    // Type a comment in the rich text editor
    const editor = page.locator('[contenteditable="true"]').filter({ hasText: /write your comment/i }).first()
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

    // Create an author and add a comment
    const authorSelect = page.getByRole("combobox", { name: /who are you/i })
    await authorSelect.click()
    const authorInput = page.getByPlaceholder(/search or create/i)
    await authorInput.fill("Remembered Author")
    await page.getByRole("option", { name: /create.*remembered author/i }).click()

    const editor = page.locator('[contenteditable="true"]').filter({ hasText: /write your comment/i }).first()
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
    await expect(page.getByText(/remembered author/i)).toBeVisible()
  })

  test("should edit a comment", async ({ page }) => {
    const boardId = await createTestBoard(page, "Edit Comment Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task and add a comment
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    await page.waitForURL(/task=/)

    // Create author and comment
    const authorSelect = page.getByRole("combobox", { name: /who are you/i })
    await authorSelect.click()
    const authorInput = page.getByPlaceholder(/search or create/i)
    await authorInput.fill("Editor")
    await page.getByRole("option", { name: /create.*editor/i }).click()

    const editor = page.locator('[contenteditable="true"]').filter({ hasText: /write your comment/i }).first()
    await editor.click()
    await editor.fill("Original comment")
    await page.getByRole("button", { name: /add comment/i }).click()
    await expect(page.getByText(/comment added/i)).toBeVisible()

    // Find the comment and click edit (should be a menu button)
    const comment = page.getByText(/original comment/i).locator("..").locator("..")
    await comment.hover()

    // Click the menu button (three dots)
    const menuButton = comment.locator('button').filter({ hasText: /\.\.\./ }).or(comment.locator('[aria-label*="menu"]'))
    await menuButton.click()

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
    const authorSelect = page.getByRole("combobox", { name: /who are you/i })
    await authorSelect.click()
    const authorInput = page.getByPlaceholder(/search or create/i)
    await authorInput.fill("Deleter")
    await page.getByRole("option", { name: /create.*deleter/i }).click()

    const editor = page.locator('[contenteditable="true"]').filter({ hasText: /write your comment/i }).first()
    await editor.click()
    await editor.fill("Comment to delete")
    await page.getByRole("button", { name: /add comment/i }).click()
    await expect(page.getByText(/comment added/i)).toBeVisible()

    // Find comment and delete it
    const comment = page.getByText(/comment to delete/i).locator("..").locator("..")
    await comment.hover()

    // Click menu
    const menuButton = comment.locator('button').filter({ hasText: /\.\.\./ }).or(comment.locator('[aria-label*="menu"]'))
    await menuButton.click()

    // Click delete
    await page.getByRole("menuitem", { name: /delete/i }).click()

    // Confirm deletion
    await expect(page.getByRole("dialog")).toBeVisible()
    await page.getByRole("button", { name: /delete/i }).last().click()

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
    const authorSelect = page.getByRole("combobox", { name: /who are you/i })
    await authorSelect.click()
    const authorInput = page.getByPlaceholder(/search or create/i)
    await authorInput.fill("Counter")
    await page.getByRole("option", { name: /create.*counter/i }).click()

    const editor = page.locator('[contenteditable="true"]').filter({ hasText: /write your comment/i }).first()
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
