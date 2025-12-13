# ADR 015: Testing Setup

We use Playwright for end-to-end testing of high-level user flows.

- **E2E testing only** - Focus on testing complete user workflows, not individual component interactions
- **Playwright** - Single tool for all E2E testing needs
- **Test database isolation** - Each test run uses a separate `test.db` file
- **Real browser testing** - Tests run in actual Chromium browsers

## Test Organization

All Playwright tests and utilities are located in the `playwright/` directory:

```
playwright/
├── playwright.config.ts       # Playwright configuration
├── global-setup.ts            # Database reset before all tests
├── board-creation.spec.ts     # Board creation flow tests
├── board-unlock.spec.ts       # Board unlock/access flow tests
├── task-management.spec.ts    # Task CRUD operations tests
├── comments.spec.ts           # Comments flow tests
├── contributors.spec.ts       # Contributors management tests
├── columns.spec.ts            # Columns management tests
└── utils/
    ├── db.ts                  # Database helper utilities
    └── playwright.ts          # Playwright test helpers
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in UI mode (interactive)
pnpm test:ui

# Run tests in debug mode
pnpm test:debug

# Run specific test file
pnpm test playwright/board-creation.spec.ts
```

## Test Database

- Tests use a separate `test.db` file (not `local.db`)
- Database is reset before all tests run via `global-setup.ts`
- The webServer automatically initializes the database with `pnpm db:push`
- Environment variable `TURSO_DATABASE_URL=file:test.db` is set for test runs

## Test Patterns

### High-Level Feature Testing

Tests focus on complete user workflows:

```typescript
test("should create a new board from homepage", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: /create.*board/i }).click()
  // ... complete flow
})
```

### Test Helpers

Use helpers from `playwright/utils/playwright.ts`:

- `createTestBoard()` - Create a board via UI
- `unlockTestBoard()` - Unlock a board in browser context
- `waitForBoardLoad()` - Wait for board to be fully loaded

### Database Isolation

- Database is reset once before all tests via `global-setup.ts`
- Tests run sequentially (`fullyParallel: false`) to avoid database conflicts
- Each test should work with a clean database state

## Configuration

The Playwright config (`playwright/playwright.config.ts`) includes:

- **Test server**: Automatically starts Next.js dev server on port 5800
- **Test database**: Uses `file:test.db` via environment variable
- **Browser**: Chromium only (can be extended to Firefox/WebKit)
- **Retries**: 2 retries on CI, 0 locally
- **Screenshots/Videos**: Captured on failure for debugging

## Best Practices

1. **Use semantic selectors** - Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
2. **Wait for elements** - Use Playwright's auto-waiting, avoid manual `sleep()` calls
3. **Test user flows** - Focus on what users do, not implementation details
4. **Keep tests independent** - Each test should work in isolation
5. **Use test steps** - Use `test.step()` for better test organization and reporting

## Future Considerations

- Can add Playwright Component Testing if needed for isolated component tests
- Can extend to Firefox and WebKit browsers for cross-browser testing
- Can add visual regression testing with Playwright's screenshot comparison
- Can add accessibility testing with Playwright's accessibility snapshots
