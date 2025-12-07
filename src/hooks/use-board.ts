"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getBoard, updateBoardTitle } from "@/actions/boards"
import {
  createColumn,
  updateColumnName,
  toggleColumnCollapsed,
  deleteColumn,
  reorderColumns,
} from "@/actions/columns"
import { getRandomEmoji } from "@/lib/emojis"
import type { ContributorColor } from "@/db/schema"

// Types matching what getBoard returns
export interface BoardTask {
  id: string
  title: string
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

export interface BoardData {
  id: string
  title: string
  createdAt: Date | null
  columns: BoardColumn[]
  contributors: BoardContributor[]
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

// Hook to update board title
export function useUpdateBoardTitle(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (title: string) => updateBoardTitle(boardId, title),
    onMutate: async (title) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: boardKeys.detail(boardId) })

      // Snapshot previous value
      const previous = queryClient.getQueryData<BoardData>(boardKeys.detail(boardId))

      // Optimistically update
      queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
        if (!old) return old
        return { ...old, title }
      })

      return { previous }
    },
    onError: (_err, _title, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(boardKeys.detail(boardId), context.previous)
      }
    },
  })
}

// Hook to create a column
export function useCreateColumn(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => createColumn(boardId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: boardKeys.detail(boardId) })

      const previous = queryClient.getQueryData<BoardData>(boardKeys.detail(boardId))
      const optimisticId = crypto.randomUUID()
      const emoji = getRandomEmoji()

      queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
        if (!old) return old
        const maxPosition = old.columns.length > 0
          ? Math.max(...old.columns.map((c) => c.position))
          : -1

        const newColumn: BoardColumn = {
          id: optimisticId,
          boardId,
          name: `${emoji} New column`,
          position: maxPosition + 1,
          isCollapsed: false,
          tasks: [],
        }

        return { ...old, columns: [...old.columns, newColumn] }
      })

      return { previous, optimisticId }
    },
    onSuccess: (serverId, _, context) => {
      // Replace optimistic ID with server ID
      if (context?.optimisticId && serverId !== context.optimisticId) {
        queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
          if (!old) return old
          return {
            ...old,
            columns: old.columns.map((col) =>
              col.id === context.optimisticId ? { ...col, id: serverId } : col
            ),
          }
        })
      }
    },
    onError: (_err, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(boardKeys.detail(boardId), context.previous)
      }
    },
  })
}

// Hook to update column name
export function useUpdateColumnName(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ columnId, name }: { columnId: string; name: string }) =>
      updateColumnName(columnId, name, boardId),
    onMutate: async ({ columnId, name }) => {
      await queryClient.cancelQueries({ queryKey: boardKeys.detail(boardId) })

      const previous = queryClient.getQueryData<BoardData>(boardKeys.detail(boardId))

      queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
        if (!old) return old
        return {
          ...old,
          columns: old.columns.map((col) =>
            col.id === columnId ? { ...col, name } : col
          ),
        }
      })

      return { previous }
    },
    onError: (_err, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(boardKeys.detail(boardId), context.previous)
      }
    },
  })
}

// Hook to toggle column collapsed state
export function useToggleColumnCollapsed(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (columnId: string) => toggleColumnCollapsed(columnId, boardId),
    onMutate: async (columnId) => {
      await queryClient.cancelQueries({ queryKey: boardKeys.detail(boardId) })

      const previous = queryClient.getQueryData<BoardData>(boardKeys.detail(boardId))

      queryClient.setQueryData<BoardData>(boardKeys.detail(boardId), (old) => {
        if (!old) return old
        return {
          ...old,
          columns: old.columns.map((col) =>
            col.id === columnId ? { ...col, isCollapsed: !col.isCollapsed } : col
          ),
        }
      })

      return { previous }
    },
    onError: (_err, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(boardKeys.detail(boardId), context.previous)
      }
    },
  })
}

// Hook to delete a column
export function useDeleteColumn(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (columnId: string) => deleteColumn(columnId, boardId),
    onMutate: async (columnId) => {
      await queryClient.cancelQueries({ queryKey: boardKeys.detail(boardId) })

      const previous = queryClient.getQueryData<BoardData>(boardKeys.detail(boardId))

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

      return { previous }
    },
    onError: (_err, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(boardKeys.detail(boardId), context.previous)
      }
    },
  })
}

// Hook to reorder columns
export function useReorderColumns(boardId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ columnId, newPosition }: { columnId: string; newPosition: number }) =>
      reorderColumns(boardId, columnId, newPosition),
    onMutate: async ({ columnId, newPosition }) => {
      await queryClient.cancelQueries({ queryKey: boardKeys.detail(boardId) })

      const previous = queryClient.getQueryData<BoardData>(boardKeys.detail(boardId))

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

      return { previous }
    },
    onError: (_err, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(boardKeys.detail(boardId), context.previous)
      }
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
