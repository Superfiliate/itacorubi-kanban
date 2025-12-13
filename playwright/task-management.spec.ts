import { test, expect } from "@playwright/test"
import { createTestBoard, waitForBoardLoad } from "./utils/playwright"

test.describe("Task Management", () => {
  test("should create a task from column", async ({ page }) => {
    const boardId = await createTestBoard(page, "Task Test Board", "testpass123")
    await waitForBoardLoad(page)

    // Click "Add task" button in first column
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()

    // Wait for task to be created and sidebar to open
    await page.waitForURL(/task=/, { timeout: 10000 })

    // Verify sidebar is open
    await expect(page.getByRole("button", { name: /back/i })).toBeVisible()

    // Verify task title is visible (should have "New task" in it)
    await expect(page.getByText(/new task/i)).toBeVisible()
  })

  test("should edit task title", async ({ page }) => {
    const boardId = await createTestBoard(page, "Edit Task Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    await page.waitForURL(/task=/, { timeout: 10000 })

    // Find task title input (should be editable)
    const titleInput = page.locator('input[type="text"]').filter({ hasText: /new task/i }).first()
    await titleInput.click()
    await titleInput.fill("Updated Task Title")
    await titleInput.press("Enter")

    // Verify title updated
    await expect(page.getByText(/updated task title/i)).toBeVisible()
  })

  test("should move task via Status dropdown", async ({ page }) => {
    const boardId = await createTestBoard(page, "Move Task Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    await page.waitForURL(/task=/, { timeout: 10000 })

    // Close sidebar to see the board
    await page.keyboard.press("Escape")
    await page.waitForURL(new RegExp(`/boards/${boardId}$`), { timeout: 5000 })

    // Verify task is in first column (To do)
    await expect(page.getByText(/new task/i)).toBeVisible()

    // Open task again
    await page.getByText(/new task/i).click()
    await page.waitForURL(/task=/, { timeout: 10000 })

    // Find Status dropdown and change it to "Done"
    const statusSelect = page.getByRole("combobox", { name: /status/i })
    await statusSelect.click()
    await page.getByRole("option", { name: /done/i }).click()

    // Close sidebar
    await page.keyboard.press("Escape")
    await page.waitForURL(new RegExp(`/boards/${boardId}$`), { timeout: 5000 })

    // Task should now be in "Done" column
    const doneColumn = page.getByText(/done/i).locator("..").locator("..")
    await expect(doneColumn.getByText(/new task/i)).toBeVisible()
  })

  test("should move task via drag and drop", async ({ page }) => {
    const boardId = await createTestBoard(page, "Drag Task Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    await page.waitForURL(/task=/, { timeout: 10000 })

    // Close sidebar
    await page.keyboard.press("Escape")
    await page.waitForURL(new RegExp(`/boards/${boardId}$`), { timeout: 5000 })

    // Find the task card
    const taskCard = page.getByText(/new task/i).locator("..").locator("..")
    const targetColumn = page.getByText(/doing/i).locator("..").locator("..")

    // Drag task to "Doing" column
    await taskCard.hover()
    await page.mouse.down()
    await targetColumn.hover({ position: { x: 100, y: 100 } })
    await page.mouse.up()

    // Wait a bit for the move to complete
    await page.waitForTimeout(1000)

    // Task should be in "Doing" column
    await expect(targetColumn.getByText(/new task/i)).toBeVisible()
  })

  test("should delete task with confirmation", async ({ page }) => {
    const boardId = await createTestBoard(page, "Delete Task Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    await page.waitForURL(/task=/, { timeout: 10000 })

    // Find delete button (trash icon in sidebar)
    const deleteButton = page.locator('button').filter({ hasText: /delete/i }).last()
    await deleteButton.click()

    // Confirm deletion in dialog
    await expect(page.getByRole("dialog")).toBeVisible()
    await page.getByRole("button", { name: /delete/i }).last().click()

    // Wait for toast
    await expect(page.getByText(/task deleted/i)).toBeVisible({ timeout: 5000 })

    // Sidebar should close
    await page.waitForURL(new RegExp(`/boards/${boardId}$`), { timeout: 5000 })

    // Task should be gone from board
    await expect(page.getByText(/new task/i)).not.toBeVisible()
  })
})
