# Feature: Sync Status

## Overview

Show a small, unobtrusive indicator of sync state so users know when optimistic changes are still syncing.

## Behavior

- Shows "Saving…" (spinner) while any local-first outbox mutation is pending/in flight
- Briefly shows "Saved" after mutations settle, then hides
- Remains hidden when idle to reduce noise
- Debounced to avoid flicker on fast connections

## Implementation

The `SyncIndicator` component:
- **Requires `boardId` prop** to scope to the correct board's outbox state
- Reads from `useBoardStore(selectOutboxStatus(boardId))` (NOT TanStack Query's `useIsMutating`)
- This aligns with ADR 010's local-first architecture where the store is the source of truth

## Usage Locations

The indicator appears in:
- **Board header** (`src/components/board/board-header.tsx`)
- **Task sidebar header** (`src/components/task-sidebar/task-sidebar.tsx`)

When modifying the component interface, update ALL usage locations.

## Notes

- Indicator should appear near editing contexts without blocking actions
- Keep copy concise; avoid stacking multiple status elements

## Links
- Component: `src/components/sync-indicator.tsx`
- Architecture: `docs/adrs/010-offline-first-data-layer.md`
