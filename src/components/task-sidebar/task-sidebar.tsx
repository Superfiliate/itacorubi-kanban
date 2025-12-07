"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { CommentsSection } from "./comments-section"
import { TaskDetails } from "./task-details"
import type { ContributorColor } from "@/db/schema"

interface TaskSidebarProps {
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
    comments: Array<{
      id: string
      content: string
      createdAt: Date | null
      author: {
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
}

export function TaskSidebar({ task, columns, contributors }: TaskSidebarProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(true)

  const handleClose = () => {
    setIsOpen(false)
    // Small delay to allow animation to complete
    setTimeout(() => {
      router.replace(`/boards/${task.boardId}`)
    }, 150)
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="flex w-full flex-col p-0 lg:max-w-[1040px]">
        <SheetHeader className="sr-only">
          <SheetTitle>Edit Task</SheetTitle>
        </SheetHeader>

        {/* Mobile/Tablet: single scroll container | Desktop: each panel scrolls independently */}
        <div className="flex flex-1 min-h-0 flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
          {/* Task Details - First on mobile/tablet (stacked), right side on desktop */}
          <div className="order-1 lg:order-2 flex-none lg:flex-[3] min-h-0 lg:overflow-y-auto border-b lg:border-b-0 lg:border-l border-border">
            <TaskDetails
              task={task}
              columns={columns}
              contributors={contributors}
              onClose={handleClose}
            />
          </div>

          {/* Comments - Second on mobile/tablet (stacked), left side on desktop */}
          <div className="order-2 lg:order-1 flex-1 lg:flex-[7] min-h-0 lg:overflow-y-auto">
            <CommentsSection
              taskId={task.id}
              boardId={task.boardId}
              comments={task.comments}
              contributors={contributors}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
