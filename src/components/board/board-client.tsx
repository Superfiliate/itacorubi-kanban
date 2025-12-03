"use client"

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core"
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useState } from "react"
import { Column } from "./column"
import { AddColumnButton } from "./add-column-button"
import { reorderColumns } from "@/actions/columns"
import { updateTaskColumn } from "@/actions/tasks"

interface BoardClientProps {
  boardId: string
  columns: Array<{
    id: string
    name: string
    position: number
    isCollapsed: boolean | null
    tasks: Array<{
      id: string
      title: string
      position: number
      assignees: Array<{
        contributor: {
          id: string
          name: string
        }
      }>
    }>
  }>
}

export function BoardClient({ boardId, columns }: BoardClientProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<"column" | "task" | null>(null)

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

  const handleDragOver = () => {
    // Handle task moving between columns during drag
    // This is handled in dragEnd for simplicity
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
        const overColumn = columns.find((c) => c.id === overId)
        if (overColumn) {
          await reorderColumns(boardId, activeId, overColumn.position)
        }
      }
    } else if (activeData?.type === "task") {
      // Moving task
      let targetColumnId: string | undefined
      let targetPosition: number | undefined

      if (overData?.type === "task") {
        // Dropped on another task
        const overTask = columns.flatMap((c) => c.tasks).find((t) => t.id === overId)
        const overColumn = columns.find((c) => c.tasks.some((t) => t.id === overId))
        if (overTask && overColumn) {
          targetColumnId = overColumn.id
          targetPosition = overTask.position
        }
      } else if (overData?.type === "column-drop") {
        // Dropped on column droppable area
        targetColumnId = overData.columnId as string
        // Put at the end
        const column = columns.find((c) => c.id === targetColumnId)
        targetPosition = column ? column.tasks.length : 0
      } else if (overData?.type === "column") {
        // Dropped on column header
        targetColumnId = overId
        const column = columns.find((c) => c.id === targetColumnId)
        targetPosition = column ? column.tasks.length : 0
      }

      if (targetColumnId) {
        await updateTaskColumn(activeId, targetColumnId, boardId, targetPosition)
      }
    }
  }

  const activeColumn = activeType === "column" ? columns.find((c) => c.id === activeId) : null
  const activeTask = activeType === "task"
    ? columns.flatMap((c) => c.tasks).find((t) => t.id === activeId)
    : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4 overflow-x-auto p-6">
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
