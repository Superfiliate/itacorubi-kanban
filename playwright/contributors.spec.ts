import { test, expect } from "@playwright/test"
import { createTestBoard, waitForBoardLoad } from "./utils/playwright"

test.describe("Contributors", () => {
  test("should create contributor via assignees dropdown and show badge on task card", async ({ page }) => {
    const boardId = await createTestBoard(page, "Contributor Test Board", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    await page.waitForURL(/task=/)

    const sidebar = page.getByRole("dialog", { name: /edit task/i })

    // Open assignees dropdown
    const assigneesSelect = sidebar.getByRole("combobox", { name: /assignees/i })
    await assigneesSelect.click()

    // Type a new contributor name
    const input = page.getByPlaceholder(/search or create/i)
    await input.fill("New Contributor")

    // Click create option
    await page.getByRole("option", { name: /create.*new contributor/i }).click()

    // Contributor should be created and assigned
    await expect(sidebar.getByText(/new contributor/i)).toBeVisible()

    // Close sidebar and verify contributor badge appears on task card
    await sidebar.getByRole("button", { name: /back/i }).click()
    await page.waitForURL(new RegExp(`/boards/${boardId}$`))

    const taskCard = page.getByText(/new task/i).locator("..").locator("..")
    await expect(taskCard.getByText(/new contributor/i)).toBeVisible()
  })

  test("should assign existing contributor to task", async ({ page }) => {
    const boardId = await createTestBoard(page, "Assign Contributor Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    await page.waitForURL(/task=/)

    const sidebar = page.getByRole("dialog", { name: /edit task/i })

    // Create a contributor first
    const assigneesSelect = sidebar.getByRole("combobox", { name: /assignees/i })
    await assigneesSelect.click()
    const input = page.getByPlaceholder(/search or create/i)
    await input.fill("Existing Contributor")
    await page.getByRole("option", { name: /create.*existing contributor/i }).click()
    await expect(sidebar.getByText(/existing contributor/i)).toBeVisible()

    // Create another task
    await sidebar.getByRole("button", { name: /back/i }).click() // Close sidebar
    await page.waitForURL(new RegExp(`/boards/${boardId}$`))

    const addTaskButton2 = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton2.click()
    await page.waitForURL(/task=/)

    const sidebar2 = page.getByRole("dialog", { name: /edit task/i })

    // Open assignees dropdown
    await sidebar2.getByRole("combobox", { name: /assignees/i }).click()

    // Select existing contributor
    await page.getByRole("option", { name: /existing contributor/i }).click()

    // Contributor should be assigned
    await expect(sidebar2.getByText(/existing contributor/i)).toBeVisible()
  })

  test("should remove assignee from task", async ({ page }) => {
    const boardId = await createTestBoard(page, "Remove Assignee Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    await page.waitForURL(/task=/)

    const sidebar = page.getByRole("dialog", { name: /edit task/i })

    // Create and assign a contributor
    const assigneesSelect = sidebar.getByRole("combobox", { name: /assignees/i })
    await assigneesSelect.click()
    const input = page.getByPlaceholder(/search or create/i)
    await input.fill("To Remove")
    await page.getByRole("option", { name: /create.*to remove/i }).click()
    await expect(sidebar.getByText(/to remove/i)).toBeVisible()

    // Remove by clicking X on badge
    const badge = sidebar.getByText(/to remove/i).locator("..")
    await badge.getByRole("button", { name: /remove to remove/i }).click()

    // Contributor should be removed
    await expect(sidebar.getByText(/to remove/i)).not.toBeVisible()
  })

  test("should open contributors dialog from header", async ({ page }) => {
    const boardId = await createTestBoard(page, "Dialog Test Board", "testpass123")
    await waitForBoardLoad(page)

    // Click contributors button (users icon) in header
    const contributorsButton = page.getByRole("button", { name: /manage contributors/i })
    await contributorsButton.click()

    // Verify dialog opens
    const dialog = page.getByRole("dialog", { name: /contributors/i })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole("heading", { name: /^contributors$/i })).toBeVisible()
  })
})
