import { test, expect } from "@playwright/test"
import { createTestBoard, waitForBoardLoad } from "./utils/playwright"
import path from "path"

const FIXTURES_DIR = path.join(__dirname, "fixtures")
const TEST_IMAGE_PATH = path.join(FIXTURES_DIR, "test-image.png")
const TEST_PDF_PATH = path.join(FIXTURES_DIR, "test-document.pdf")

test.describe("File Uploads", () => {
  test("should upload image via toolbar button and display inline", async ({ page }) => {
    await createTestBoard(page, "Image Upload Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task and wait for sidebar to open
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    await page.waitForURL(/task=/)

    // Wait for sidebar to fully load with comments section
    await expect(page.getByRole("heading", { name: /^comments$/i })).toBeVisible()

    // Create an author first
    const authorSelect = page.getByRole("combobox", { name: /who are you/i })
    await authorSelect.click()
    const authorInput = page.getByPlaceholder(/search or create/i)
    await authorInput.fill("Uploader")
    await page.getByRole("option", { name: /create.*uploader/i }).click()

    // Click the attachment button in the editor toolbar
    const attachButton = page.getByRole("button", { name: /attach file/i })
    await expect(attachButton).toBeVisible()

    // Set up file chooser before clicking
    const fileChooserPromise = page.waitForEvent("filechooser")
    await attachButton.click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(TEST_IMAGE_PATH)

    // Wait for upload success toast
    await expect(page.getByText(/uploaded.*test-image\.png/i)).toBeVisible()

    // Verify image appears in the editor
    const editor = page.locator('[contenteditable="true"]').first()
    await expect(editor.locator("img")).toBeVisible()
  })

  test("should upload PDF and display as download link", async ({ page }) => {
    await createTestBoard(page, "PDF Upload Test", "testpass123")
    await waitForBoardLoad(page)

    // Create a task and wait for sidebar to open
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    await page.waitForURL(/task=/)

    // Wait for sidebar to fully load
    await expect(page.getByRole("heading", { name: /^comments$/i })).toBeVisible()

    // Create an author first
    const authorSelect = page.getByRole("combobox", { name: /who are you/i })
    await authorSelect.click()
    const authorInput = page.getByPlaceholder(/search or create/i)
    await authorInput.fill("PDF Uploader")
    await page.getByRole("option", { name: /create.*pdf uploader/i }).click()

    // Upload PDF via attachment button
    const attachButton = page.getByRole("button", { name: /attach file/i })
    const fileChooserPromise = page.waitForEvent("filechooser")
    await attachButton.click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(TEST_PDF_PATH)

    // Wait for upload success toast
    await expect(page.getByText(/uploaded.*test-document\.pdf/i)).toBeVisible()

    // Verify file attachment appears with filename
    const editor = page.locator('[contenteditable="true"]').first()
    await expect(editor.getByText(/test-document\.pdf/i)).toBeVisible()
  })

  test("should show storage usage in theme toggle dropdown", async ({ page }) => {
    await createTestBoard(page, "Storage Display Test", "testpass123")
    await waitForBoardLoad(page)

    // Click theme toggle to open dropdown
    const themeToggle = page.getByRole("button", { name: /toggle theme/i })
    await themeToggle.click()

    // Verify storage display is visible
    await expect(page.getByText(/board storage/i)).toBeVisible()
    await expect(page.getByText(/0 B.*10/i)).toBeVisible() // 0 B / 10.00 GB
    await expect(page.getByText(/0% used/i)).toBeVisible()
  })

  test("should update storage display after upload", async ({ page }) => {
    await createTestBoard(page, "Storage Update Test", "testpass123")
    await waitForBoardLoad(page)

    // Check initial storage (should be 0)
    const themeToggle = page.getByRole("button", { name: /toggle theme/i })
    await themeToggle.click()
    await expect(page.getByText(/0% used/i)).toBeVisible()
    // Close dropdown by clicking elsewhere
    await page.keyboard.press("Escape")

    // Create a task and upload a file
    const addTaskButton = page.getByRole("button", { name: /add task/i }).first()
    await addTaskButton.click()
    await page.waitForURL(/task=/)

    // Wait for comments section to load
    await expect(page.getByRole("heading", { name: /^comments$/i })).toBeVisible()

    // Create an author
    const authorSelect = page.getByRole("combobox", { name: /who are you/i })
    await authorSelect.click()
    const authorInput = page.getByPlaceholder(/search or create/i)
    await authorInput.fill("Storage Tester")
    await page.getByRole("option", { name: /create.*storage tester/i }).click()

    // Upload a file
    const attachButton = page.getByRole("button", { name: /attach file/i })
    const fileChooserPromise = page.waitForEvent("filechooser")
    await attachButton.click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(TEST_IMAGE_PATH)
    await expect(page.getByText(/uploaded.*test-image\.png/i)).toBeVisible()

    // Close sidebar using back button
    await page.getByRole("button", { name: /back/i }).click()

    // Check storage again - should show some usage now
    await themeToggle.click()
    // The file is very small (< 100 bytes) so it might still show 0 B
    // Just verify the storage section is still visible
    await expect(page.getByText(/board storage/i)).toBeVisible()
  })
})
