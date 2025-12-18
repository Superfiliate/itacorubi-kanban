# ADR 013: Query Cache Contracts

Define stable data ordering for TanStack Query to avoid UX drift.

- Hydrate server data once; never overwrite optimistic edits on mount
- Comments: sidebar ASC (old→new); task cards DESC (newest first for “last comment”)
- Optimistic mutations must insert in the correct order and keep lists sorted
- Shared helpers preferred for cache updates to enforce ordering

## Examples

Comment ordering:

- Sidebar data: append and sort ASC
- Card data: prepend and sort DESC for “last comment” freshness

## Links

- Board/task cache updates: `src/hooks/use-board.ts`, `src/hooks/use-task.ts`
