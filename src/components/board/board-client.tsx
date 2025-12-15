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
} from "@dnd-kit/sortable"
import { useState, useMemo } from "react"
import { Columns3 } from "lucide-react"
import { Column } from "./column"
import { AddColumnButton } from "./add-column-button"
import { useReorderColumns } from "@/hooks/use-board"
import { useUpdateTaskColumn } from "@/hooks/use-task"
import { useBoardPolling } from "@/hooks/use-board-polling"
import { useBoardStore, selectBoard, type ColumnVM, type TagEntity } from "@/stores/board-store"
import { Loader2 } from "lucide-react"

interface BoardClientProps {
  boardId: string
}

export function BoardClient({ boardId }: BoardClientProps) {
  useBoardPolling(boardId)

  // Use Zustand store for board data
  const board = useBoardStore(selectBoard(boardId))

  // Derive columns from the normalized board data
  // Using useMemo to avoid creating new objects on every render (prevents "getSnapshot should be cached" error)
  const columns = useMemo((): ColumnVM[] => {
    if (!board) return []

    return board.columnOrder.map((colId) => {
      const col = board.columnsById[colId]
      const taskIds = board.tasksByColumnId[colId] ?? []
      const tasks = taskIds
        .map((taskId) => {
          const task = board.tasksById[taskId]
          if (!task) return null
          const assigneeIds = board.assigneeIdsByTaskId[taskId] ?? []
          const assignees = assigneeIds
            .map((cid) => board.contributorsById[cid])
            .filter(Boolean)
            .map((c) => ({ id: c.id, name: c.name, color: c.color }))

          const tagIds = board.tagIdsByTaskId[taskId] ?? []
          const tags = tagIds
            .map((tid) => board.tagsById[tid])
            .filter((t): t is TagEntity => Boolean(t))
            .map((t) => ({ id: t.id, name: t.name, color: t.color }))

          const meta = board.commentMetaByTaskId[taskId] ?? { count: 0, lastCreatedAt: null }
          return {
            id: task.id,
            title: task.title,
            priority: task.priority,
            assignees,
            tags,
            commentCount: meta.count,
            lastCommentCreatedAt: meta.lastCreatedAt,
          }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)

      return { id: colId, name: col?.name ?? "", isCollapsed: col?.isCollapsed ?? false, tasks }
    })
  }, [board])

  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<"column" | "task" | null>(null)

  // Mutations
  const reorderColumnsMutation = useReorderColumns(boardId)
  const updateTaskColumnMutation = useUpdateTaskColumn(boardId)

  // DnD sensors - must be called unconditionally (rules of hooks)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Show loading state while waiting for HydrateBoard to populate the store
  if (!board) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

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

    // Find which column the task is currently in
    const activeColumn = columns.find((c) => c.tasks.some((t) => t.id === activeTaskId))
    if (!activeColumn) return

    let overColumnId: string | undefined

    if (overData?.type === "task") {
      // Hovering over another task - find its column
      const col = columns.find((c) => c.tasks.some((t) => t.id === overId))
      overColumnId = col?.id
    } else if (overData?.type === "column-drop") {
      overColumnId = overData.columnId as string
    } else if (overData?.type === "column") {
      overColumnId = overId
    }

    if (!overColumnId) return

    const targetColumn = columns.find((c) => c.id === overColumnId)
    if (!targetColumn) return

    // Calculate target index
    let toIndex: number
    if (overData?.type === "task") {
      toIndex = targetColumn.tasks.findIndex((t) => t.id === overId)
      if (toIndex === -1) toIndex = targetColumn.tasks.length
    } else {
      toIndex = targetColumn.tasks.length
    }

    // Check if actually moving
    const currentIndex = activeColumn.tasks.findIndex((t) => t.id === activeTaskId)
    if (activeColumn.id === overColumnId && currentIndex === toIndex) return

    // Update local store immediately
    useBoardStore.getState().moveTaskLocal({
      boardId,
      taskId: activeTaskId,
      toColumnId: overColumnId,
      toIndex,
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setActiveType(null)

    if (!over) return

    const draggedId = active.id as string
    const overId = over.id as string
    const activeData = active.data.current
    const overData = over.data.current

    if (activeData?.type === "column" && overData?.type === "column") {
      // Reordering columns
      if (draggedId !== overId) {
        const oldIndex = columns.findIndex((c) => c.id === draggedId)
        const newIndex = columns.findIndex((c) => c.id === overId)

        if (oldIndex !== -1 && newIndex !== -1) {
          // Update local store
          useBoardStore.getState().reorderColumnsLocal({
            boardId,
            columnId: draggedId,
            toIndex: newIndex,
          })

          // Server update
          const overColumn = columns.find((c) => c.id === overId)
          if (overColumn) {
            reorderColumnsMutation.mutate({ columnId: draggedId, newPosition: newIndex })
          }
        }
      }
    } else if (activeData?.type === "task") {
      // Find where the task ended up (after dragOver updates)
      const finalColumn = columns.find((c) => c.tasks.some((t) => t.id === draggedId))
      if (!finalColumn) return

      const targetPosition = finalColumn.tasks.findIndex((t) => t.id === draggedId)

      // Server update via mutation (dragOver already handled optimistic UI update)
      updateTaskColumnMutation.mutate({
        taskId: draggedId,
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
            <h3 className="text-heading">No columns yet</h3>
            <p className="mt-1 text-muted">
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
            <span className="text-heading-sm">{activeColumn.name}</span>
          </div>
        )}
        {activeTask && (
          <div className="w-64 rounded-lg border border-border/50 bg-card p-3 shadow-lg">
            <span className="text-heading-sm">{activeTask.title}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
