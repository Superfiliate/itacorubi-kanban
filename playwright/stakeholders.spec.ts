import { test, expect } from "@playwright/test"
import { createTestBoard, waitForBoardLoad, waitForSidebarOpen, waitForSidebarClose } from "./utils/playwright"

test.describe("Stakeholders", () => {
  test("should create stakeholder via stakeholders dropdown", async ({ page }) => {
    const boardId = await createTestBoard(page, "Stakeholder Test Board", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    const sidebar = await waitForSidebarOpen(page)

    // Open stakeholders dropdown
    const stakeholdersSelect = sidebar.getByRole("combobox", { name: /stakeholders/i })
    await stakeholdersSelect.click()

    // Type a new contributor name
    const input = page.getByPlaceholder(/search or create/i)
    await input.fill("New Stakeholder")

    // Click create option
    await page.getByRole("option", { name: /create.*new stakeholder/i }).click()

    // Stakeholder should be created and added (use first() to avoid matching dropdown suggestion)
    await expect(sidebar.getByText(/new stakeholder/i).first()).toBeVisible()
  })

  test("should assign existing contributor as stakeholder", async ({ page }) => {
    const boardId = await createTestBoard(page, "Assign Stakeholder Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    const sidebar = await waitForSidebarOpen(page)

    // Create a contributor first (via assignees)
    const assigneesSelect = sidebar.getByRole("combobox", { name: /assignees/i })
    await assigneesSelect.click()
    const input = page.getByPlaceholder(/search or create/i)
    await input.fill("Existing Contributor")
    await page.getByRole("option", { name: /create.*existing contributor/i }).click()
    await expect(sidebar.getByText(/existing contributor/i).first()).toBeVisible()

    // Close sidebar
    await sidebar.getByRole("button", { name: /back/i }).click()
    await waitForSidebarClose(page)

    // Create another task
    const addTaskButton2 = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton2.click()
    const sidebar2 = await waitForSidebarOpen(page)

    // Open stakeholders dropdown
    await sidebar2.getByRole("combobox", { name: /stakeholders/i }).click()

    // Select existing contributor
    await page.getByRole("option", { name: /existing contributor/i }).click()

    // Contributor should be added as stakeholder (use first() to avoid matching dropdown)
    await expect(sidebar2.getByText(/existing contributor/i).first()).toBeVisible()
  })

  test("should remove stakeholder from task", async ({ page }) => {
    const boardId = await createTestBoard(page, "Remove Stakeholder Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    const sidebar = await waitForSidebarOpen(page)

    // Create and add a stakeholder
    const stakeholdersSelect = sidebar.getByRole("combobox", { name: /stakeholders/i })
    await stakeholdersSelect.click()
    const input = page.getByPlaceholder(/search or create/i)
    await input.fill("To Remove Stakeholder")
    await page.getByRole("option", { name: /create.*to remove stakeholder/i }).click()
    await expect(sidebar.getByText(/to remove stakeholder/i).first()).toBeVisible()

    // Remove by clicking X on badge
    const badge = sidebar.getByText(/to remove stakeholder/i).first().locator("..")
    await badge.getByRole("button", { name: /remove to remove stakeholder/i }).click()

    // Stakeholder should be removed
    await expect(sidebar.getByText(/to remove stakeholder/i)).not.toBeVisible()
  })

  test("should add stakeholder to comment", async ({ page }) => {
    const boardId = await createTestBoard(page, "Comment Stakeholder Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    const sidebar = await waitForSidebarOpen(page)

    // Create an author
    const authorSelect = sidebar.getByRole("combobox", { name: /who are you/i })
    await authorSelect.click()
    const authorInput = page.getByPlaceholder(/search or create/i)
    await authorInput.fill("Comment Author")
    await page.getByRole("option", { name: /create.*comment author/i }).click()

    // Select a stakeholder for the comment - scope to comments section
    const commentsSection = sidebar.getByRole("heading", { name: /^comments$/i }).locator("..")
    const stakeholderSelect = commentsSection.getByRole("combobox", { name: /select stakeholder/i })
    await stakeholderSelect.click()
    // The popover should be the most recently opened one
    const stakeholderInput = page.getByPlaceholder(/search or create/i).last()
    await stakeholderInput.fill("Comment Stakeholder")
    await page.getByRole("option", { name: /create.*comment stakeholder/i }).last().click()

    // Add comment
    const editor = sidebar.locator('[contenteditable="true"]').first()
    await editor.click()
    await editor.fill("Comment with stakeholder")
    await page.getByRole("button", { name: /add comment/i }).click()
    await expect(page.getByText(/comment added/i)).toBeVisible()

    // Verify comment shows author and stakeholder
    // Wait for comment to appear, then verify badges
    await expect(page.getByText(/comment with stakeholder/i)).toBeVisible()
    // Find comment by looking for the container that has both the text and the badges
    const commentSection = sidebar.getByRole("heading", { name: /^comments$/i }).locator("..")
    // Verify badges appear (use first() to handle multiple matches from dropdowns)
    await expect(commentSection.getByText(/comment author/i).first()).toBeVisible()
    await expect(commentSection.getByText(/comment stakeholder/i).first()).toBeVisible()
    await expect(commentSection.getByText(/\bas\b/i).first()).toBeVisible() // "as" text between author and stakeholder
  })

  test("should edit comment stakeholder", async ({ page }) => {
    const boardId = await createTestBoard(page, "Edit Comment Stakeholder Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task and add a comment with stakeholder
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    const sidebar = await waitForSidebarOpen(page)

    // Create author and stakeholder
    const authorSelect = sidebar.getByRole("combobox", { name: /who are you/i })
    await authorSelect.click()
    const authorInput = page.getByPlaceholder(/search or create/i)
    await authorInput.fill("Editor Author")
    await page.getByRole("option", { name: /create.*editor author/i }).click()

    // Scope to comments section to avoid task stakeholders dropdown
    const commentsSection = sidebar.getByRole("heading", { name: /^comments$/i }).locator("..")
    const stakeholderSelect = commentsSection.getByRole("combobox", { name: /select stakeholder/i })
    await stakeholderSelect.click()
    // The popover should be the most recently opened one
    const stakeholderInput = page.getByPlaceholder(/search or create/i).last()
    await stakeholderInput.fill("Original Stakeholder")
    await page.getByRole("option", { name: /create.*original stakeholder/i }).last().click()

    // Add comment
    const editor = sidebar.locator('[contenteditable="true"]').first()
    await editor.click()
    await editor.fill("Comment to edit")
    await page.getByRole("button", { name: /add comment/i }).click()
    await expect(page.getByText(/comment added/i)).toBeVisible()

    // Edit the comment
    await page.getByText(/comment to edit/i).hover()
    await page.getByRole("button", { name: /comment actions/i }).click()
    await page.getByRole("menuitem", { name: /edit/i }).click()

    // Change stakeholder - find edit form by looking for the rounded border div containing editable content
    const editForm = sidebar.locator('div.rounded-lg.border').filter({ hasText: /comment to edit/i }).first()
    const editStakeholderSelect = editForm.getByRole("combobox", { name: /select stakeholder/i })
    await editStakeholderSelect.click()
    // The popover should be the most recently opened one
    const editStakeholderInput = page.getByPlaceholder(/search or create/i).last()
    await editStakeholderInput.fill("Updated Stakeholder")
    await page.getByRole("option", { name: /create.*updated stakeholder/i }).last().click()

    // Save
    await page.getByRole("button", { name: /save/i }).click()

    // Verify stakeholder was updated
    await expect(page.getByText(/updated stakeholder/i)).toBeVisible()
    await expect(page.getByText(/original stakeholder/i)).not.toBeVisible()
  })

  test("should persist stakeholders after background polling (local-first)", async ({ page }) => {
    const boardId = await createTestBoard(page, "Persist Stakeholder Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    const sidebar = await waitForSidebarOpen(page)

    // Add a stakeholder
    const stakeholdersSelect = sidebar.getByRole("combobox", { name: /stakeholders/i })
    await stakeholdersSelect.click()
    const input = page.getByPlaceholder(/search or create/i)
    await input.fill("Persistent Stakeholder")
    await page.getByRole("option", { name: /create.*persistent stakeholder/i }).click()
    await expect(sidebar.getByText(/persistent stakeholder/i).first()).toBeVisible()

    // Wait for sync to complete (check header indicator, not sidebar)
    await expect(page.locator("header").getByText(/saving/i)).not.toBeVisible()

    // Stakeholder should STILL be visible after sync
    await expect(sidebar.getByText(/persistent stakeholder/i).first()).toBeVisible()

    // Close sidebar and reopen to verify persistence
    await sidebar.getByRole("button", { name: /back/i }).click()
    await waitForSidebarClose(page)

    // Reopen sidebar by clicking the task card link
    await page.getByRole("link", { name: /open task.*new task/i }).click()
    const reopenedSidebar = await waitForSidebarOpen(page)

    // Stakeholder should still be visible after reopening
    await expect(reopenedSidebar.getByText(/persistent stakeholder/i)).toBeVisible()
  })
})
