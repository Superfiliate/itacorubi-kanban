"use client"

import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { boardKeys, type BoardData } from "@/hooks/use-board"
import { taskKeys, type TaskWithComments } from "@/hooks/use-task"

interface HydrateBoardProps {
  boardId: string
  boardData: BoardData
  taskData?: TaskWithComments | null
}

/**
 * Hydrates the TanStack Query cache with server-fetched data.
 * This allows Server Components to fetch data while Client Components
 * can use the cached data for optimistic updates.
 */
export function HydrateBoard({ boardId, boardData, taskData }: HydrateBoardProps) {
  const queryClient = useQueryClient()
  const hasHydrated = useRef(false)

  useEffect(() => {
    // Only hydrate once on mount to avoid overwriting client changes
    if (hasHydrated.current) return
    hasHydrated.current = true

    // Hydrate board data
    queryClient.setQueryData(boardKeys.detail(boardId), boardData)

    // Hydrate task data if provided
    if (taskData) {
      queryClient.setQueryData(taskKeys.detail(taskData.id), taskData)
    }
  }, [queryClient, boardId, boardData, taskData])

  return null
}
