"use client"

import { EditableText } from "@/components/editable-text"
import { StatusSelect } from "./status-select"
import { AssigneesSelect } from "./assignees-select"
import { DatePicker } from "@/components/ui/date-picker"
import { Button } from "@/components/ui/button"
import { updateTaskTitle, updateTaskCreatedAt, deleteTask } from "@/actions/tasks"
import { useRouter } from "next/navigation"
import type { ContributorColor } from "@/db/schema"

interface TaskDetailsProps {
  task: {
    id: string
    title: string
    columnId: string
    boardId: string
    createdAt: Date | null
    assignees: Array<{
      contributor: {
        id: string
        name: string
        color: ContributorColor
      }
    }>
  }
  columns: Array<{
    id: string
    name: string
  }>
  contributors: Array<{
    id: string
    name: string
    color: ContributorColor
  }>
  onClose: () => void
}

export function TaskDetails({
  task,
  columns,
  contributors,
  onClose,
}: TaskDetailsProps) {
  const router = useRouter()

  const handleTitleSave = async (title: string) => {
    await updateTaskTitle(task.id, title, task.boardId)
  }

  const handleCreatedAtChange = async (date: Date | undefined) => {
    if (date) {
      await updateTaskCreatedAt(task.id, date, task.boardId)
    }
  }

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this task?")) {
      onClose()
      await deleteTask(task.id, task.boardId)
      router.replace(`/boards/${task.boardId}`)
    }
  }

  return (
    <div className="flex flex-col gap-5 p-6">
      <h3 className="text-heading-sm">Task Details</h3>

      {/* Title */}
      <div className="space-y-2">
        <label className="text-label">Title</label>
        <EditableText
          value={task.title}
          onSave={handleTitleSave}
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          inputClassName="w-full"
          placeholder="Task title"
        />
      </div>

      {/* Status */}
      <StatusSelect
        taskId={task.id}
        boardId={task.boardId}
        currentColumnId={task.columnId}
        columns={columns}
      />

      {/* Assignees */}
      <AssigneesSelect
        taskId={task.id}
        boardId={task.boardId}
        assignees={task.assignees}
        contributors={contributors}
      />

      {/* Created At */}
      <div className="space-y-2">
        <label className="text-label">Created at</label>
        <DatePicker
          date={task.createdAt ?? undefined}
          onDateChange={handleCreatedAtChange}
          placeholder="Select date"
        />
      </div>

      {/* Delete button */}
      <div className="mt-auto flex justify-end pt-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          title="Delete task"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
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
            <line x1="10" x2="10" y1="11" y2="17" />
            <line x1="14" x2="14" y1="11" y2="17" />
          </svg>
        </Button>
      </div>
    </div>
  )
}
