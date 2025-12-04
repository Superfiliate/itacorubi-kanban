"use client"

import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useDroppable } from "@dnd-kit/core"
import { Minimize2, Maximize2, Plus, Trash2 } from "lucide-react"
import { updateColumnName, toggleColumnCollapsed, deleteColumn } from "@/actions/columns"
import { createTask } from "@/actions/tasks"
import { EditableText } from "@/components/editable-text"
import { TaskCard } from "./task-card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

import type { ContributorColor } from "@/db/schema"

interface ColumnProps {
  id: string
  boardId: string
  name: string
  isCollapsed: boolean | null
  tasks: Array<{
    id: string
    title: string
    assignees: Array<{
      contributor: {
        id: string
        name: string
        color: ContributorColor
      }
    }>
  }>
}

export function Column({ id, boardId, name, isCollapsed, tasks }: ColumnProps) {
  const router = useRouter()
  const collapsed = isCollapsed ?? false

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { type: "column" } })

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `column-${id}`,
    data: { type: "column-drop", columnId: id },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleNameSave = async (newName: string) => {
    await updateColumnName(id, newName, boardId)
  }

  const handleToggleCollapse = async () => {
    await toggleColumnCollapsed(id, boardId)
  }

  const handleDelete = async () => {
    const result = await deleteColumn(id, boardId)
    if (result?.error) {
      alert(result.error)
    }
  }

  const handleAddTask = async () => {
    const taskId = await createTask(boardId, id)
    router.push(`/boards/${boardId}/tasks/${taskId}`)
  }

  const taskIds = tasks.map((t) => t.id)

  if (collapsed) {
    return (
      <div
        ref={setSortableRef}
        style={style}
        className={cn(
          "relative flex h-full w-10 shrink-0 flex-col items-end rounded-lg border border-border bg-muted/50 py-3 transition-all",
          isDragging && "opacity-50"
        )}
        {...attributes}
        {...listeners}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleCollapse}
          className="h-6 w-6 shrink-0 self-center"
          title="Expand column"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <div
          className="mt-2 flex items-center gap-3 whitespace-nowrap text-sm"
          style={{
            transform: "rotate(-90deg) translateX(0) translateY(-1.2rem)",
            transformOrigin: "right center",
            // textAlign: "right",

          }}
        >
          <span className="text-xs text-muted-foreground/60">{tasks.length}</span>
          <span className="font-medium text-muted-foreground">{name}</span>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setSortableRef}
      style={style}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-lg border border-border bg-muted/50",
        isDragging && "opacity-50"
      )}
    >
      {/* Column Header */}
      <div
        className="flex items-center gap-2 border-b border-border px-3 py-2"
        {...attributes}
        {...listeners}
      >
        <EditableText
          value={name}
          onSave={handleNameSave}
          className="flex-1 text-sm font-medium"
          inputClassName="text-sm font-medium"
        />
        {tasks.length === 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
            title="Delete column"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleCollapse}
          className="h-6 w-6 shrink-0 text-muted-foreground"
          title="Collapse column"
        >
          <Minimize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Add Task Button */}
      <div className="border-b border-border px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddTask}
          className="h-7 w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          Add task
        </Button>
      </div>

      {/* Tasks */}
      <div
        ref={setDroppableRef}
        className="flex min-h-[100px] flex-1 flex-col gap-2 overflow-y-auto p-3"
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              id={task.id}
              boardId={boardId}
              title={task.title}
              assignees={task.assignees}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}
