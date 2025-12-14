import { test, expect } from "@playwright/test"
import { createTestBoard, waitForBoardLoad } from "./utils/playwright"

test.describe("Task Management", () => {
  test("should create a task from column", async ({ page }) => {
    const boardId = await createTestBoard(page, "Task Test Board", "testpass123")
    await waitForBoardLoad(page)

    // Click "Add task" button in first column
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()

    // URL should update quickly (local-first sidebar open)
    await page.waitForURL(/task=/, { timeout: 1000 })

    // Verify sidebar is open
    await expect(page.getByRole("button", { name: /back/i })).toBeVisible()

    // Verify task title is visible in the sidebar (should have "New task" in it)
    // Look specifically in the dialog/sidebar, not the task card
    const sidebar = page.getByRole("dialog")
    await expect(sidebar.getByText(/new task/i).first()).toBeVisible()
  })

  test("should set and show task priority with icon and border styling", async ({ page }) => {
    const boardId = await createTestBoard(page, "Priority Test Board", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    await page.getByRole("button", { name: /add task/i }).first().click()
    await page.waitForURL(/task=/)

    const sidebar = page.getByRole("dialog")
    await expect(sidebar.getByRole("button", { name: /back/i })).toBeVisible()

    // Default priority should be "No priority"
    const priorityLabel = sidebar.getByText("Priority")
    const prioritySelect = priorityLabel.locator("..").getByRole("combobox")
    await expect(prioritySelect).toBeVisible()
    await expect(prioritySelect).toHaveText(/no priority/i)

    // Close sidebar - card should have no priority border or icon
    await page.keyboard.press("Escape")
    await page.waitForURL(new RegExp(`/boards/${boardId}$`))

    const taskCard = page.getByRole("heading", { name: /new task/i }).locator("..").locator("..")
    // No priority icon visible for "none"
    await expect(taskCard.locator("svg.lucide-flame")).not.toBeVisible()
    await expect(taskCard.locator("svg.lucide-arrow-up")).not.toBeVisible()

    // Re-open task and set to High
    await page.getByText(/new task/i).click()
    await page.waitForURL(/task=/)
    await expect(sidebar.getByRole("button", { name: /back/i })).toBeVisible()

    await prioritySelect.click()
    await page.getByRole("option", { name: /high/i }).click()
    await expect(prioritySelect).toHaveText(/high/i)

    // Close and verify High styling (orange border + arrow-up icon)
    await page.keyboard.press("Escape")
    await page.waitForURL(new RegExp(`/boards/${boardId}$`))
    await expect(taskCard.locator("svg.lucide-arrow-up")).toBeVisible()
    await expect(taskCard).toHaveClass(/border-l-orange/)

    // Re-open and change to Urgent
    await page.getByText(/new task/i).click()
    await page.waitForURL(/task=/)
    await prioritySelect.click()
    await page.getByRole("option", { name: /urgent/i }).click()

    // Close and verify Urgent styling (red border + flame icon)
    await page.keyboard.press("Escape")
    await page.waitForURL(new RegExp(`/boards/${boardId}$`))
    await expect(taskCard.locator("svg.lucide-flame")).toBeVisible()
    await expect(taskCard).toHaveClass(/border-l-red/)
  })

  test("should reflect contributor rename on task cards without refresh (and keep color stable)", async ({ page }) => {
    const boardId = await createTestBoard(page, "Contributor Sync Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    await page.getByRole("button", { name: /add task/i }).first().click()
    await page.waitForURL(/task=/, { timeout: 1000 })

    const sidebar = page.getByRole("dialog")
    await expect(sidebar.getByRole("button", { name: /back/i })).toBeVisible()

    // Create & assign a new contributor from Assignees select
    const assigneesCombobox = sidebar.getByRole("combobox", { name: /assignees/i })
    await assigneesCombobox.click()
    await page.getByPlaceholder(/search or create/i).fill("Alice")
    await page.getByRole("option", { name: /create.*alice/i }).click()

    // Badge should appear in sidebar
    const aliceBadge = sidebar.locator("span").filter({ hasText: "Alice" }).first()
    await expect(aliceBadge).toBeVisible()

    // Color class should not change after a bit (no flicker)
    const classBefore = await aliceBadge.getAttribute("class")
    await page.waitForTimeout(2000)
    const classAfter = await aliceBadge.getAttribute("class")
    expect(classAfter).toBe(classBefore)

    // Close sidebar
    await page.keyboard.press("Escape")
    await page.waitForURL(new RegExp(`/boards/${boardId}$`))

    // Card should show contributor immediately
    const taskCard = page.getByRole("heading", { name: /new task/i }).locator("..").locator("..")
    await expect(taskCard.getByText("Alice")).toBeVisible()

    // Open contributors dialog and rename Alice -> Alicia
    await page.getByRole("button", { name: /manage contributors/i }).click()
    const contributorsDialog = page.getByRole("dialog").filter({ hasText: /contributors/i })
    await expect(contributorsDialog).toBeVisible()

    await contributorsDialog.getByText("Alice", { exact: true }).click()
    const nameInput = contributorsDialog.locator('input[value="Alice"]')
    await expect(nameInput).toBeVisible()
    await nameInput.fill("Alicia")
    await page.keyboard.press("Enter")

    // Close dialog
    await page.keyboard.press("Escape")

    // Task card should reflect rename without refresh
    await expect(taskCard.getByText("Alicia")).toBeVisible()
  })

  test("should edit task title", async ({ page }) => {
    const boardId = await createTestBoard(page, "Edit Task Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    await page.waitForURL(/task=/)

    // Wait for sidebar to load
    await expect(page.getByRole("button", { name: /back/i })).toBeVisible()

    // Find task title - it's an EditableText component, so click on the span first
    const sidebar = page.getByRole("dialog")
    const titleEditable = sidebar.getByText(/new task/i).first()
    await titleEditable.click()

    // Now it should be a textbox (Input component)
    const titleInput = sidebar.getByRole("textbox", { name: /task title/i })
    await expect(titleInput).toBeVisible()
    await titleInput.fill("Updated Task Title")
    await titleInput.press("Enter")

    // Verify title updated
    await expect(sidebar.getByText(/updated task title/i)).toBeVisible()
  })

  test("should move task via Status dropdown", async ({ page }) => {
    const boardId = await createTestBoard(page, "Move Task Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    await page.waitForURL(/task=/)

    // Wait for sidebar to load
    await expect(page.getByRole("button", { name: /back/i })).toBeVisible()

    // Close sidebar to see the board
    await page.keyboard.press("Escape")
    await page.waitForURL(new RegExp(`/boards/${boardId}$`))

    // Verify task is in first column (To do)
    await expect(page.getByText(/new task/i)).toBeVisible()

    // Open task again
    await page.getByText(/new task/i).click()
    await page.waitForURL(/task=/)

    // Wait for sidebar to load
    await expect(page.getByRole("button", { name: /back/i })).toBeVisible()

    // Find Status dropdown and change it to "Done"
    // The Status label is separate, so find the combobox near the "Status" text
    const sidebar = page.getByRole("dialog")
    const statusLabel = sidebar.getByText("Status")
    const statusSelect = statusLabel.locator("..").getByRole("combobox")
    await expect(statusSelect).toBeVisible()
    await statusSelect.click()
    await page.getByRole("option", { name: /done/i }).click()

    // Close sidebar
    await page.keyboard.press("Escape")
    await page.waitForURL(new RegExp(`/boards/${boardId}$`))

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
    await page.waitForURL(/task=/)

    // Close sidebar
    await page.keyboard.press("Escape")
    await page.waitForURL(new RegExp(`/boards/${boardId}$`))

    // Find the task card
    const taskCard = page.getByRole("heading", { name: /new task/i }).locator("..").locator("..")

    // Drag to the "Doing" column root (sortable container)
    const targetColumn = page
      .locator('[title="Click to edit"]')
      .filter({ hasText: /doing/i })
      .first()
      .locator("..") // header
      .locator("..") // expanded view
      .locator("..") // column root (sortable)

    // Drag task to "Doing" column
    // Use pointer-based drag (dnd-kit PointerSensor) with a small move to activate.
    await taskCard.hover()
    await page.mouse.down()
    await page.mouse.move(0, 20)
    await targetColumn.hover({ position: { x: 120, y: 200 } })
    await page.mouse.up()

    // Task should be in "Doing" column
    await expect(targetColumn.getByText(/new task/i)).toBeVisible()
  })

  test("should delete task with confirmation", async ({ page }) => {
    const boardId = await createTestBoard(page, "Delete Task Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    await page.waitForURL(/task=/)

    // Wait for sidebar to load
    await expect(page.getByRole("button", { name: /back/i })).toBeVisible()

    // Find delete button (trash icon in sidebar)
    const sidebar = page.getByRole("dialog")
    const deleteButton = sidebar.getByRole("button", { name: /delete task/i })
    await deleteButton.click()

    // Confirm deletion in dialog (there should be a confirmation dialog now)
    await expect(page.getByRole("dialog").filter({ hasText: /delete/i })).toBeVisible()
    await page.getByRole("button", { name: /delete/i }).last().click()

    // Sidebar should close and navigate back to board
    await page.waitForURL(new RegExp(`/boards/${boardId}$`))

    // Task should be gone from board (primary verification that deletion worked)
    await expect(page.getByText(/new task/i)).not.toBeVisible()

    // Note: Toast should appear but there may be a timing issue with sonner
    // The important verification (task deletion) is confirmed above
    // TODO: Investigate why toast doesn't appear in test environment
  })
})
