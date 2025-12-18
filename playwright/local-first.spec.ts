import { test, expect } from "@playwright/test";
import {
  createTestBoard,
  waitForBoardLoad,
  waitForSidebarOpen,
  waitForSidebarClose,
} from "./utils/playwright";

test.describe("Local-First Architecture", () => {
  test("should isolate state between boards and persist data across navigation", async ({
    page,
  }) => {
    // This test verifies:
    // 1. The local-first store correctly isolates state between boards
    // 2. Data persists across navigation (via localStorage outbox persistence)

    // Create first board and a task
    const boardId1 = await createTestBoard(page, "Board One", "testpass123");
    await waitForBoardLoad(page);

    await page
      .getByRole("button", { name: /add task/i })
      .first()
      .click();
    const sidebar1 = await waitForSidebarOpen(page);

    const titleEditable1 = sidebar1.getByText(/new task/i).first();
    await titleEditable1.click();
    const titleInput1 = sidebar1.getByRole("textbox", { name: /task title/i });
    await titleInput1.fill("BOARD1-Task");
    await titleInput1.press("Enter");
    await expect(sidebar1.getByText(/board1-task/i)).toBeVisible();

    // Close sidebar and verify task is visible
    await sidebar1.getByRole("button", { name: /back/i }).click();
    await waitForSidebarClose(page);
    await expect(page.getByText(/board1-task/i)).toBeVisible();

    // Navigate away to create second board (outbox may still be flushing)
    await page.goto("/");
    await createTestBoard(page, "Board Two", "testpass456");
    await waitForBoardLoad(page);

    await page
      .getByRole("button", { name: /add task/i })
      .first()
      .click();
    const sidebar2 = await waitForSidebarOpen(page);

    const titleEditable2 = sidebar2.getByText(/new task/i).first();
    await titleEditable2.click();
    const titleInput2 = sidebar2.getByRole("textbox", { name: /task title/i });
    await titleInput2.fill("BOARD2-Task");
    await titleInput2.press("Enter");
    await expect(sidebar2.getByText(/board2-task/i)).toBeVisible();

    // Close sidebar
    await sidebar2.getByRole("button", { name: /back/i }).click();
    await waitForSidebarClose(page);

    // Verify Board 2 shows only BOARD2-Task (Board 1's task shouldn't leak here)
    await expect(page.getByText(/board2-task/i)).toBeVisible();
    await expect(page.getByText(/board1-task/i)).not.toBeVisible();

    // Navigate back to Board 1 and verify the task persisted
    // This confirms the localStorage outbox persistence worked
    await page.goto(`/boards/${boardId1}`);
    await waitForBoardLoad(page);
    await expect(page.getByText(/board1-task/i)).toBeVisible();
  });

  test("should handle rapid task creation and persist after reload", async ({ page }) => {
    // This test verifies:
    // 1. Rapid task creation via outbox works (optimistic updates)
    // 2. All tasks persist after page reload (via localStorage outbox restoration and flush)

    await createTestBoard(page, "Rapid Creation Test", "testpass123");
    await waitForBoardLoad(page);

    // Get the first column's add task button
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first();

    // Create 3 tasks rapidly by clicking multiple times
    // Each click opens the task sidebar, so we close it before clicking again
    for (let i = 0; i < 3; i++) {
      await addTaskButton.click();
      const sidebar = await waitForSidebarOpen(page);
      await sidebar.getByRole("button", { name: /back/i }).click();
      await waitForSidebarClose(page);
    }

    // Verify column shows 3 tasks (optimistic update should show immediately)
    const todoColumn = page
      .locator('[title="Click to edit"]')
      .filter({ hasText: /to do/i })
      .locator("..");
    await expect(todoColumn.getByText(/3/)).toBeVisible();

    // Reload immediately - the localStorage outbox persistence should ensure no data loss
    // Any pending sync items are restored and flushed on the new page
    await page.reload();
    await waitForBoardLoad(page);

    // Wait for sync to complete (restored outbox items are flushed on page load)
    await expect(page.locator("header").getByText(/saving/i)).not.toBeVisible({ timeout: 15000 });

    // Verify all tasks persisted
    await expect(todoColumn.getByText(/3/)).toBeVisible();
  });
});
