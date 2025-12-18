"use client"

import { useEffect, useCallback } from "react"
import { useBoardStore, selectOutboxStatus } from "@/stores/board-store"
import { useShallow } from "zustand/react/shallow"
import { flushBoardOutbox } from "@/lib/outbox/flush"

/**
 * Guards against data loss from navigating away while outbox has pending items.
 *
 * - Registers a `beforeunload` handler that warns users if they try to close/refresh
 *   the tab while changes are still syncing
 * - Provides `awaitFlush()` to wait for all pending items to sync (for programmatic use)
 *
 * Usage:
 * ```tsx
 * function BoardPage({ boardId }) {
 *   const { hasPendingChanges, awaitFlush } = useOutboxGuard(boardId)
 *   // beforeunload is automatically registered when hasPendingChanges is true
 * }
 * ```
 */
export function useOutboxGuard(boardId: string) {
  const outboxStatus = useBoardStore(useShallow(selectOutboxStatus(boardId)))
  const hasPendingChanges = outboxStatus.pending || outboxStatus.isFlushing

  // Register beforeunload handler when there are pending changes
  useEffect(() => {
    if (!hasPendingChanges) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Check current state (may have changed since effect ran)
      const board = useBoardStore.getState().boardsById[boardId]
      if (!board || (board.outbox.length === 0 && !board.isFlushing)) {
        return
      }

      // Standard way to trigger browser's "unsaved changes" dialog
      e.preventDefault()
      // For older browsers
      e.returnValue = "You have unsaved changes. Are you sure you want to leave?"
      return e.returnValue
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [boardId, hasPendingChanges])

  /**
   * Wait for the outbox to be fully flushed.
   * Useful for ensuring data is synced before programmatic navigation.
   */
  const awaitFlush = useCallback(async (): Promise<void> => {
    // Trigger flush if not already in progress
    await flushBoardOutbox(boardId)

    // Poll until outbox is empty (handles items added during flush)
    return new Promise((resolve) => {
      const check = () => {
        const board = useBoardStore.getState().boardsById[boardId]
        if (!board || (board.outbox.length === 0 && !board.isFlushing)) {
          resolve()
        } else {
          setTimeout(check, 50)
        }
      }
      check()
    })
  }, [boardId])

  return {
    hasPendingChanges,
    awaitFlush,
  }
}
