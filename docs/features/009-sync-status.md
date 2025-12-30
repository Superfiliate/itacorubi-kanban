# Feature: Sync Status

## Overview

Show a small, unobtrusive indicator of sync state so users know when optimistic changes are still syncing. Users can click or hover to inspect pending operations.

## Behavior

- Shows "Saving…" (spinner) while any local-first outbox mutation is pending/in flight
- Briefly shows "Saved" after mutations settle, then hides
- Remains hidden when idle to reduce noise
- Debounced to avoid flicker on fast connections
- **Click/hover interaction**: Opens a popover showing sync status and list of pending operations

## Popover Details

When users click or hover the sync indicator, a popover displays:

- Current sync status (Saved / Saving...)
- Count of pending operations
- List of pending operations with human-readable labels (e.g., "Creating task", "Updating comment")

This helps users understand what's still syncing and debug sync issues.

## Implementation

The `SyncIndicator` component:

- **Requires `boardId` prop** to scope to the correct board's outbox state
- Reads from `useBoardStore(selectOutboxStatus(boardId))` and `selectOutboxItems(boardId)` (NOT TanStack Query's `useIsMutating`)
- This aligns with ADR 010's local-first architecture where the store is the source of truth
- Wrapped in a `Popover` component for inspection
- Includes `data-testid="sync-indicator"` for Playwright testing

## Usage Locations

The indicator appears in:

- **Board header** (`src/components/board/board-header.tsx`)
- **Task sidebar header** (`src/components/task-sidebar/task-sidebar.tsx`)

When modifying the component interface, update ALL usage locations.

## Testing

Playwright tests use the centralized `waitForSync(page)` helper:

- Located in `playwright/utils/playwright.ts`
- Hardcoded 5s timeout (not configurable per ADR 015)
- Provides descriptive error messages with pending operations when sync fails
- Treats slow sync as an app bug, not a test configuration issue

## Notes

- Indicator should appear near editing contexts without blocking actions
- Keep copy concise; avoid stacking multiple status elements
- Popover provides debugging/inspection capability without cluttering the UI

## Links

- Component: `src/components/sync-indicator.tsx`
- Architecture: `docs/adrs/010-local-first-architecture.md`
- Testing: `docs/adrs/015-testing-setup.md`
