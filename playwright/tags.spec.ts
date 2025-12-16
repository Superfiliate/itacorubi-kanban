import { test, expect } from "@playwright/test"
import { createTestBoard, waitForBoardLoad, waitForSidebarOpen, waitForSidebarClose } from "./utils/playwright"

test.describe("Tags", () => {
  test("should create tag via tags dropdown", async ({ page }) => {
    const boardId = await createTestBoard(page, "Tag Test Board", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    await page.waitForURL(/task=/)

    const sidebar = page.getByRole("dialog", { name: /edit task/i })

    // Open tags dropdown
    const tagsSelect = sidebar.getByRole("combobox", { name: /tags/i })
    await tagsSelect.click()

    // Type a new tag name
    const input = page.getByPlaceholder(/search or create/i)
    await input.fill("New Tag")

    // Click create option
    await page.getByRole("option", { name: /create.*new tag/i }).click()

    // Tag should be created and added (with "#" prefix)
    await expect(sidebar.getByText(/#new tag/i)).toBeVisible()
  })

  test("should assign existing tag to task", async ({ page }) => {
    const boardId = await createTestBoard(page, "Assign Tag Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    await page.waitForURL(/task=/)

    const sidebar = page.getByRole("dialog", { name: /edit task/i })

    // Create a tag first
    const tagsSelect = sidebar.getByRole("combobox", { name: /tags/i })
    await tagsSelect.click()
    const input = page.getByPlaceholder(/search or create/i)
    await input.fill("Existing Tag")
    await page.getByRole("option", { name: /create.*existing tag/i }).click()
    await expect(sidebar.getByText(/#existing tag/i)).toBeVisible()

    // Close sidebar by clicking back
    await sidebar.getByRole("button", { name: /back/i }).click()
    await page.waitForURL(new RegExp(`/boards/${boardId}$`))

    // Create another task
    const addTaskButton2 = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton2.click()
    await page.waitForURL(/task=/)

    const sidebar2 = page.getByRole("dialog", { name: /edit task/i })

    // Open tags dropdown
    await sidebar2.getByRole("combobox", { name: /tags/i }).click()

    // Select existing tag
    await page.getByRole("option", { name: /existing tag/i }).click()

    // Tag should be added (with "#" prefix)
    await expect(sidebar2.getByText(/#existing tag/i)).toBeVisible()
  })

  test("should remove tag from task", async ({ page }) => {
    const boardId = await createTestBoard(page, "Remove Tag Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    await page.waitForURL(/task=/)

    const sidebar = page.getByRole("dialog", { name: /edit task/i })

    // Create and add a tag
    const tagsSelect = sidebar.getByRole("combobox", { name: /tags/i })
    await tagsSelect.click()
    const input = page.getByPlaceholder(/search or create/i)
    await input.fill("To Remove Tag")
    await page.getByRole("option", { name: /create.*to remove tag/i }).click()
    await expect(sidebar.getByText(/#to remove tag/i)).toBeVisible()

    // Remove by clicking X on badge
    const badge = sidebar.getByText(/#to remove tag/i).locator("..")
    await badge.getByRole("button", { name: /remove.*to remove tag/i }).click()

    // Tag should be removed
    await expect(sidebar.getByText(/#to remove tag/i)).not.toBeVisible()
  })

  test("should open tags dialog from header", async ({ page }) => {
    const boardId = await createTestBoard(page, "Dialog Test Board", "testpass123")
    await waitForBoardLoad(page)

    // Click tags button (tag icon) in header
    const tagsButton = page.getByRole("button", { name: /manage tags/i })
    await tagsButton.click()

    // Verify dialog opens
    const dialog = page.getByRole("dialog", { name: /tags/i })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole("heading", { name: /^tags$/i })).toBeVisible()
  })

  test("should edit tag name and color in dialog", async ({ page }) => {
    const boardId = await createTestBoard(page, "Edit Tag Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task and add a tag
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    await page.waitForURL(/task=/)

    const sidebar = page.getByRole("dialog", { name: /edit task/i })
    const tagsSelect = sidebar.getByRole("combobox", { name: /tags/i })
    await tagsSelect.click()
    const input = page.getByPlaceholder(/search or create/i)
    await input.fill("Original Tag")
    await page.getByRole("option", { name: /create.*original tag/i }).click()
    await expect(sidebar.getByText(/#original tag/i)).toBeVisible()

    // Close sidebar
    await sidebar.getByRole("button", { name: /back/i }).click()
    await page.waitForURL(new RegExp(`/boards/${boardId}$`))

    // Open tags dialog
    const tagsButton = page.getByRole("button", { name: /manage tags/i })
    await tagsButton.click()

    const dialog = page.getByRole("dialog", { name: /tags/i })
    await expect(dialog).toBeVisible()

    // Edit tag name - click on the tag name to start editing
    const tagName = dialog.getByText(/#original tag/i)
    await tagName.click()
    // Wait for input to appear (EditableText shows an Input when editing)
    const nameInput = dialog.locator('input').first()
    await nameInput.waitFor({ state: 'visible' })
    // When editing, user can type without "#" - it will be added automatically
    await nameInput.fill("Updated Tag")
    await nameInput.press("Enter")

    // Verify name was updated (with "#" prefix)
    await expect(dialog.getByText(/#updated tag/i)).toBeVisible()

    // Change color by clicking color swatch
    const colorSwatch = dialog.locator('button[title="Change color"]').first()
    await colorSwatch.click()

    // Select a different color (click second color in grid)
    const colorGrid = page.locator('.grid.grid-cols-6').first()
    const colors = colorGrid.locator('button')
    const colorCount = await colors.count()
    if (colorCount > 1) {
      await colors.nth(1).click()
    }

    // Close dialog
    await dialog.getByRole("button", { name: /close/i }).first().click()

    // Reopen task sidebar to verify tag still has updated name
    await page.getByRole("link", { name: /open task.*new task/i }).click()
    const reopenedSidebar = await waitForSidebarOpen(page)
    await expect(reopenedSidebar.getByText(/#updated tag/i)).toBeVisible()
  })

  test("should delete tag when no tasks reference it", async ({ page }) => {
    const boardId = await createTestBoard(page, "Delete Tag Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a tag via dialog
    const tagsButton = page.getByRole("button", { name: /manage tags/i })
    await tagsButton.click()

    const dialog = page.getByRole("dialog", { name: /tags/i })
    const nameInput = dialog.getByPlaceholder(/new tag name/i)
    await nameInput.fill("Tag To Delete")
    await nameInput.press("Enter")

    await expect(dialog.getByText(/#tag to delete/i)).toBeVisible()

    // Delete the tag
    const deleteButton = dialog.getByRole("button", { name: /delete tag/i }).first()
    await deleteButton.click()

    // Confirm deletion
    const confirmDialog = page.getByRole("dialog", { name: /delete tag/i })
    await confirmDialog.getByRole("button", { name: /^delete$/i }).click()

    // Tag should be removed
    await expect(dialog.getByText(/#tag to delete/i)).not.toBeVisible()
  })

  test("should not delete tag with task assignments", async ({ page }) => {
    await createTestBoard(page, "Protected Tag Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task and add a tag
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    const sidebar = await waitForSidebarOpen(page)

    const tagsSelect = sidebar.getByRole("combobox", { name: /tags/i })
    await tagsSelect.click()
    const input = page.getByPlaceholder(/search or create/i)
    await input.fill("Protected Tag")
    await page.getByRole("option", { name: /create.*protected tag/i }).click()
    // Use .first() to target the tag badge in the sidebar (not in the suggestions popover)
    await expect(sidebar.getByText(/#protected tag/i).first()).toBeVisible()

    // Close sidebar
    await sidebar.getByRole("button", { name: /back/i }).click()
    await waitForSidebarClose(page)

    // Open tags dialog
    const tagsButton = page.getByRole("button", { name: /manage tags/i })
    await tagsButton.click()

    const dialog = page.getByRole("dialog", { name: /tags/i })

    // Try to delete the tag - delete button should be disabled
    // Find the delete button - it's in the same row as the tag name
    const tagRow = dialog.locator('div').filter({ hasText: /#protected tag/i }).first()
    const deleteButton = tagRow.getByRole("button", { name: /delete/i }).or(tagRow.locator('button[title*="delete"]')).first()
    await expect(deleteButton).toBeDisabled()
    await expect(deleteButton).toHaveAttribute("title", /cannot delete/i)
  })

  test("should show tag badges on task cards", async ({ page }) => {
    const boardId = await createTestBoard(page, "Tag Badge Test Board", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    await page.waitForURL(/task=/)

    const sidebar = page.getByRole("dialog", { name: /edit task/i })

    // Add a tag
    const tagsSelect = sidebar.getByRole("combobox", { name: /tags/i })
    await tagsSelect.click()
    const input = page.getByPlaceholder(/search or create/i)
    await input.fill("Card Tag")
    await page.getByRole("option", { name: /create.*card tag/i }).click()

    // Close sidebar
    await sidebar.getByRole("button", { name: /back/i }).click()
    await page.waitForURL(new RegExp(`/boards/${boardId}$`))

    // Verify tag badge appears on task card (with "#" prefix)
    const taskCard = page.getByText(/new task/i).locator("..").locator("..")
    await expect(taskCard.getByText(/#card tag/i)).toBeVisible()
  })

  test("should persist tags after background polling (local-first)", async ({ page }) => {
    const boardId = await createTestBoard(page, "Persist Tag Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    await page.waitForURL(/task=/)

    const sidebar = page.getByRole("dialog", { name: /edit task/i })

    // Add a tag
    const tagsSelect = sidebar.getByRole("combobox", { name: /tags/i })
    await tagsSelect.click()
    const input = page.getByPlaceholder(/search or create/i)
    await input.fill("Persistent Tag")
    await page.getByRole("option", { name: /create.*persistent tag/i }).click()
    await expect(sidebar.getByText(/#persistent tag/i)).toBeVisible()

    // Wait for sync to complete (check header indicator, not sidebar)
    await expect(page.locator("header").getByText(/saving/i)).not.toBeVisible()

    // Tag should STILL be visible after sync
    await expect(sidebar.getByText(/#persistent tag/i)).toBeVisible()

    // Close sidebar and reopen to verify persistence
    await sidebar.getByRole("button", { name: /back/i }).click()
    await page.waitForURL(new RegExp(`/boards/${boardId}$`))

    // Reopen sidebar
    await page.getByRole("button", { name: /new task/i }).click()
    await page.waitForURL(/task=/)

    // Tag should still be visible after reopening
    const reopenedSidebar = page.getByRole("dialog", { name: /edit task/i })
    await expect(reopenedSidebar.getByText(/#persistent tag/i)).toBeVisible()
  })
})
