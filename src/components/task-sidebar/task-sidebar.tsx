"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { EditableText } from "@/components/editable-text"
import { StatusSelect } from "./status-select"
import { AssigneesSelect } from "./assignees-select"
import { updateTaskTitle, deleteTask } from "@/actions/tasks"
import { Button } from "@/components/ui/button"

interface TaskSidebarProps {
  task: {
    id: string
    title: string
    columnId: string
    boardId: string
    assignees: Array<{
      contributor: {
        id: string
        name: string
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
  }>
}

export function TaskSidebar({ task, columns, contributors }: TaskSidebarProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(true)

  const handleClose = () => {
    setIsOpen(false)
    // Small delay to allow animation to complete
    setTimeout(() => {
      router.push(`/boards/${task.boardId}`)
    }, 150)
  }

  const handleTitleSave = async (title: string) => {
    await updateTaskTitle(task.id, title, task.boardId)
  }

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this task?")) {
      setIsOpen(false)
      await deleteTask(task.id, task.boardId)
      router.push(`/boards/${task.boardId}`)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="flex w-[400px] flex-col p-6 sm:max-w-[400px]">
        <SheetHeader>
          <SheetTitle className="sr-only">Edit Task</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 pt-4">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Title</label>
            <EditableText
              value={task.title}
              onSave={handleTitleSave}
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-base"
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

          {/* Delete button */}
          <div className="mt-auto flex justify-end">
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
      </SheetContent>
    </Sheet>
  )
}
