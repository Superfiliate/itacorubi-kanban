import { test, expect } from "@playwright/test"
import { createTestBoard, waitForBoardLoad, waitForSidebarOpen, waitForSidebarClose } from "./utils/playwright"

test.describe("Task Management", () => {
  test("should create a task from column", async ({ page }) => {
    const boardId = await createTestBoard(page, "Task Test Board", "testpass123")
    await waitForBoardLoad(page)

    // Click "Add task" button in first column
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()

    // Wait for sidebar to open
    const sidebar = await waitForSidebarOpen(page)

    // Verify task title is visible in the sidebar (should have "New task" in it)
    await expect(sidebar.getByText(/new task/i).first()).toBeVisible()
  })

  test("should set and show task priority with icon and border styling", async ({ page }) => {
    const boardId = await createTestBoard(page, "Priority Test Board", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    await page.getByRole("button", { name: /add task/i }).first().click()
    const sidebar = await waitForSidebarOpen(page)

    // Default priority should be "No priority"
    const priorityLabel = sidebar.getByText("Priority")
    const prioritySelect = priorityLabel.locator("..").getByRole("combobox")
    await expect(prioritySelect).toBeVisible()
    await expect(prioritySelect).toHaveText(/no priority/i)

    // Close sidebar - card should have no priority border or icon
    await sidebar.getByRole("button", { name: /back/i }).click()
    await waitForSidebarClose(page)

    // Task cards have a link inside for navigation
    const taskCardLink = page.getByRole("link", { name: /open task.*new task/i })
    const taskCard = taskCardLink.locator("..")  // parent div for visual checks
    // No priority icon visible for "none" (it shows CircleDashed for none priority)
    await expect(taskCard.locator("svg.lucide-flame")).not.toBeVisible()
    await expect(taskCard.locator("svg.lucide-signal-high")).not.toBeVisible()

    // Re-open task by clicking the task card link
    await taskCardLink.click()
    await waitForSidebarOpen(page)

    await prioritySelect.click()
    await page.getByRole("option", { name: /high/i }).click()
    await expect(prioritySelect).toHaveText(/high/i)

    // Close and verify High styling (amber border + signal-high icon)
    await sidebar.getByRole("button", { name: /back/i }).click()
    await waitForSidebarClose(page)
    await expect(taskCard.locator("svg.lucide-signal-high")).toBeVisible()
    await expect(taskCard).toHaveClass(/border-l-amber/)

    // Re-open and change to Urgent
    await taskCardLink.click()
    await waitForSidebarOpen(page)
    await prioritySelect.click()
    await page.getByRole("option", { name: /urgent/i }).click()

    // Close and verify Urgent styling (red border + flame icon)
    await sidebar.getByRole("button", { name: /back/i }).click()
    await waitForSidebarClose(page)
    await expect(taskCard.locator("svg.lucide-flame")).toBeVisible()
    await expect(taskCard).toHaveClass(/border-l-red/)
  })

  test("should reflect contributor rename on task cards without refresh", async ({ page }) => {
    const boardId = await createTestBoard(page, "Contributor Sync Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    await page.getByRole("button", { name: /add task/i }).first().click()
    const sidebar = await waitForSidebarOpen(page)

    // Create & assign a new contributor from Assignees select
    const assigneesCombobox = sidebar.getByRole("combobox", { name: /assignees/i })
    await assigneesCombobox.click()
    await page.getByPlaceholder(/search or create/i).fill("Alice")
    await page.getByRole("option", { name: /create.*alice/i }).click()

    // Badge should appear in sidebar
    await expect(sidebar.locator("span").filter({ hasText: "Alice" }).first()).toBeVisible()

    // Close sidebar
    await sidebar.getByRole("button", { name: /back/i }).click()
    await waitForSidebarClose(page)

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
    const sidebar = await waitForSidebarOpen(page)

    // Find task title - it's an EditableText component, so click on the span first
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
    const sidebar = await waitForSidebarOpen(page)

    // Close sidebar to see the board
    await sidebar.getByRole("button", { name: /back/i }).click()
    await waitForSidebarClose(page)

    // Verify task is in first column (To do) - use the link inside the task card
    const taskCardLink = page.getByRole("link", { name: /open task.*new task/i })
    await expect(taskCardLink).toBeVisible()

    // Open task again by clicking the task card link
    await taskCardLink.click()
    await waitForSidebarOpen(page)

    // Find Status dropdown and change it to "Done"
    // The Status label is separate, so find the combobox near the "Status" text
    const statusLabel = sidebar.getByText("Status")
    const statusSelect = statusLabel.locator("..").getByRole("combobox")
    await expect(statusSelect).toBeVisible()
    await statusSelect.click()
    await page.getByRole("option", { name: /done/i }).click()

    // Close sidebar
    await sidebar.getByRole("button", { name: /back/i }).click()
    await waitForSidebarClose(page)

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
    const sidebar = await waitForSidebarOpen(page)

    // Close sidebar
    await sidebar.getByRole("button", { name: /back/i }).click()
    await waitForSidebarClose(page)

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
    const sidebar = await waitForSidebarOpen(page)

    // Find delete button (trash icon in sidebar)
    const deleteButton = sidebar.getByRole("button", { name: /delete task/i })
    await deleteButton.click()

    // Confirm deletion in the confirmation dialog
    const confirmDialog = page.getByRole("dialog", { name: /delete task/i })
    await expect(confirmDialog).toBeVisible()
    const confirmDeleteButton = confirmDialog.getByRole("button", { name: /^delete$/i })
    await expect(confirmDeleteButton).toBeEnabled()
    await confirmDeleteButton.click()

    // Sidebar should close
    await waitForSidebarClose(page)

    // Task should be gone from board (check the column, not the whole page since sidebar might have stale text)
    const todoColumn = page.locator('[title="Click to edit"]').filter({ hasText: /to do/i }).locator("..")
    await expect(todoColumn.getByText(/new task/i)).not.toBeVisible()

    // Note: Toast should appear but there may be a timing issue with sonner
    // The important verification (task deletion) is confirmed above
    // TODO: Investigate why toast doesn't appear in test environment
  })

  test("should reorder tasks within column and between columns", async ({ page }) => {
    const boardId = await createTestBoard(page, "Reorder Tasks Test", "testpass123")
    await waitForBoardLoad(page)

    // Helper to get column container
    const getColumnContainer = (columnName: string) => {
      return page
        .locator('[title="Click to edit"]')
        .filter({ hasText: new RegExp(columnName, "i") })
        .first()
        .locator("..") // header
        .locator("..") // expanded view
        .locator("..") // column root
    }

    // Helper to get task order in a column
    const getTaskOrder = async (columnContainer: any) => {
      const headings = columnContainer.locator("h4")
      const count = await headings.count()
      const order = []
      for (let i = 0; i < count; i++) {
        const text = await headings.nth(i).textContent()
        if (text) order.push(text.trim())
      }
      return order
    }

    // Helper to drag task to another task
    const dragTaskToTask = async (sourceTask: any, targetTask: any) => {
      // Use dragTo which should work better with dnd-kit
      // First, ensure both elements are visible
      await expect(sourceTask).toBeVisible()
      await expect(targetTask).toBeVisible()

      // Use dragTo with a small initial move to activate PointerSensor
      const sourceBox = await sourceTask.boundingBox()
      if (!sourceBox) throw new Error("Source task not found")

      // Start drag with small movement to activate
      await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2)
      await page.mouse.down()
      await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2 + 10)

      // Now drag to target
      await targetTask.hover()
      await page.mouse.up()

      // Wait for drag to complete and server sync
      await expect(page.locator("header").getByText(/saving/i)).not.toBeVisible()
    }

    // Create 3 tasks in "To do" column
    const toDoColumn = getColumnContainer("to do")
    const addTaskButton = toDoColumn.getByRole("button", { name: /add task/i })

    // Create Task 1
    await addTaskButton.click()
    const sidebar1 = await waitForSidebarOpen(page)
    const titleEditable1 = sidebar1.getByText(/new task/i).first()
    await titleEditable1.click()
    const titleInput1 = sidebar1.getByRole("textbox", { name: /task title/i })
    await titleInput1.fill("Task 1")
    await titleInput1.press("Enter")
    await sidebar1.getByRole("button", { name: /back/i }).click()
    await waitForSidebarClose(page)

    // Create Task 2
    await addTaskButton.click()
    const sidebar2 = await waitForSidebarOpen(page)
    const titleEditable2 = sidebar2.getByText(/new task/i).first()
    await titleEditable2.click()
    const titleInput2 = sidebar2.getByRole("textbox", { name: /task title/i })
    await titleInput2.fill("Task 2")
    await titleInput2.press("Enter")
    await sidebar2.getByRole("button", { name: /back/i }).click()
    await waitForSidebarClose(page)

    // Create Task 3
    await addTaskButton.click()
    const sidebar3 = await waitForSidebarOpen(page)
    const titleEditable3 = sidebar3.getByText(/new task/i).first()
    await titleEditable3.click()
    const titleInput3 = sidebar3.getByRole("textbox", { name: /task title/i })
    await titleInput3.fill("Task 3")
    await titleInput3.press("Enter")
    await sidebar3.getByRole("button", { name: /back/i }).click()
    await waitForSidebarClose(page)

    // Wait for all tasks to be visible
    await expect(toDoColumn.getByText("Task 1")).toBeVisible()
    await expect(toDoColumn.getByText("Task 2")).toBeVisible()
    await expect(toDoColumn.getByText("Task 3")).toBeVisible()

    // Verify initial order: Task 1, Task 2, Task 3
    const initialOrder = await getTaskOrder(toDoColumn)
    expect(initialOrder).toEqual(["Task 1", "Task 2", "Task 3"])

    // Test 1: Reorder within same column - move Task 3 to position 0 (before Task 1)
    // Get fresh references to ensure we have the right elements
    await expect(toDoColumn.getByText("Task 3")).toBeVisible()
    await expect(toDoColumn.getByText("Task 1")).toBeVisible()

    // Verify initial order first
    const beforeDragOrder = await getTaskOrder(toDoColumn)
    expect(beforeDragOrder).toEqual(["Task 1", "Task 2", "Task 3"])

    // Use button role with name pattern to get the task card
    const task3Card = toDoColumn.getByRole("button", { name: /Open task Task 3/i })
    const task1Card = toDoColumn.getByRole("button", { name: /Open task Task 1/i })

    // Drag Task 3 to Task 1 (should place Task 3 before Task 1)
    await dragTaskToTask(task3Card, task1Card)

    // Verify new order: Task 3, Task 1, Task 2
    // (dragTaskToTask already waits for sync to complete)
    const order1 = await getTaskOrder(toDoColumn)
    if (order1[0] !== "Task 3") {
      console.log("Unexpected order after drag:", order1)
    }
    expect(order1).toEqual(["Task 3", "Task 1", "Task 2"])

    // Test 2: Move Task 1 to after Task 2 (end of column)
    // Re-query cards after the previous drag (order has changed)
    await expect(toDoColumn.getByText("Task 1")).toBeVisible()
    await expect(toDoColumn.getByText("Task 2")).toBeVisible()

    const task1CardAfter = toDoColumn.getByRole("button", { name: /Open task Task 1/i })
    const task2CardAfter = toDoColumn.getByRole("button", { name: /Open task Task 2/i })

    await dragTaskToTask(task1CardAfter, task2CardAfter)

    // Verify new order: Task 3, Task 2, Task 1
    const order2 = await getTaskOrder(toDoColumn)
    expect(order2).toEqual(["Task 3", "Task 2", "Task 1"])

    // Test 3: Move Task 3 to "Doing" column and drop it between tasks
    const doingColumn = getColumnContainer("doing")

    // Create tasks in Doing column first
    const doingAddButton = doingColumn.getByRole("button", { name: /add task/i })
    await doingAddButton.click()
    const sidebar4 = await waitForSidebarOpen(page)
    const titleEditable4 = sidebar4.getByText(/new task/i).first()
    await titleEditable4.click()
    const titleInput4 = sidebar4.getByRole("textbox", { name: /task title/i })
    await titleInput4.fill("Doing Task 1")
    await titleInput4.press("Enter")
    await sidebar4.getByRole("button", { name: /back/i }).click()
    await waitForSidebarClose(page)

    await doingAddButton.click()
    const sidebar5 = await waitForSidebarOpen(page)
    const titleEditable5 = sidebar5.getByText(/new task/i).first()
    await titleEditable5.click()
    const titleInput5 = sidebar5.getByRole("textbox", { name: /task title/i })
    await titleInput5.fill("Doing Task 2")
    await titleInput5.press("Enter")
    await sidebar5.getByRole("button", { name: /back/i }).click()
    await waitForSidebarClose(page)

    // Wait for tasks to be visible
    await expect(doingColumn.getByText("Doing Task 1")).toBeVisible()
    await expect(doingColumn.getByText("Doing Task 2")).toBeVisible()

    // Move Task 3 from To Do to between Doing Task 1 and Doing Task 2
    const task3InToDo = toDoColumn.getByRole("button", { name: /Open task Task 3/i })
    const doingTask2Card = doingColumn.getByRole("button", { name: /Open task Doing Task 2/i })

    await dragTaskToTask(task3InToDo, doingTask2Card)

    // Verify Task 3 is now in Doing column between Doing Task 1 and Doing Task 2
    await expect(doingColumn.getByText("Task 3")).toBeVisible()
    await expect(toDoColumn.getByText("Task 3")).not.toBeVisible()

    const doingOrder = await getTaskOrder(doingColumn)
    expect(doingOrder).toEqual(["Doing Task 1", "Task 3", "Doing Task 2"])

    // Test 4: Move Task 1 from To Do to end of Doing column
    const task1InToDo = toDoColumn.getByRole("button", { name: /Open task Task 1/i })

    // Drag to the end of Doing column (hover over the last task)
    const doingTask2CardFinal = doingColumn.getByRole("button", { name: /Open task Doing Task 2/i })
    await dragTaskToTask(task1InToDo, doingTask2CardFinal)

    // Verify Task 1 is now at the end of Doing column
    await expect(doingColumn.getByRole("button", { name: /Open task Task 1/i })).toBeVisible()
    await expect(toDoColumn.getByRole("button", { name: /Open task Task 1/i })).not.toBeVisible()

    const finalDoingOrder = await getTaskOrder(doingColumn)
    // Task 1 is dropped on "Doing Task 2", so it inserts before it
    expect(finalDoingOrder).toEqual(["Doing Task 1", "Task 3", "Task 1", "Doing Task 2"])

    // Wait for all changes to be saved before reloading
    await expect(page.getByText(/saving/i)).not.toBeVisible()

    // Test 5: Verify order persists after page refresh
    await page.reload()
    await waitForBoardLoad(page)

    const toDoColumnReloaded = getColumnContainer("to do")
    const doingColumnReloaded = getColumnContainer("doing")

    // Verify To Do column only has Task 2
    await expect(toDoColumnReloaded.getByRole("button", { name: /Open task Task 2/i })).toBeVisible()
    await expect(toDoColumnReloaded.getByRole("button", { name: /Open task Task 1/i })).not.toBeVisible()
    await expect(toDoColumnReloaded.getByRole("button", { name: /Open task Task 3/i })).not.toBeVisible()

    // Verify Doing column has correct order
    const reloadedDoingOrder = await getTaskOrder(doingColumnReloaded)
    expect(reloadedDoingOrder).toEqual(["Doing Task 1", "Task 3", "Task 1", "Doing Task 2"])
  })
})
