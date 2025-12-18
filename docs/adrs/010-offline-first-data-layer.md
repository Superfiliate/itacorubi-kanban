# ADR 010: Offline-First Data Layer (Local-First Store + Outbox)

We treat the **client as the primary source of truth** for interactive UX using a **local-first in-memory store**, and we sync changes to the backend in the background via an **outbox**.

- **Local-first**: UI reads/writes from a normalized in-memory store (no waiting on network for interactions)
- **Outbox background sync**: local writes enqueue mutations that flush to server actions asynchronously
- **Stable client-chosen values**: client generates UUIDs and (where applicable) chooses visual fields (e.g. contributor color) so the backend does not “surprise” the UI later
- **Hydration**: server data is used to hydrate local state once; do not overwrite local edits while outbox is pending
- **Conflict strategy**: last-write-wins; optimize for good actors and low concurrency
- **Sync indicator**: driven by outbox in-flight / pending state via `selectOutboxStatus(boardId)` from the store (NOT TanStack Query's `useIsMutating`). See `docs/features/009-sync-status.md`

TanStack Query may still be used for **one-time hydration**, **polling/revalidation**, and non-interactive fetches, but it is not the primary offline-first interaction layer.

## Examples (optional)

Local-first skeleton:

```ts
applyLocalChange()
enqueueOutboxMutation()
flushOutboxInBackground()
```

## Links

- Store/outbox decision: `docs/adrs/016-local-first-store-and-outbox.md`
- Query plumbing (when used): `src/lib/query-client.tsx`
- Sync indicator: `src/components/sync-indicator.tsx`
