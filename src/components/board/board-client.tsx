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
import { useState, useEffect } from "react"
import { Column } from "./column"
import { AddColumnButton } from "./add-column-button"
import { reorderColumns } from "@/actions/columns"
import { updateTaskColumn } from "@/actions/tasks"
import type { ContributorColor } from "@/db/schema"

interface Task {
  id: string
  title: string
  position: number
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

interface ColumnData {
  id: string
  name: string
  position: number
  isCollapsed: boolean | null
  tasks: Task[]
}

interface BoardClientProps {
  boardId: string
  columns: ColumnData[]
}

export function BoardClient({ boardId, columns: initialColumns }: BoardClientProps) {
  const [columns, setColumns] = useState<ColumnData[]>(initialColumns)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<"column" | "task" | null>(null)

  // Sync with server state when props change
  useEffect(() => {
    setColumns(initialColumns)
  }, [initialColumns])

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

    if (!overColumnId || overColumnId === activeColumn.id) return

    // Move task to the new column optimistically
    setColumns((prev) => {
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
        newColumns[targetColIndex].tasks.splice(overTaskIndex, 0, task)
      } else {
        // Add to end of column
        newColumns[targetColIndex].tasks.push(task)
      }

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

    if (activeData?.type === "column" && overData?.type === "column") {
      // Reordering columns
      if (activeId !== overId) {
        const oldIndex = columns.findIndex((c) => c.id === activeId)
        const newIndex = columns.findIndex((c) => c.id === overId)

        if (oldIndex !== -1 && newIndex !== -1) {
          // Optimistic update
          setColumns((prev) => arrayMove(prev, oldIndex, newIndex))

          // Server update
          const overColumn = columns.find((c) => c.id === overId)
          if (overColumn) {
            await reorderColumns(boardId, activeId, overColumn.position)
          }
        }
      }
    } else if (activeData?.type === "task") {
      // Find the task's current column (after dragOver updates)
      const currentColumn = columns.find((c) => c.tasks.some((t) => t.id === activeId))
      if (!currentColumn) return

      // Handle reordering within the same column
      if (overData?.type === "task" && overId !== activeId) {
        const taskIndex = currentColumn.tasks.findIndex((t) => t.id === activeId)
        const overTaskIndex = currentColumn.tasks.findIndex((t) => t.id === overId)

        if (taskIndex !== -1 && overTaskIndex !== -1 && taskIndex !== overTaskIndex) {
          // Optimistic update for within-column reorder
          setColumns((prev) =>
            prev.map((col) => {
              if (col.id !== currentColumn.id) return col
              const newTasks = arrayMove(col.tasks, taskIndex, overTaskIndex)
              return { ...col, tasks: newTasks }
            })
          )
        }
      }

      // Get the position to save
      const targetPosition = currentColumn.tasks.findIndex((t) => t.id === activeId)

      // Server update
      await updateTaskColumn(activeId, currentColumn.id, boardId, targetPosition)
    }
  }

  const activeColumn = activeType === "column" ? columns.find((c) => c.id === activeId) : null
  const activeTask = activeType === "task"
    ? columns.flatMap((c) => c.tasks).find((t) => t.id === activeId)
    : null

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
          <div className="w-72 rounded-lg border border-border bg-muted/50 p-3 shadow-lg">
            <span className="text-sm font-medium">{activeColumn.name}</span>
          </div>
        )}
        {activeTask && (
          <div className="w-64 rounded-lg border border-border bg-card p-3 shadow-lg">
            <span className="text-sm font-medium">{activeTask.title}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
