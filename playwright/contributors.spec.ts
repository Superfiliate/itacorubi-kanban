import { test, expect } from "@playwright/test"
import { createTestBoard, waitForBoardLoad } from "./utils/playwright"

test.describe("Contributors", () => {
  test("should create contributor via assignees dropdown", async ({ page }) => {
    const boardId = await createTestBoard(page, "Contributor Test Board", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    await page.waitForURL(/task=/)

    // Open assignees dropdown
    const assigneesSelect = page.getByRole("combobox", { name: /assignees/i })
    await assigneesSelect.click()

    // Type a new contributor name
    const input = page.getByPlaceholder(/search or create/i)
    await input.fill("New Contributor")

    // Click create option
    await page.getByRole("option", { name: /create.*new contributor/i }).click()

    // Contributor should be created and assigned
    await expect(page.getByText(/new contributor/i)).toBeVisible()
  })

  test("should assign existing contributor to task", async ({ page }) => {
    const boardId = await createTestBoard(page, "Assign Contributor Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    await page.waitForURL(/task=/)

    // Create a contributor first
    const assigneesSelect = page.getByRole("combobox", { name: /assignees/i })
    await assigneesSelect.click()
    const input = page.getByPlaceholder(/search or create/i)
    await input.fill("Existing Contributor")
    await page.getByRole("option", { name: /create.*existing contributor/i }).click()
    await expect(page.getByText(/existing contributor/i)).toBeVisible()

    // Close dropdown
    await page.keyboard.press("Escape")

    // Create another task
    await page.keyboard.press("Escape") // Close sidebar
    await page.waitForURL(new RegExp(`/boards/${boardId}$`))

    const addTaskButton2 = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton2.click()
    await page.waitForURL(/task=/)

    // Open assignees dropdown
    await page.getByRole("combobox", { name: /assignees/i }).click()

    // Select existing contributor
    await page.getByRole("option", { name: /existing contributor/i }).click()

    // Contributor should be assigned
    await expect(page.getByText(/existing contributor/i)).toBeVisible()
  })

  test("should remove assignee from task", async ({ page }) => {
    const boardId = await createTestBoard(page, "Remove Assignee Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    await page.waitForURL(/task=/)

    // Create and assign a contributor
    const assigneesSelect = page.getByRole("combobox", { name: /assignees/i })
    await assigneesSelect.click()
    const input = page.getByPlaceholder(/search or create/i)
    await input.fill("To Remove")
    await page.getByRole("option", { name: /create.*to remove/i }).click()
    await expect(page.getByText(/to remove/i)).toBeVisible()

    // Remove by clicking X on badge
    const badge = page.getByText(/to remove/i).locator("..")
    const removeButton = badge.locator('button').filter({ hasText: /×/ }).or(badge.locator('[aria-label*="remove"]'))
    await removeButton.click()

    // Contributor should be removed
    await expect(page.getByText(/to remove/i)).not.toBeVisible()
  })

  test("should show contributor badges on task cards", async ({ page }) => {
    const boardId = await createTestBoard(page, "Badge Test Board", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    await page.waitForURL(/task=/)

    // Assign a contributor
    const assigneesSelect = page.getByRole("combobox", { name: /assignees/i })
    await assigneesSelect.click()
    const input = page.getByPlaceholder(/search or create/i)
    await input.fill("Card Contributor")
    await page.getByRole("option", { name: /create.*card contributor/i }).click()

    // Close sidebar
    await page.keyboard.press("Escape")
    await page.waitForURL(new RegExp(`/boards/${boardId}$`))

    // Verify contributor badge appears on task card
    const taskCard = page.getByText(/new task/i).locator("..").locator("..")
    await expect(taskCard.getByText(/card contributor/i)).toBeVisible()
  })

  test("should open contributors dialog from header", async ({ page }) => {
    const boardId = await createTestBoard(page, "Dialog Test Board", "testpass123")
    await waitForBoardLoad(page)

    // Click contributors button (users icon) in header
    const contributorsButton = page.getByRole("button", { name: /contributors/i }).or(page.locator('button[aria-label*="users"]'))
    await contributorsButton.click()

    // Verify dialog opens
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByText(/contributors/i)).toBeVisible()
  })
})
