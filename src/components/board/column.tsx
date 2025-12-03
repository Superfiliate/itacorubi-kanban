"use client"

import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useDroppable } from "@dnd-kit/core"
import { updateColumnName, toggleColumnCollapsed, deleteColumn } from "@/actions/columns"
import { createTask } from "@/actions/tasks"
import { EditableText } from "@/components/editable-text"
import { TaskCard } from "./task-card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

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
          "flex h-full w-12 shrink-0 flex-col items-center rounded-lg border border-border bg-muted/50 py-4 transition-all",
          isDragging && "opacity-50"
        )}
        {...attributes}
        {...listeners}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleCollapse}
          className="mb-2 h-6 w-6 shrink-0"
          title="Expand column"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Button>
        <span
          className="whitespace-nowrap text-sm font-medium text-muted-foreground"
          style={{
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            transform: "rotate(180deg)",
          }}
        >
          {name}
        </span>
        {tasks.length > 0 && (
          <span className="mt-2 text-xs text-muted-foreground">
            {tasks.length}
          </span>
        )}
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
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleCollapse}
          className="h-6 w-6 shrink-0"
          title="Collapse column"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Button>
        <EditableText
          value={name}
          onSave={handleNameSave}
          className="flex-1 text-sm font-medium"
          inputClassName="text-sm font-medium"
        />
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
        {tasks.length === 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
            title="Delete column"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </Button>
        )}
      </div>

      {/* Add Task Button */}
      <div className="border-b border-border px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddTask}
          className="h-7 w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
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
