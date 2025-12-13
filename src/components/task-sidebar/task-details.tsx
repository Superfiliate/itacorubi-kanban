"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { EditableText } from "@/components/editable-text"
import { StatusSelect } from "./status-select"
import { AssigneesSelect } from "./assignees-select"
import { DatePicker } from "@/components/ui/date-picker"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  useUpdateTaskTitle,
  useUpdateTaskCreatedAt,
  useDeleteTask,
} from "@/hooks/use-task"
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Mutations
  const updateTitleMutation = useUpdateTaskTitle(task.boardId)
  const updateCreatedAtMutation = useUpdateTaskCreatedAt(task.boardId)
  const deleteTaskMutation = useDeleteTask(task.boardId)

  const handleTitleSave = (title: string) => {
    updateTitleMutation.mutate({ taskId: task.id, title })
  }

  const handleCreatedAtChange = (date: Date | undefined) => {
    if (date) {
      updateCreatedAtMutation.mutate({ taskId: task.id, createdAt: date })
    }
  }

  const handleDelete = () => {
    deleteTaskMutation.mutate(task.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false)
        toast.success("Task deleted")
        onClose()
        router.replace(`/boards/${task.boardId}`)
      },
      onError: () => {
        toast.error("Failed to delete task")
      },
    })
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
          className="glass-subtle block w-full rounded-lg border px-3 py-2 text-sm shadow-sm hover:border-border transition-all"
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
          onClick={() => setIsDeleteDialogOpen(true)}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          title="Delete task"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteTaskMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteTaskMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
