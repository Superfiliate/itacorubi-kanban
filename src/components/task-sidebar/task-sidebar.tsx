"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { CommentsSection } from "./comments-section"
import { TaskDetails } from "./task-details"
import { useTaskQuery } from "@/hooks/use-task"
import { useBoardQuery } from "@/hooks/use-board"
import { SyncIndicator } from "@/components/sync-indicator"
import { Button } from "@/components/ui/button"
import type { ContributorColor } from "@/db/schema"
import { ChevronLeft, Loader2 } from "lucide-react"

interface TaskSidebarProps {
  taskId: string
  boardId: string
  columns: Array<{
    id: string
    name: string
  }>
  contributors: Array<{
    id: string
    name: string
    color: ContributorColor
  }>
}

export function TaskSidebar({ taskId, boardId, columns, contributors }: TaskSidebarProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(true)

  // Use TanStack Query for task data
  const { data: task, isLoading } = useTaskQuery(taskId)
  const { data: board } = useBoardQuery(boardId)

  // Use fresh contributors from board query if available
  const currentContributors = board?.contributors ?? contributors

  const handleClose = () => {
    setIsOpen(false)
    // Update URL immediately for better responsiveness
    router.replace(`/boards/${boardId}`)
  }

  useEffect(() => {
    // If the task fails to load (e.g., invalid id), close the sidebar gracefully
    if (!isLoading && !task) {
      handleClose()
    }
  }, [isLoading, task])

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 lg:max-w-[1040px]" hideCloseButton>
        <SheetHeader className="sr-only">
          <SheetTitle>Edit Task</SheetTitle>
        </SheetHeader>

        {isLoading || !task ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          /* Mobile/Tablet: single scroll container | Desktop: each panel scrolls independently */
          <div className="flex flex-1 min-h-0 flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
            {/* Task Details - First on mobile/tablet (stacked), right side on desktop */}
            <div className="relative order-1 lg:order-2 flex-none lg:flex-[3] min-h-0 lg:overflow-y-auto border-b lg:border-b-0 lg:border-l border-border">
              {/* Sticky header - transparent to inherit sidebar glass */}
              <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2.5 border-b border-border/20">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-8 gap-1 rounded-full px-3 text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="text-sm">Back</span>
                </Button>
                <SyncIndicator />
              </div>
              <TaskDetails
                task={{
                  id: task.id,
                  title: task.title,
                  columnId: task.columnId,
                  boardId: boardId,
                  createdAt: task.createdAt,
                  assignees: task.assignees,
                }}
                columns={columns}
                contributors={currentContributors}
                onClose={handleClose}
              />
            </div>

            {/* Comments - Second on mobile/tablet (stacked), left side on desktop */}
            <div className="order-2 lg:order-1 flex-1 lg:flex-[7] min-h-0 lg:overflow-y-auto">
              <CommentsSection
                taskId={task.id}
                boardId={boardId}
                comments={task.comments}
                contributors={currentContributors}
              />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

interface TaskSidebarHostProps {
  boardId: string
  columns: Array<{ id: string; name: string }>
  contributors: Array<{ id: string; name: string; color: ContributorColor }>
}

export function TaskSidebarHost({ boardId, columns, contributors }: TaskSidebarHostProps) {
  const searchParams = useSearchParams()
  const taskId = searchParams.get("task")

  if (!taskId) return null

  return (
    <TaskSidebar
      taskId={taskId}
      boardId={boardId}
      columns={columns}
      contributors={contributors}
    />
  )
}
