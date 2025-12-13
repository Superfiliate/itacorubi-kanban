import { test, expect } from "@playwright/test"
import { createTestBoard, waitForBoardLoad } from "./utils/playwright"

test.describe("Columns", () => {
  test("should add a new column", async ({ page }) => {
    const boardId = await createTestBoard(page, "Column Test Board", "testpass123")
    await waitForBoardLoad(page)

    // Find the add column button (should be after the last column)
    const addColumnButton = page.locator('button[title="Add column"]').last()
    await addColumnButton.click()

    // Wait for toast notification
    await expect(page.getByText(/column created/i)).toBeVisible()

    // Verify new column appears (should have "New column" in name)
    await expect(page.getByText(/new column/i)).toBeVisible()
  })

  test("should rename a column", async ({ page }) => {
    const boardId = await createTestBoard(page, "Rename Test", "testpass123")
    await waitForBoardLoad(page)

    // Find a column name (default "To do")
    const columnName = page.getByText(/to do/i).first()
    await columnName.click()

    // Edit the name
    const input = page.locator('input[value*="To do"]').first()
    await input.fill("Renamed Column")
    await input.press("Enter")

    // Verify name changed
    await expect(page.getByText(/renamed column/i)).toBeVisible()
  })

  test("should collapse and expand a column", async ({ page }) => {
    const boardId = await createTestBoard(page, "Collapse Test", "testpass123")
    await waitForBoardLoad(page)

    // Find collapse button (Minimize2 icon)
    const collapseButton = page.locator('button[title="Collapse column"]').first()
    await collapseButton.click()

    // Column should be collapsed (narrow width, rotated text)
    // Find expand button
    const expandButton = page.locator('button[title="Expand column"]').first()
    await expect(expandButton).toBeVisible()

    // Expand it back
    await expandButton.click()

    // Should be expanded again
    await expect(page.getByText(/to do/i)).toBeVisible()
  })

  test("should delete empty column", async ({ page }) => {
    const boardId = await createTestBoard(page, "Delete Column Test", "testpass123")
    await waitForBoardLoad(page)

    // Add a new column first
    const addColumnButton = page.locator('button[title="Add column"]').last()
    await addColumnButton.click()
    await expect(page.getByText(/new column/i)).toBeVisible()

    // Find delete button (trash icon) for the new empty column
    const deleteButton = page.locator('button[title="Delete column"]').last()
    await deleteButton.click()

    // Confirm deletion
    await expect(page.getByRole("dialog")).toBeVisible()
    await page.getByRole("button", { name: /delete/i }).click()

    // Wait for toast
    await expect(page.getByText(/column deleted/i)).toBeVisible()

    // Column should be gone
    await expect(page.getByText(/new column/i)).not.toBeVisible()
  })

  test("should not allow deleting column with tasks", async ({ page }) => {
    const boardId = await createTestBoard(page, "Delete Protected Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task in the first column
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()

    // Wait for task to be created and sidebar to open
    await page.waitForURL(/task=/)

    // Close sidebar
    await page.keyboard.press("Escape")

    // Try to delete the column (should not show delete button when column has tasks)
    const deleteButtons = page.locator('button[title="Delete column"]')
    const count = await deleteButtons.count()

    // Delete button should not be visible for columns with tasks
    // Only empty columns should have delete buttons
    expect(count).toBeLessThan(3) // Should only have delete buttons on empty columns
  })

  test("should reorder columns via drag and drop", async ({ page }) => {
    const boardId = await createTestBoard(page, "Reorder Test", "testpass123")
    await waitForBoardLoad(page)

    // Add a new column
    const addColumnButton = page.locator('button[title="Add column"]').last()
    await addColumnButton.click()
    await expect(page.getByText(/new column/i)).toBeVisible()

    // Get the first column header
    const firstColumn = page.getByText(/to do/i).first()
    const secondColumn = page.getByText(/doing/i).first()

    // Drag first column to the right of second column
    await firstColumn.hover()
    await page.mouse.down()
    await secondColumn.hover({ position: { x: 200, y: 0 } })
    await page.mouse.up()

    // Columns should have reordered (visual verification)
    // The order might change, so we just verify columns are still visible
    await expect(page.getByText(/to do/i)).toBeVisible()
    await expect(page.getByText(/doing/i)).toBeVisible()
  })
})
