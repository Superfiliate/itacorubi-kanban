"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { boardKeys, type BoardData } from "@/hooks/use-board";
import { taskKeys, type TaskWithComments } from "@/hooks/use-task";
import { useBoardStore } from "@/stores/board-store";
import { flushBoardOutbox } from "@/lib/outbox/flush";
import { applyAllOutboxItemsLocally } from "@/lib/outbox/apply-local";

interface HydrateBoardProps {
  boardId: string;
  boardData: BoardData;
  taskData?: TaskWithComments | null;
}

/**
 * Hydrates the TanStack Query cache with server-fetched data.
 * This allows Server Components to fetch data while Client Components
 * can use the cached data for optimistic updates.
 *
 * Also resumes flushing any persisted outbox items from a previous session,
 * and reconstructs the optimistic local state.
 */
export function HydrateBoard({ boardId, boardData, taskData }: HydrateBoardProps) {
  const queryClient = useQueryClient();
  const hasHydrated = useRef(false);

  useEffect(() => {
    // Only hydrate once on mount to avoid overwriting client changes
    if (hasHydrated.current) return;
    hasHydrated.current = true;

    // Hydrate board data (this also restores persisted outbox items via ensureBoard)
    queryClient.setQueryData(boardKeys.detail(boardId), boardData);
    useBoardStore.getState().hydrateBoardFromServer(boardId, boardData);

    // Hydrate task data if provided
    if (taskData) {
      queryClient.setQueryData(taskKeys.detail(taskData.id), taskData);
      useBoardStore.getState().hydrateTaskFromServer(boardId, taskData);
    }

    // If there are restored outbox items, apply them locally to reconstruct
    // the optimistic state, then resume flushing
    const board = useBoardStore.getState().boardsById[boardId];
    if (board && board.outbox.length > 0) {
      // Reconstruct optimistic state from outbox items
      applyAllOutboxItemsLocally(boardId);

      // Resume flushing to sync with server
      void flushBoardOutbox(boardId);
    }
  }, [queryClient, boardId, boardData, taskData]);

  return null;
}
