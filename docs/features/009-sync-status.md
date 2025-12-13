# Feature: Sync Status

## Overview

Show a small, unobtrusive indicator of sync state so users know when optimistic changes are still syncing.

## Behavior

- Shows “Saving…” (spinner) while any local-first outbox mutation is pending/in flight
- Briefly shows “Saved” after mutations settle, then hides
- Remains hidden when idle to reduce noise
- Debounced to avoid flicker on fast connections

## Notes

- Indicator should appear near editing contexts (e.g., task sidebar header) without blocking actions
- Prefer a single global signal (outbox pending/in-flight). TanStack Query `useIsMutating` can be used during transitions.
- Keep copy concise; avoid stacking multiple status elements

## Links
- Component: `src/components/sync-indicator.tsx`
