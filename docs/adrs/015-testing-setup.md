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
- The build step automatically initializes the database with `pnpm db:push`
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
- Tests are configured to run **in parallel** (multiple workers) both locally and on CI
- Each test creates isolated boards (unique IDs) so tests can run concurrently without stepping on each other
- SQLite handles concurrent operations safely, but we treat any timeout/flakiness as a **bug** to fix (not something to hide with higher timeouts)
- Each test should work with a clean database state

## Configuration

The Playwright config (`playwright/playwright.config.ts`) includes:

- **Test server**: Automatically builds and starts Next.js production server on port 5800
- **Test database**: Uses `file:test.db` via environment variable
- **Browser**: Chromium only (can be extended to Firefox/WebKit)
- **Retries**: 2 retries on CI, 1 locally
- **Screenshots/Videos**: Captured on failure for debugging
- **Parallel execution**: Enabled (`fullyParallel: true`) with multiple workers
- **Timeouts**: All timeouts configured globally:
  - `timeout: 30000` - 30 seconds maximum per test
  - `expect.timeout: 10000` - 10 seconds for assertions
  - `actionTimeout: 10000` - 10 seconds for actions (click, fill, etc.)
  - `navigationTimeout: 10000` - 10 seconds for navigation

## Timeout Configuration

**All timeouts are configured globally** - no explicit timeouts allowed in test files or helpers.

- **10 second maximum** for actions, assertions, and navigation
- **30 second maximum** for full test execution
- **10 seconds is already very generous** - if an operation takes longer than 10 seconds, it's treated as a bug to be fixed
- **Never increase timeouts** - if a test fails due to timeout, fix the underlying issue (slow operation, missing wait, race condition, etc.)
- This forces us to optimize slow operations rather than masking them with long waits

**Why no explicit timeouts?**
- Consistency - all tests use the same timeout values
- Maintainability - timeout changes happen in one place
- Forces optimization - slow operations are caught early

**Strict Policy:**
- If a test times out, investigate and fix the root cause
- Do not increase timeouts as a workaround
- Common fixes: add proper waits, optimize slow queries, fix race conditions, ensure proper loading states

## Test Balance: Reliability vs Speed

**Goal:** Maintain high reliability while keeping test suite fast enough for rapid feedback.

### Principles

1. **Test critical paths, not every edge case** - Focus on user-facing workflows that would cause real problems if broken
2. **Avoid overlapping test scenarios** - If Test A covers scenario X, don't create Test B that also covers X with minor variations
3. **Prefer integration over unit** - E2E tests should cover complete flows, not individual form validations
4. **Form validation is implicit** - If a form works in the happy path, validation is likely working; don't test every validation rule separately
5. **One test per unique outcome** - If multiple tests verify the same outcome, consolidate them

### When Adding Tests

Before adding a new test, ask:
- **Does this test a unique user flow?** If yes, add it. If it's a variation of existing flow, skip it.
- **Would this catch a real bug users would hit?** If yes, add it. If it's a theoretical edge case, skip it.
- **Does this overlap with existing tests?** If yes, consolidate or skip it.
- **Is this testing implementation details?** If yes, skip it - focus on user-visible behavior.

### Example: Password Change Feature

**Good (2 tests):**
- Test 1: Change password happy path (covers: dialog, warning, success, stays logged in)
- Test 2: Old password invalid after change (covers: old password fails, new password works)

**Avoid (8+ tests):**
- Separate tests for cancel, empty password validation, mismatched passwords, redirect scenarios, etc.
- These overlap with the core flows and slow down the suite without adding meaningful coverage

## Best Practices

1. **Use semantic selectors** - Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
2. **Wait for elements** - Use Playwright's auto-waiting, avoid manual `sleep()` calls
3. **Test user flows** - Focus on what users do, not implementation details
4. **Keep tests independent** - Each test should work in isolation
5. **Use test steps** - Use `test.step()` for better test organization and reporting
6. **No explicit timeouts** - Always use global timeout configuration
7. **Parallel execution** - Tests run in parallel for faster feedback
8. **Balance coverage and speed** - Prefer fewer, focused tests over many overlapping scenarios

## Gotchas (Lessons Learned)

These are recurring root causes behind timeouts/flaky E2E tests. If a test starts failing, check these first.

### Selector collisions (Playwright strict mode)

- Prefer scoping queries to a container:
  - Example: `const sidebar = page.getByRole("dialog", { name: /edit task/i })`
  - Then query within it: `sidebar.getByRole("combobox", { name: /assignees/i })`
- Avoid `getByText(/foo/i)` when the same text can appear in multiple places:
  - Empty states often include the keyword (e.g. "No comments yet" matches `/comments/i`)
  - Dropdown suggestion lists can contain the same labels as the selected value
- When you *must* use text matching, disambiguate with `.first()` / `.nth()` or a more specific role-based locator.

### Accessibility drives testability

We rely on `getByRole(..., { name })` heavily. That requires proper accessible names.

- Icon-only buttons must have `aria-label` (and ideally `title`)
- Custom combobox triggers (e.g. Popover + Button) must have an accessible name:
  - Add `aria-label` (or an associated `<label htmlFor>` + `id`) so tests can do:
    `getByRole("combobox", { name: /assignees/i })`

### Escape key closes the wrong layer

`Escape` can close:
- Popovers/menus (desired), **or**
- the whole sidebar Sheet/dialog (undesired), depending on focus.

Recommendations:
- Prefer closing the sidebar via the explicit UI control (e.g. `Back`) instead of `page.keyboard.press("Escape")`
- In the app, close selection popovers after selecting/creating items to avoid needing Escape at all.

### Optimistic updates should keep stable identities

If the UI swaps an optimistic entity ID for a server ID, it can:
- detach the node Playwright is interacting with (click becomes “element detached”)
- cause confirm dialogs/buttons to become “not stable”

Preferred patterns:
- Create the entity with a deterministic id when possible (client generates id and server accepts it), **or**
- If replacement is unavoidable, ensure the UI remains stable (avoid unmount/remount during critical interactions).

### Drag and drop needs explicit handles

For DnD (dnd-kit):
- Do not attach drag listeners to large interactive regions (headers that also contain inputs/buttons)
- Provide a dedicated “Drag …” handle/button and attach listeners there
- In tests, use pointer-based dragging that matches the app’s sensor/activation constraints.
