# ADR 010: Offline-First Data Layer with TanStack Query

## Context

Users on slower connections experienced poor UX:
1. Debounced text fields would reset to old values when server responses arrived while typing
2. Creating a task required waiting for the server before opening the sidebar
3. No visibility into sync status

## Decision

We use **TanStack Query** as the client-side data layer for optimistic updates and sync management.

### Architecture

```
UI Components → TanStack Query Cache → Server Actions → Database
               (instant optimistic)   (background sync)
```

### Key Patterns

#### 1. Optimistic Mutations

All mutations use the optimistic update pattern:

```tsx
const mutation = useMutation({
  mutationFn: (data) => serverAction(data),
  onMutate: async (data) => {
    // Cancel in-flight queries
    await queryClient.cancelQueries({ queryKey: ['board', boardId] })

    // Snapshot for rollback
    const previous = queryClient.getQueryData(['board', boardId])

    // Optimistically update cache
    queryClient.setQueryData(['board', boardId], (old) => ({
      ...old,
      // Apply optimistic changes
    }))

    return { previous }
  },
  onError: (err, data, context) => {
    // Rollback on error
    queryClient.setQueryData(['board', boardId], context?.previous)
  },
})
```

#### 2. Client-Side ID Generation

For create operations, generate UUIDs client-side for instant UI updates:

```tsx
onMutate: async () => {
  const optimisticId = crypto.randomUUID()
  // Add to cache with optimistic ID
  return { optimisticId }
},
onSuccess: (serverId, _, context) => {
  // Replace optimistic ID with server ID if different
  if (serverId !== context.optimisticId) {
    // Update cache to use server ID
  }
}
```

#### 3. Server Data Hydration

Server Components fetch initial data, then hydrate the TanStack Query cache:

```tsx
// In Server Component
const board = await getBoard(boardId)

// HydrateBoard client component
export function HydrateBoard({ boardId, boardData }) {
  const queryClient = useQueryClient()

  useEffect(() => {
    queryClient.setQueryData(['board', boardId], boardData)
  }, []) // Only on mount

  return null
}
```

#### 4. Sync Status Indicator

The `SyncIndicator` component shows mutation status:
- **Synced** (green checkmark) - No pending mutations, briefly shown after sync
- **Syncing** (spinner) - Mutations in flight
- Hidden when idle to reduce visual noise

Uses debounced transitions (500ms) to avoid flickering on fast connections.

### Conflict Resolution

We use **client-wins** (last-write-wins) strategy:
- Client changes are applied optimistically
- Server is updated in background
- On error, rollback to previous state
- No complex merge logic needed for this internal tool

### Query Keys

Consistent key structure for cache management:

```tsx
export const boardKeys = {
  all: ['boards'] as const,
  detail: (id: string) => ['boards', id] as const,
}

export const taskKeys = {
  all: ['tasks'] as const,
  detail: (id: string) => ['tasks', id] as const,
}
```

## Files

- `src/lib/query-client.tsx` - Query client provider
- `src/hooks/use-board.ts` - Board queries and column mutations
- `src/hooks/use-task.ts` - Task queries and mutations
- `src/components/sync-indicator.tsx` - Sync status display
- `src/components/board/hydrate-board.tsx` - Server data hydration

## Trade-offs

**Pros:**
- Instant UI feedback on all operations
- Automatic retry on failure
- Clear sync status visibility
- Works with existing server actions

**Cons:**
- More client-side code complexity
- Cache can drift from server if mutations fail silently
- Need to maintain cache updates in sync with server logic
