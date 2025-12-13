"use client"

import { useState } from "react"
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useDroppable } from "@dnd-kit/core"
import { GripVertical, Minimize2, Maximize2, Plus, Trash2 } from "lucide-react"
import { EditableText } from "@/components/editable-text"
import { TaskCard } from "./task-card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  useUpdateColumnName,
  useToggleColumnCollapsed,
  useDeleteColumn,
} from "@/hooks/use-board"
import { useCreateTask } from "@/hooks/use-task"
import { getRandomEmoji } from "@/lib/emojis"

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
    comments: Array<{
      id: string
      createdAt: Date | null
    }>
  }>
}

export function Column({ id, boardId, name, isCollapsed, tasks }: ColumnProps) {
  const router = useRouter()
  const collapsed = isCollapsed ?? false
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Mutations
  const updateColumnNameMutation = useUpdateColumnName(boardId)
  const toggleCollapsedMutation = useToggleColumnCollapsed(boardId)
  const deleteColumnMutation = useDeleteColumn(boardId)
  const createTaskMutation = useCreateTask(boardId)

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
    updateColumnNameMutation.mutate({ columnId: id, name: newName })
  }

  const handleToggleCollapse = () => {
    toggleCollapsedMutation.mutate(id)
  }

  const handleDelete = async () => {
    deleteColumnMutation.mutate(id, {
      onSuccess: (result) => {
        if (result?.error) {
          toast.error(result.error)
        } else {
          toast.success("Column deleted")
          setIsDeleteDialogOpen(false)
        }
      },
      onError: () => {
        toast.error("Failed to delete column")
      },
    })
  }

  const handleAddTask = async () => {
    if (createTaskMutation.isPending) return
    const emoji = getRandomEmoji()
    const title = `${emoji} New task`
    try {
      const serverId = await createTaskMutation.mutateAsync({ columnId: id, title })
      toast.success("Task created")
      // Navigate to the task (will use the server ID)
      router.push(`/boards/${boardId}?task=${serverId}`)
    } catch {
      toast.error("Failed to create task")
    }
  }

  const taskIds = tasks.map((t) => t.id)

  return (
    <div
      ref={setSortableRef}
      style={style}
      className={cn(
        "relative flex h-full shrink-0 flex-col glass glass-strong transition-[width] duration-200 ease-in-out",
        collapsed ? "w-10" : "w-72",
        isDragging && "opacity-50"
      )}
    >
      {/* Collapsed View */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-end py-3 transition-opacity duration-200",
          collapsed ? "opacity-100" : "pointer-events-none opacity-0"
        )}
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
        <Button
          variant="ghost"
          size="icon"
          className="mt-2 h-6 w-6 shrink-0 self-center text-muted-foreground"
          title="Drag column"
          aria-label="Drag column"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </Button>
        <div
          className="mt-2 flex items-center gap-3 whitespace-nowrap text-sm"
          style={{
            transform: "rotate(-90deg) translateX(0) translateY(-1.2rem)",
            transformOrigin: "right center",
          }}
        >
          <span className="text-xs text-muted-foreground/60">{tasks.length}</span>
          <span className="font-medium text-muted-foreground">{name}</span>
        </div>
      </div>

      {/* Expanded View */}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col transition-opacity duration-200",
          collapsed ? "pointer-events-none opacity-0" : "opacity-100"
        )}
      >
        {/* Column Header */}
        <div
          className="flex items-center gap-2 border-b border-border px-3 py-2"
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 text-muted-foreground"
            title="Drag column"
            aria-label="Drag column"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </Button>
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
              onClick={() => setIsDeleteDialogOpen(true)}
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
            disabled={createTaskMutation.isPending}
            className="h-7 w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            Add task
          </Button>
        </div>

        {/* Tasks */}
        <ScrollArea className="min-h-0 flex-1">
          <div
            ref={setDroppableRef}
            className="flex min-h-[100px] flex-col gap-2 p-3"
          >
            <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  id={task.id}
                  boardId={boardId}
                  title={task.title}
                  assignees={task.assignees}
                  comments={task.comments}
                />
              ))}
            </SortableContext>
          </div>
        </ScrollArea>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Column</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this column? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteColumnMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteColumnMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
