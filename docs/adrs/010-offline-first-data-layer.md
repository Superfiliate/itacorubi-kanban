# ADR 010: Offline-First Data Layer with TanStack Query

We use TanStack Query for optimistic UX and background sync.

- Mutations: cancel related queries, snapshot, update optimistically, rollback on error
- Client-generated UUIDs enable instant creates; swap to server IDs only if they differ
- Hydrate server data once; don’t overwrite optimistic cache on mount
- Lightweight sync indicator to show syncing vs saved; debounce to avoid flicker (see `docs/features/009-sync-status.md`)
- Conflict strategy: last-write-wins; keep cache updates simple and consistent with server actions

Prefer shared helpers for cache updates and a consistent key shape (boards, tasks) to reduce drift.

## Examples

Optimistic skeleton:
```tsx
useMutation({
  mutationFn: doAction,
  onMutate: async () => {
    await qc.cancelQueries({ queryKey })
    const prev = qc.getQueryData(queryKey)
    qc.setQueryData(queryKey, updater)
    return { prev }
  },
  onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(queryKey, ctx.prev),
})
```

## Links
- Query plumbing: `src/lib/query-client.tsx`
- Offline sync indicator: `src/components/sync-indicator.tsx`
