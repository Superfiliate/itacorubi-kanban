# Feature: Sync Status

## Overview

Show a small, unobtrusive indicator of sync state so users know when optimistic changes are still syncing.

## Behavior

- Shows “Saving…” (spinner) while any mutation is in flight
- Briefly shows “Saved” after mutations settle, then hides
- Remains hidden when idle to reduce noise
- Debounced to avoid flicker on fast connections

## Notes

- Indicator should appear near editing contexts (e.g., task sidebar header) without blocking actions
- Use global mutation state (e.g., TanStack Query `useIsMutating`) to avoid duplicating logic
- Keep copy concise; avoid stacking multiple status elements

## Links
- Component: `src/components/sync-indicator.tsx`
