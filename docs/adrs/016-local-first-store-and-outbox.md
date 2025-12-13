# ADR 016: Local-First Store + Outbox (Normalized Entities)

Use a local-first, **in-memory normalized store** for interactive UI state, with an **outbox** that syncs changes to server actions in the background.

- Avoids clunky UX caused by waiting on backend-generated values (IDs/colors) before updating UI
- Prevents “update N places” bugs by storing entities once and referencing them by ID
- Supports future persistence (IndexedDB/localStorage) behind a small adapter boundary

## Normalized model (conceptual)

- `contributorsById[contributorId] = { id, name, color }`
- `tasksById[taskId] = { id, title, columnId, createdAt }`
- `columnsById[columnId] = { id, name, isCollapsed, position }`
- Relationships:
  - `columnOrder: columnId[]`
  - `tasksByColumnId[columnId]: taskId[]`
  - `assigneeIdsByTaskId[taskId]: contributorId[]`
  - `commentMetaByTaskId[taskId] = { count, lastCreatedAt }`
  - `taskDetailsById[taskId]` for sidebar-only details (comments, etc)

UI uses **selectors** to build view models by joining these structures. A contributor rename/color change updates `contributorsById` once and is reflected everywhere.

## Outbox

Local writes enqueue an outbox item describing the server mutation to perform.

- Outbox flush is **sequential** (simpler ordering, matches last-write-wins)
- We optimize for good actors; if authorization fails (wrong password), the UI may diverge and that’s acceptable

### Reconcile rules

- Remote hydration/polling must **not overwrite** local state while:
  - outbox is non-empty, or
  - a flush is in progress
- When the store is clean (no pending/in-flight outbox), remote snapshots may hydrate the store to reflect concurrent edits.

## Examples

Creating a task (local-first):

```ts
// 1) choose stable values locally
const id = crypto.randomUUID()
const title = "{emoji} New task"

// 2) apply local state immediately (sidebar can open instantly)
store.createTaskLocal({ id, title, columnId })

// 3) enqueue background sync (server persists the same id/title)
store.enqueue({ type: "createTask", payload: { id, title, columnId } })
```
