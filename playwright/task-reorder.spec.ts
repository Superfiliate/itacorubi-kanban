import { test, expect, type Locator, type Page } from "@playwright/test";
import {
  seedAndNavigateToBoard,
  waitForBoardLoad,
  waitForSync,
  waitForSidebarOpen,
  waitForSidebarClose,
} from "./utils/playwright";

// Helper to get task order in a column
async function getTaskOrder(columnContainer: Locator): Promise<string[]> {
  const headings = columnContainer.locator("h4");
  const count = await headings.count();
  const order: string[] = [];
  for (let i = 0; i < count; i++) {
    const text = await headings.nth(i).textContent();
    if (text) order.push(text.trim());
  }
  return order;
}

// Helper to get column container by name
function getColumnContainer(page: Page, columnName: string): Locator {
  return page
    .locator('[title="Click to edit"]')
    .filter({ hasText: new RegExp(columnName, "i") })
    .first()
    .locator("..") // header
    .locator("..") // expanded view
    .locator(".."); // column root
}

// Helper to perform reorder action
async function performReorder(page: Page, menuItemPattern: RegExp): Promise<void> {
  await page.getByRole("button", { name: /reorder/i }).click();
  await page.getByRole("menuitem", { name: menuItemPattern }).click();
  const confirmDialog = page.getByRole("dialog", { name: /reorder tasks/i });
  await expect(confirmDialog).toBeVisible();
  await confirmDialog.getByRole("button", { name: /^reorder$/i }).click();
  await waitForSync(page);
}

test.describe("Task Reorder", () => {
  test("should reorder tasks by created date and persist after refresh", async ({ page }) => {
    // Seed tasks with explicit time offsets for deterministic ordering
    await seedAndNavigateToBoard(page, {
      title: "Reorder Test",
      tasks: [
        { title: "Task A", columnIndex: 0, createdAtOffset: 0 }, // oldest
        { title: "Task B", columnIndex: 0, createdAtOffset: 1 },
        { title: "Task C", columnIndex: 0, createdAtOffset: 2 }, // newest
      ],
    });

    const toDoColumn = getColumnContainer(page, "to do");

    // Verify initial order (oldest first by position)
    await expect(toDoColumn.getByText("Task A")).toBeVisible();
    const initialOrder = await getTaskOrder(toDoColumn);
    expect(initialOrder).toEqual(["Task A", "Task B", "Task C"]);

    // Reorder to newest first
    await performReorder(page, /created.*newest first/i);

    // Verify new order
    const newestFirstOrder = await getTaskOrder(toDoColumn);
    expect(newestFirstOrder).toEqual(["Task C", "Task B", "Task A"]);

    // Refresh and verify persistence
    await page.reload();
    await waitForBoardLoad(page);
    const toDoColumnReloaded = getColumnContainer(page, "to do");
    const orderAfterRefresh = await getTaskOrder(toDoColumnReloaded);
    expect(orderAfterRefresh).toEqual(["Task C", "Task B", "Task A"]);

    // Reorder back to oldest first
    await performReorder(page, /created.*oldest first/i);
    const oldestFirstOrder = await getTaskOrder(toDoColumnReloaded);
    expect(oldestFirstOrder).toEqual(["Task A", "Task B", "Task C"]);
  });

  test("should reorder by last comment with fallback to created date", async ({ page }) => {
    // Seed tasks with different creation times
    await seedAndNavigateToBoard(page, {
      title: "Comment Reorder Test",
      tasks: [
        { title: "Task X", columnIndex: 0, createdAtOffset: 0 }, // oldest, no comment
        { title: "Task Y", columnIndex: 0, createdAtOffset: 1 }, // middle, will get comment
        { title: "Task Z", columnIndex: 0, createdAtOffset: 2 }, // newest, no comment
      ],
    });

    const toDoColumn = getColumnContainer(page, "to do");
    await expect(toDoColumn.getByText("Task X")).toBeVisible();

    // Add comment to Task Y (makes it the most recently commented)
    await toDoColumn.getByRole("link", { name: /open task Task Y/i }).click();
    const sidebar = await waitForSidebarOpen(page);

    // Create an author first (required for commenting)
    const authorSelect = sidebar.getByRole("combobox", { name: /who are you/i });
    await authorSelect.click();
    const authorInput = page.getByPlaceholder(/search or create/i);
    await authorInput.fill("Test Author");
    await page.getByRole("option", { name: /create.*test author/i }).click();

    // Add comment using contenteditable editor
    const editor = sidebar.locator('[contenteditable="true"]').first();
    await editor.click();
    await editor.fill("Comment on Y");
    await page.getByRole("button", { name: /add comment/i }).click();
    await expect(page.getByText(/comment added/i)).toBeVisible();

    await sidebar.getByRole("button", { name: /back/i }).click();
    await waitForSidebarClose(page);
    await waitForSync(page);

    // Reorder by last comment (newest first)
    await performReorder(page, /last comment.*newest first/i);

    // Task Y should be first (has comment), then Z, X (by creation date fallback)
    const orderAfterReorder = await getTaskOrder(toDoColumn);
    expect(orderAfterReorder[0]).toBe("Task Y");
    // Tasks without comments fall back to creation date (newest first within no-comment group)
    expect(orderAfterReorder).toEqual(["Task Y", "Task Z", "Task X"]);
  });
});
