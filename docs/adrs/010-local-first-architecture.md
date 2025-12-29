# ADR 010: Local-First Architecture

Treat the **client as the primary source of truth** for interactive UX using a **local-first in-memory store**, with an **outbox** that syncs changes to the server in the background.

## Rationale

- **Local-first**: UI reads/writes from a normalized in-memory store (no waiting on network for interactions)
- **Outbox background sync**: Local writes enqueue mutations that flush to server actions asynchronously
- **Stable client-chosen values**: Client generates UUIDs and chooses visual fields (e.g., contributor color) so the backend does not "surprise" the UI later
- **Conflict strategy**: Last-write-wins; optimize for good actors and low concurrency

TanStack Query may still be used for **one-time hydration**, **polling/revalidation**, and non-interactive fetches, but it is not the primary interaction layer.

## Normalized Model

Store entities once, reference by ID. A contributor rename/color change updates one place and reflects everywhere.

```
contributorsById[contributorId] = { id, name, color }
tasksById[taskId] = { id, title, columnId, createdAt }
columnsById[columnId] = { id, name, isCollapsed, position }

Relationships:
  columnOrder: columnId[]
  tasksByColumnId[columnId]: taskId[]
  assigneeIdsByTaskId[taskId]: contributorId[]
  commentMetaByTaskId[taskId] = { count, lastCreatedAt }
  taskDetailsById[taskId] - sidebar-only details (comments, etc)
```

### Deriving vs. Denormalizing

**Always derive** nested entity data from normalized stores at render time:

```typescript
// ✅ Good: Derive assignees from normalized store
const assigneeIds = board.assigneeIdsByTaskId[taskId] ?? [];
const assignees = assigneeIds.map((id) => board.contributorsById[id]).filter(Boolean);

// ❌ Bad: Using nested data that becomes stale
const assignees = task.assignees; // Contains stale { contributor: { color, name } }
```

## Outbox

Local writes enqueue an outbox item describing the server mutation to perform.

- Flush is **sequential** (simpler ordering, matches last-write-wins)
- If authorization fails (wrong password), the UI may diverge and that's acceptable

### Outbox Persistence (Navigation Resilience)

The outbox is persisted to **localStorage** to prevent data loss when users navigate away before sync completes.

**How it works:**

1. When items are enqueued/dequeued, the outbox is saved to localStorage
2. On page load, `ensureBoard()` restores any persisted outbox items
3. `HydrateBoard` applies restored items locally to reconstruct optimistic state
4. Flushing resumes automatically

**Navigation protection:**

- `beforeunload` handler warns users if they try to close/refresh with pending changes
- Even if users dismiss the warning, localStorage persistence ensures data isn't lost
- On return to the board, pending changes are synced and visible immediately

### Reconciliation Rules

- Remote hydration/polling must **not overwrite** local state while a flush is in progress
- When restored outbox items exist, hydrate from server first, then apply outbox items to reconstruct optimistic state
- When the store is clean (no pending/in-flight outbox), remote snapshots may hydrate the store to reflect concurrent edits

## Examples

### Creating a Task (Local-First)

```typescript
// 1) Choose stable values locally
const id = crypto.randomUUID();
const title = "{emoji} New task";

// 2) Apply local state immediately (sidebar can open instantly)
store.createTaskLocal({ id, title, columnId });

// 3) Enqueue background sync (server persists the same id/title)
store.enqueue({ type: "createTask", payload: { id, title, columnId } });
```

### Local-First Skeleton

```typescript
applyLocalChange();
enqueueOutboxMutation();
flushOutboxInBackground();
```

## Key Files

- `src/stores/board-store.ts` - Zustand store with normalized entities
- `src/lib/outbox/persistence.ts` - localStorage save/load
- `src/lib/outbox/apply-local.ts` - Reconstructs optimistic state from outbox items
- `src/hooks/use-outbox-guard.ts` - beforeunload handler hook
- `src/components/board/outbox-guard.tsx` - Board-level guard component
- `src/components/sync-indicator.tsx` - Sync status driven by `selectOutboxStatus(boardId)`
