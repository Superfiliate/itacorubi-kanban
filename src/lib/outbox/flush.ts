"use client";

import { useBoardStore, type OutboxItem } from "@/stores/board-store";

async function executeOutboxItem(item: OutboxItem): Promise<void> {
  const res = await fetch(`/api/boards/${item.boardId}/outbox`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ item }),
  });

  if (!res.ok) {
    const details = await res.text().catch(() => "");
    throw new Error(`Outbox sync failed (${res.status}): ${details}`);
  }
}

/**
 * Flushes a board outbox sequentially.
 *
 * Uses the store's isFlushing flag as a lock. If a flush is already in progress,
 * schedule a retry after a short delay. The while loop drains all items, including
 * those added during the flush.
 *
 * If an item fails (e.g. bad password), we log the error and drop it to avoid
 * blocking all future work. This aligns with the "optimize for good actors" approach.
 */
export async function flushBoardOutbox(boardId: string): Promise<void> {
  const store = useBoardStore.getState();
  store.ensureBoard(boardId);

  const initial = useBoardStore.getState().boardsById[boardId];
  if (!initial) return;

  // If already flushing, wait for the in-flight flush to finish.
  // This makes `await flushBoardOutbox()` deterministic for callers that need
  // server-side state to be committed before proceeding (e.g. tests, notifications).
  if (initial.isFlushing) {
    const start = Date.now();
    while (true) {
      const board = useBoardStore.getState().boardsById[boardId];
      if (!board?.isFlushing) break;

      // Safety timeout to avoid hanging forever.
      if (Date.now() - start > 10_000) return;

      await new Promise((r) => setTimeout(r, 25));
    }

    const after = useBoardStore.getState().boardsById[boardId];
    if (after && after.outbox.length > 0 && !after.isFlushing) {
      await flushBoardOutbox(boardId);
    }
    return;
  }

  store.setFlushing(boardId, true);
  try {
    // Drain until empty. Items added during await are picked up in next iteration.
    while (true) {
      const board = useBoardStore.getState().boardsById[boardId];
      const item = board?.outbox[0];
      if (!item) break;

      try {
        await executeOutboxItem(item);
      } catch (error) {
        console.error(`[Outbox] Failed to sync item:`, item.type, error);
      } finally {
        useBoardStore.getState().popOutbox(boardId, item.id);
      }
    }
  } finally {
    useBoardStore.getState().setFlushing(boardId, false);
  }

  // Re-check after clearing isFlushing, in case items were added during race window
  const finalBoard = useBoardStore.getState().boardsById[boardId];
  if (finalBoard && finalBoard.outbox.length > 0) {
    // Use setTimeout(0) to allow other pending code to run first
    setTimeout(() => void flushBoardOutbox(boardId), 0);
  }
}
