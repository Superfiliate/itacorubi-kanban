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
      <SheetContent className="flex w-[1040px] flex-col p-0 sm:max-w-[1040px]">
        <SheetHeader className="sr-only">
          <SheetTitle>Edit Task</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 min-h-0">
          {/* Left column - Comments (70%) */}
          <div className="flex-[7] min-h-0 overflow-hidden">
            <CommentsSection
              taskId={task.id}
              boardId={task.boardId}
              comments={task.comments}
              contributors={contributors}
            />
          </div>

          {/* Divider */}
          <div className="w-px bg-border" />

          {/* Right column - Task Details (30%) */}
          <div className="flex-[3] min-h-0 overflow-hidden">
            <TaskDetails
              task={task}
              columns={columns}
              contributors={contributors}
              onClose={handleClose}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
