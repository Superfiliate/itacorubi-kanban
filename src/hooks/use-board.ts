"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getBoard } from "@/actions/boards"
import { deleteColumn } from "@/actions/columns"
import { getRandomEmoji } from "@/lib/emojis"
import { useBoardStore } from "@/stores/board-store"
import { flushBoardOutbox } from "@/lib/outbox/flush"
import type { ContributorColor, TaskPriority } from "@/db/schema"

// Types matching what getBoard returns
export interface BoardTask {
  id: string
  title: string
  priority: TaskPriority
  position: number
  boardId: string
  columnId: string
  createdAt: Date | null
  assignees: Array<{
    contributor: {
      id: string
      name: string
      color: ContributorColor
    }
  }>
  stakeholders?: Array<{
    contributor: {
      id: string
      name: string
      color: ContributorColor
    }
  }>
  tags?: Array<{
    tag: {
      id: string
      name: string
      color: ContributorColor
    }
  }>
  comments: Array<{
    id: string
    createdAt: Date | null
  }>
}

export interface BoardColumn {
  id: string
  name: string
  position: number
  isCollapsed: boolean | null
  boardId: string
  tasks: BoardTask[]
}

export interface BoardContributor {
  id: string
  name: string
  color: ContributorColor
  boardId: string
}

export interface BoardTag {
  id: string
  name: string
  color: ContributorColor
  boardId: string
}

export interface BoardData {
  id: string
  title: string
  createdAt: Date | null
  columns: BoardColumn[]
  contributors: BoardContributor[]
  tags: BoardTag[]
}

// Query keys
export const boardKeys = {
  all: ["boards"] as const,
  detail: (id: string) => ["boards", id] as const,
}

// Hook to get board data
export function useBoardQuery(boardId: string, initialData?: BoardData) {
  return useQuery({
    queryKey: boardKeys.detail(boardId),
    queryFn: () => getBoard(boardId) as Promise<BoardData | undefined>,
    initialData,
    // Don't refetch on window focus to avoid overwriting local changes
    refetchOnWindowFocus: false,
  })
}

// Hook to update board title (local-first + outbox)
export function useUpdateBoardTitle(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (title: string) => {
      // 1) Update local store
      useBoardStore.getState().updateBoardTitleLocal({ boardId, title })

      // 2) Update TanStack cache (for board header display)
      queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
        if (!old) return old
        return { ...old, title }
      })

      // 3) Enqueue for background sync
      useBoardStore.getState().enqueue({
        type: "updateBoardTitle",
        boardId,
        payload: { title },
      })
      void flushBoardOutbox(boardId)
    },
  })
}

// Hook to create a column (local-first + outbox)
export function useCreateColumn(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const emoji = getRandomEmoji()
      const name = `${emoji} New column`

      // 1) Update local store
      useBoardStore.getState().createColumnLocal({ boardId, columnId: id, name })

      // 2) Update TanStack cache
      queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
        if (!old) return old
        const maxPosition = old.columns.length > 0
          ? Math.max(...old.columns.map((c) => c.position))
          : -1

        const newColumn: BoardColumn = {
          id,
          boardId,
          name,
          position: maxPosition + 1,
          isCollapsed: false,
          tasks: [],
        }

        return { ...old, columns: [...old.columns, newColumn] }
      })

      // 3) Enqueue for background sync
      useBoardStore.getState().enqueue({
        type: "createColumn",
        boardId,
        payload: { columnId: id },
      })
      void flushBoardOutbox(boardId)

      return id
    },
  })
}

// Hook to update column name (local-first + outbox)
export function useUpdateColumnName(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ columnId, name }: { columnId: string; name: string }) => {
      // 1) Update local store
      useBoardStore.getState().updateColumnNameLocal({ boardId, columnId, name })

      // 2) Update TanStack cache
      queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
        if (!old) return old
        return {
          ...old,
          columns: old.columns.map((col) =>
            col.id === columnId ? { ...col, name } : col
          ),
        }
      })

      // 3) Enqueue for background sync
      useBoardStore.getState().enqueue({
        type: "updateColumnName",
        boardId,
        payload: { columnId, name },
      })
      void flushBoardOutbox(boardId)
    },
  })
}

// Hook to toggle column collapsed state (local-first + outbox)
export function useToggleColumnCollapsed(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (columnId: string) => {
      // 1) Update local store
      useBoardStore.getState().toggleColumnCollapsedLocal({ boardId, columnId })

      // 2) Update TanStack cache
      queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
        if (!old) return old
        return {
          ...old,
          columns: old.columns.map((col) =>
            col.id === columnId ? { ...col, isCollapsed: !col.isCollapsed } : col
          ),
        }
      })

      // 3) Enqueue for background sync
      useBoardStore.getState().enqueue({
        type: "toggleColumnCollapsed",
        boardId,
        payload: { columnId },
      })
      void flushBoardOutbox(boardId)
    },
  })
}

// Hook to delete a column
// Note: Delete uses server action directly because it has a "restrict" check for tasks.
// We can't use local-first for delete since we need server validation.
export function useDeleteColumn(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (columnId: string) => deleteColumn(columnId, boardId),
    onSuccess: (_result, columnId) => {
      // Update local store
      useBoardStore.getState().deleteColumnLocal({ boardId, columnId })

      // Update TanStack cache
      queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
        if (!old) return old
        const deletedCol = old.columns.find((c) => c.id === columnId)
        if (!deletedCol) return old

        return {
          ...old,
          columns: old.columns
            .filter((col) => col.id !== columnId)
            .map((col) =>
              col.position > deletedCol.position
                ? { ...col, position: col.position - 1 }
                : col
            ),
        }
      })
    },
  })
}

// Hook to reorder columns (local-first + outbox)
export function useReorderColumns(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ columnId, newPosition }: { columnId: string; newPosition: number }) => {
      // 1) Update local store (already done in board-client.tsx via reorderColumnsLocal)
      // The store update happens in handleDragEnd, so we just need to enqueue

      // 2) Update TanStack cache
      queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
        if (!old) return old

        const column = old.columns.find((c) => c.id === columnId)
        if (!column) return old

        const oldPosition = column.position
        if (oldPosition === newPosition) return old

        const updatedColumns = old.columns.map((col) => {
          if (col.id === columnId) {
            return { ...col, position: newPosition }
          }
          if (oldPosition < newPosition) {
            // Moving right
            if (col.position > oldPosition && col.position <= newPosition) {
              return { ...col, position: col.position - 1 }
            }
          } else {
            // Moving left
            if (col.position >= newPosition && col.position < oldPosition) {
              return { ...col, position: col.position + 1 }
            }
          }
          return col
        })

        // Sort by position
        updatedColumns.sort((a, b) => a.position - b.position)

        return { ...old, columns: updatedColumns }
      })

      // 3) Enqueue for background sync
      useBoardStore.getState().enqueue({
        type: "reorderColumns",
        boardId,
        payload: { columnId, newPosition },
      })
      void flushBoardOutbox(boardId)
    },
  })
}

// Hook to optimistically update columns (for drag and drop)
export function useOptimisticColumnsUpdate(boardId: string) {
  const queryClient = useQueryClient()

  return {
    setColumns: (updater: (columns: BoardColumn[]) => BoardColumn[]) => {
      queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
        if (!old) return old
        return { ...old, columns: updater(old.columns) }
      })
    },
  }
}
