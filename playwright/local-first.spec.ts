import { test, expect } from "@playwright/test"
import { createTestBoard, waitForBoardLoad } from "./utils/playwright"

test.describe("Local-First Architecture", () => {
  test("should isolate state between multiple boards", async ({ page }) => {
    // This test verifies that the local-first store correctly isolates state
    // between different boards. Switching boards should not cause data leakage.

    // Create first board
    const boardId1 = await createTestBoard(page, "Board One", "testpass123")
    await waitForBoardLoad(page)

    // Create a task on Board 1 with a distinctive name
    await page.getByRole("button", { name: /add task/i }).first().click()
    await page.waitForURL(/task=/)

    const sidebar1 = page.getByRole("dialog")
    const titleEditable1 = sidebar1.getByText(/new task/i).first()
    await titleEditable1.click()
    const titleInput1 = sidebar1.getByRole("textbox", { name: /task title/i })
    await titleInput1.fill("BOARD1-Task")
    await titleInput1.press("Enter")
    await expect(sidebar1.getByText(/board1-task/i)).toBeVisible()

    // Close sidebar
    await sidebar1.getByRole("button", { name: /back/i }).click()
    await page.waitForURL(new RegExp(`/boards/${boardId1}$`))

    // Create second board
    await page.goto("/")
    const boardId2 = await createTestBoard(page, "Board Two", "testpass456")
    await waitForBoardLoad(page)

    // Create a task on Board 2 with a different distinctive name
    await page.getByRole("button", { name: /add task/i }).first().click()
    await page.waitForURL(/task=/)

    const sidebar2 = page.getByRole("dialog")
    const titleEditable2 = sidebar2.getByText(/new task/i).first()
    await titleEditable2.click()
    const titleInput2 = sidebar2.getByRole("textbox", { name: /task title/i })
    await titleInput2.fill("BOARD2-Task")
    await titleInput2.press("Enter")
    await expect(sidebar2.getByText(/board2-task/i)).toBeVisible()

    // Close sidebar
    await sidebar2.getByRole("button", { name: /back/i }).click()
    await page.waitForURL(new RegExp(`/boards/${boardId2}$`))

    // Verify Board 2 shows only BOARD2-Task
    await expect(page.getByText(/board2-task/i)).toBeVisible()
    await expect(page.getByText(/board1-task/i)).not.toBeVisible()

    // Navigate back to Board 1
    await page.goto(`/boards/${boardId1}`)
    await waitForBoardLoad(page)

    // Verify Board 1 shows only BOARD1-Task
    await expect(page.getByText(/board1-task/i)).toBeVisible()
    await expect(page.getByText(/board2-task/i)).not.toBeVisible()

    // Navigate back to Board 2 to verify no state leakage in either direction
    await page.goto(`/boards/${boardId2}`)
    await waitForBoardLoad(page)

    await expect(page.getByText(/board2-task/i)).toBeVisible()
    await expect(page.getByText(/board1-task/i)).not.toBeVisible()
  })

  test("should handle rapid task creation via outbox", async ({ page }) => {
    // This test verifies that creating multiple tasks in quick succession
    // all get properly queued through the outbox and persisted

    const boardId = await createTestBoard(page, "Rapid Creation Test", "testpass123")
    await waitForBoardLoad(page)

    // Get the first column's add task button
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()

    // Create 3 tasks rapidly by clicking multiple times
    // Each click navigates to the task sidebar, so we close it before clicking again
    for (let i = 0; i < 3; i++) {
      // Ensure no dialog is blocking
      const dialog = page.getByRole("dialog")
      if (await dialog.isVisible().catch(() => false)) {
        await page.getByRole("button", { name: /back/i }).click()
        await expect(dialog).not.toBeVisible({ timeout: 5000 })
      }

      // Wait for button to be clickable
      await addTaskButton.waitFor({ state: "visible" })
      await addTaskButton.click()

      // Give time for the task to be created and navigation to happen
      await page.waitForTimeout(500)
    }

    // Close any open sidebar
    const dialog = page.getByRole("dialog")
    if (await dialog.isVisible().catch(() => false)) {
      await page.getByRole("button", { name: /back/i }).click()
      await expect(dialog).not.toBeVisible({ timeout: 5000 })
    }

    // Wait for outbox to flush - "Saving..." should disappear
    // Note: "Saved" appears briefly then hides, so we check that "Saving" is NOT visible
    await expect(page.getByText(/saving/i)).not.toBeVisible({ timeout: 10000 })

    // Verify column shows 3 tasks
    const todoColumn = page.locator('[title="Click to edit"]').filter({ hasText: /to do/i }).locator("..")
    await expect(todoColumn.getByText(/3/)).toBeVisible()

    // Refresh page to verify persistence
    await page.reload()
    await waitForBoardLoad(page)

    // Still should have 3 tasks
    const todoColumnAfterRefresh = page.locator('[title="Click to edit"]').filter({ hasText: /to do/i }).locator("..")
    await expect(todoColumnAfterRefresh.getByText(/3/)).toBeVisible()
  })
})
