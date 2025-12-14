"use client"

import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  rectIntersection,
} from "@dnd-kit/core"
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Columns3 } from "lucide-react"
import { Column } from "./column"
import { AddColumnButton } from "./add-column-button"
import {
  useBoardQuery,
  useReorderColumns,
  useOptimisticColumnsUpdate,
  boardKeys,
  type BoardColumn,
  type BoardData,
} from "@/hooks/use-board"
import { useUpdateTaskColumn } from "@/hooks/use-task"
import { useBoardPolling } from "@/hooks/use-board-polling"

interface BoardClientProps {
  boardId: string
  initialColumns: BoardColumn[]
}

export function BoardClient({ boardId, initialColumns }: BoardClientProps) {
  useBoardPolling(boardId)
  const queryClient = useQueryClient()

  // Use TanStack Query for columns data
  const { data: board } = useBoardQuery(boardId)
  const columns = board?.columns ?? initialColumns

  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<"column" | "task" | null>(null)

  // Mutations
  const reorderColumnsMutation = useReorderColumns(boardId)
  const updateTaskColumnMutation = useUpdateTaskColumn(boardId)
  const { setColumns } = useOptimisticColumnsUpdate(boardId)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const columnIds = columns.map((c) => c.id)

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    setActiveType(active.data.current?.type as "column" | "task")
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeData = active.data.current
    const overData = over.data.current

    // Only handle task dragging over columns/tasks
    if (activeData?.type !== "task") return

    const activeTaskId = active.id as string
    const overId = over.id as string

    setColumns((prev) => {
      // Find which column the task is currently in (using prev for latest state)
      const activeColumn = prev.find((c) => c.tasks.some((t) => t.id === activeTaskId))
      if (!activeColumn) return prev

      let overColumnId: string | undefined

      if (overData?.type === "task") {
        // Hovering over another task - find its column
        const col = prev.find((c) => c.tasks.some((t) => t.id === overId))
        overColumnId = col?.id
      } else if (overData?.type === "column-drop") {
        overColumnId = overData.columnId as string
      } else if (overData?.type === "column") {
        overColumnId = overId
      }

      if (!overColumnId) return prev

      // Handle same-column reordering
      if (overColumnId === activeColumn.id && overData?.type === "task" && overId !== activeTaskId) {
        const colIndex = prev.findIndex((c) => c.id === activeColumn.id)
        if (colIndex === -1) return prev

        const taskIndex = prev[colIndex].tasks.findIndex((t) => t.id === activeTaskId)
        const overTaskIndex = prev[colIndex].tasks.findIndex((t) => t.id === overId)

        if (taskIndex === -1 || overTaskIndex === -1 || taskIndex === overTaskIndex) return prev

        // Reorder within the same column using arrayMove, then update position fields
        const newColumns = prev.map((col, idx) => {
          if (idx === colIndex) {
            const reorderedTasks = arrayMove([...col.tasks], taskIndex, overTaskIndex)
            // Update position fields to match new array indices
            return {
              ...col,
              tasks: reorderedTasks.map((task, i) => ({ ...task, position: i })),
            }
          }
          return col
        })

        return newColumns
      }

      // Handle cross-column moves
      if (overColumnId === activeColumn.id) return prev

      // Move task to the new column optimistically
      const newColumns = prev.map((col) => ({
        ...col,
        tasks: [...col.tasks],
      }))

      const sourceColIndex = newColumns.findIndex((c) => c.id === activeColumn.id)
      const targetColIndex = newColumns.findIndex((c) => c.id === overColumnId)

      if (sourceColIndex === -1 || targetColIndex === -1) return prev

      // Find and remove task from source
      const taskIndex = newColumns[sourceColIndex].tasks.findIndex((t) => t.id === activeTaskId)
      if (taskIndex === -1) return prev

      const [task] = newColumns[sourceColIndex].tasks.splice(taskIndex, 1)

      // Add to target column
      if (overData?.type === "task") {
        // Insert at the position of the hovered task
        const overTaskIndex = newColumns[targetColIndex].tasks.findIndex((t) => t.id === overId)
        newColumns[targetColIndex].tasks.splice(overTaskIndex, 0, { ...task, columnId: overColumnId! })
      } else {
        // Add to end of column
        newColumns[targetColIndex].tasks.push({ ...task, columnId: overColumnId! })
      }

      // Update position fields for both source and target columns
      newColumns[sourceColIndex].tasks = newColumns[sourceColIndex].tasks.map((t, i) => ({ ...t, position: i }))
      newColumns[targetColIndex].tasks = newColumns[targetColIndex].tasks.map((t, i) => ({ ...t, position: i }))

      return newColumns
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setActiveType(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    const activeData = active.data.current
    const overData = over.data.current

    // Get latest columns from query cache (after dragOver optimistic updates)
    const boardData = queryClient.getQueryData<BoardData>(boardKeys.detail(boardId))
    const latestColumns = boardData?.columns ?? columns

    if (activeData?.type === "column" && overData?.type === "column") {
      // Reordering columns
      if (activeId !== overId) {
        const oldIndex = latestColumns.findIndex((c) => c.id === activeId)
        const newIndex = latestColumns.findIndex((c) => c.id === overId)

        if (oldIndex !== -1 && newIndex !== -1) {
          // Optimistic update via TanStack Query
          setColumns((prev) => arrayMove(prev, oldIndex, newIndex))

          // Server update
          const overColumn = latestColumns.find((c) => c.id === overId)
          if (overColumn) {
            reorderColumnsMutation.mutate({ columnId: activeId, newPosition: overColumn.position })
          }
        }
      }
    } else if (activeData?.type === "task") {
      // Get the latest position after dragOver optimistic updates
      const finalBoardData = queryClient.getQueryData<BoardData>(boardKeys.detail(boardId))
      const finalColumns = finalBoardData?.columns ?? latestColumns
      const finalColumn = finalColumns.find((c) => c.tasks.some((t) => t.id === activeId))
      if (!finalColumn) return

      const targetPosition = finalColumn.tasks.findIndex((t) => t.id === activeId)

      // Server update via mutation (dragOver already handled optimistic UI update)
      updateTaskColumnMutation.mutate({
        taskId: activeId,
        newColumnId: finalColumn.id,
        newPosition: targetPosition,
      })
    }
  }

  const activeColumn = activeType === "column" ? columns.find((c) => c.id === activeId) : null
  const activeTask = activeType === "task"
    ? columns.flatMap((c) => c.tasks).find((t) => t.id === activeId)
    : null

  if (columns.length === 0) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Columns3 className="h-16 w-16 text-muted-foreground/50" />
          <div>
            <h3 className="text-lg font-medium text-foreground">No columns yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first column to start organizing tasks
            </p>
          </div>
        </div>
        <AddColumnButton boardId={boardId} />
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="absolute inset-0 flex gap-4 overflow-x-auto overflow-y-hidden p-6">
        <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
          {columns.map((column) => (
            <Column
              key={column.id}
              id={column.id}
              boardId={boardId}
              name={column.name}
              isCollapsed={column.isCollapsed}
              tasks={column.tasks}
            />
          ))}
        </SortableContext>
        <AddColumnButton boardId={boardId} />
      </div>

      <DragOverlay>
        {activeColumn && (
          <div className="w-72 rounded-lg border border-border/50 bg-muted/50 p-3 shadow-lg">
            <span className="text-sm font-medium">{activeColumn.name}</span>
          </div>
        )}
        {activeTask && (
          <div className="w-64 rounded-lg border border-border/50 bg-card p-3 shadow-lg">
            <span className="text-sm font-medium">{activeTask.title}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
