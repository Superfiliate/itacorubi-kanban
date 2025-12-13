import { test, expect } from "@playwright/test"
import { createTestBoard, unlockTestBoard, waitForBoardLoad } from "./utils/playwright"

test.describe("Board Unlock", () => {
  test("should redirect to unlock page when accessing board without password", async ({ page, context }) => {
    // Create a board first (this sets the password cookie)
    const boardId = await createTestBoard(page, "Locked Board", "testpass123")

    // Clear cookies to simulate not having password
    await context.clearCookies()

    // Try to access the board
    await page.goto(`/boards/${boardId}`)

    // Should redirect to unlock page
    await page.waitForURL(`/boards/${boardId}/unlock`, { timeout: 10000 })

    // Verify unlock page is displayed
    await expect(page.getByRole("heading", { name: /board locked/i })).toBeVisible()
    await expect(page.getByText(/enter the password/i)).toBeVisible()
  })

  test("should unlock board with correct password", async ({ page, context }) => {
    const boardId = await createTestBoard(page, "Unlock Test Board", "correctpass123")

    // Clear cookies
    await context.clearCookies()

    // Navigate to unlock page
    await page.goto(`/boards/${boardId}/unlock`)

    // Enter correct password
    await page.getByPlaceholder(/enter password/i).fill("correctpass123")

    // Click unlock button
    await page.getByRole("button", { name: /unlock board/i }).click()

    // Should redirect to board page
    await page.waitForURL(`/boards/${boardId}`, { timeout: 10000 })

    // Verify board loads
    await waitForBoardLoad(page)
  })

  test("should show error with incorrect password", async ({ page, context }) => {
    const boardId = await createTestBoard(page, "Error Test Board", "rightpass123")

    // Clear cookies
    await context.clearCookies()

    // Navigate to unlock page
    await page.goto(`/boards/${boardId}/unlock`)

    // Enter wrong password
    await page.getByPlaceholder(/enter password/i).fill("wrongpass123")

    // Click unlock button
    await page.getByRole("button", { name: /unlock board/i }).click()

    // Should show error message
    await expect(page.getByText(/invalid password/i)).toBeVisible({ timeout: 5000 })

    // Should still be on unlock page
    expect(page.url()).toContain("/unlock")
  })

  test("should prefill password from query parameter", async ({ page, context }) => {
    const boardId = await createTestBoard(page, "Prefill Test", "prefillpass123")

    // Clear cookies
    await context.clearCookies()

    // Navigate to unlock page with password in query
    await page.goto(`/boards/${boardId}/unlock?password=prefillpass123`)

    // Password should be prefilled
    const passwordInput = page.getByPlaceholder(/enter password/i)
    await expect(passwordInput).toHaveValue("prefillpass123")

    // Still need to click unlock button
    await page.getByRole("button", { name: /unlock board/i }).click()

    // Should redirect to board
    await page.waitForURL(`/boards/${boardId}`, { timeout: 10000 })
    await waitForBoardLoad(page)
  })

  test("should show share dialog with board URL and password", async ({ page }) => {
    const boardId = await createTestBoard(page, "Share Test Board", "sharepass123")

    // Click share button (should be in header - look for Share2 icon button)
    const shareButton = page.locator('button').filter({ hasText: /share/i }).or(page.getByRole("button", { name: /share/i })).first()
    await shareButton.click()

    // Verify share dialog opens
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 })

    // Verify share dialog title
    await expect(page.getByText(/share board/i)).toBeVisible({ timeout: 5000 })

    // Wait for password to load
    await page.waitForTimeout(1000)

    // Verify board URL is shown in input field
    const urlInput = page.getByLabel(/board url/i).or(page.locator('input').filter({ hasText: new RegExp(`/boards/${boardId}`, "i") })).first()
    await expect(urlInput).toBeVisible({ timeout: 5000 })
    await expect(urlInput).toHaveValue(new RegExp(`/boards/${boardId}`, "i"))

    // Copy button should exist (icon button with Copy icon)
    const copyButtons = page.locator('button[title*="Copy"]').or(page.locator('button').filter({ hasText: /copy/i }))
    await expect(copyButtons.first()).toBeVisible({ timeout: 5000 })
  })
})
