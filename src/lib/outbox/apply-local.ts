"use client"

import { useBoardStore, type OutboxItem } from "@/stores/board-store"

/**
 * Apply an outbox item as a local-first mutation.
 * This reconstructs the optimistic state after restoring from localStorage.
 *
 * Only handles item types that create visible entities.
 * Update/delete items don't need reconstruction since the base data comes from server.
 */
export function applyOutboxItemLocally(item: OutboxItem): void {
  const store = useBoardStore.getState()

  switch (item.type) {
    case "createTask": {
      const { taskId, columnId, title, createdAt } = item.payload
      store.createTaskLocal({
        boardId: item.boardId,
        taskId,
        columnId,
        title,
        createdAt,
      })
      break
    }
    case "createColumn": {
      store.createColumnLocal({
        boardId: item.boardId,
        columnId: item.payload.columnId,
        name: "New Column", // Default name, will be updated from server after flush
      })
      break
    }
    case "createContributor": {
      const { contributorId, name, color } = item.payload
      store.createContributorLocal({
        boardId: item.boardId,
        contributorId,
        name,
        color,
      })
      break
    }
    case "createTag": {
      const { tagId, name, color } = item.payload
      store.createTagLocal({
        boardId: item.boardId,
        tagId,
        name,
        color,
      })
      break
    }
    // Update/delete operations don't need local reconstruction
    // since the base state comes from server hydration
    default:
      break
  }
}

/**
 * Apply all outbox items to reconstruct optimistic local state.
 * Called after restoring outbox from localStorage and hydrating from server.
 */
export function applyAllOutboxItemsLocally(boardId: string): void {
  const board = useBoardStore.getState().boardsById[boardId]
  if (!board) return

  for (const item of board.outbox) {
    applyOutboxItemLocally(item)
  }
}
