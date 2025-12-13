"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { CommentsSection } from "./comments-section"
import { TaskDetails } from "./task-details"
import { useTaskQuery } from "@/hooks/use-task"
import { SyncIndicator } from "@/components/sync-indicator"
import { Button } from "@/components/ui/button"
import type { ContributorColor } from "@/db/schema"
import { ChevronLeft, Loader2 } from "lucide-react"
import { selectBoard, selectTaskDetails, useBoardStore } from "@/stores/board-store"

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

  const board = useBoardStore(selectBoard(boardId))
  const localTaskEntity = board?.tasksById[taskId]
  const pendingCreate = (board?.outbox ?? []).some(
    (i) => i.type === "createTask" && i.payload.taskId === taskId
  )

  // Task details from local store (includes comments if previously fetched/created)
  const hydratedTaskDetails = useBoardStore(selectTaskDetails(boardId, taskId))

  // Fetch server task details when:
  // - We don't have hydrated task details (which includes comments), AND
  // - There's no pending create for this task (local-first creates don't need server fetch)
  const needsServerFetch = !hydratedTaskDetails && !pendingCreate
  const { data: serverTask, isLoading: isServerLoading } = useTaskQuery(
    needsServerFetch ? taskId : null
  )

  const taskForUI = useMemo(() => {
    if (hydratedTaskDetails) return hydratedTaskDetails
    if (localTaskEntity && board) {
      const assigneeIds = board.assigneeIdsByTaskId[taskId] ?? []
      const assignees = assigneeIds
        .map((cid) => board.contributorsById[cid])
        .filter(Boolean)
        .map((c) => ({ contributor: { id: c.id, name: c.name, color: c.color } }))

      return {
        id: localTaskEntity.id,
        title: localTaskEntity.title,
        columnId: localTaskEntity.columnId,
        boardId,
        createdAt: localTaskEntity.createdAt,
        column: { id: localTaskEntity.columnId, name: columns.find((c) => c.id === localTaskEntity.columnId)?.name ?? "" },
        assignees,
        comments: [],
      }
    }
    if (serverTask) return serverTask
    return undefined
  }, [hydratedTaskDetails, localTaskEntity, board, taskId, boardId, columns, serverTask])

  const currentContributors = useMemo(() => {
    if (board) {
      return board.contributorOrder
        .map((id) => board.contributorsById[id])
        .filter(Boolean)
        .map((c) => ({ id: c.id, name: c.name, color: c.color }))
    }
    return contributors
  }, [board, contributors])

  const handleClose = () => {
    setIsOpen(false)
    // Update URL immediately for better responsiveness
    router.replace(`/boards/${boardId}`)
  }

  // Hydrate server task into local store when it arrives
  useEffect(() => {
    if (serverTask && !hydratedTaskDetails) {
      useBoardStore.getState().hydrateTaskFromServer(boardId, serverTask)
    }
  }, [serverTask, hydratedTaskDetails, boardId])

  useEffect(() => {
    // If the task is truly missing (deep-link to invalid id), close gracefully.
    // For local-first creates, we never close while the create is pending.
    if (!pendingCreate && !localTaskEntity && !isServerLoading && !taskForUI) {
      handleClose()
    }
  }, [pendingCreate, localTaskEntity, isServerLoading, taskForUI])

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 lg:max-w-[1040px]" hideCloseButton>
        <SheetHeader className="sr-only">
          <SheetTitle>Edit Task</SheetTitle>
        </SheetHeader>

        {(!taskForUI || (isServerLoading && !localTaskEntity && !hydratedTaskDetails)) ? (
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
                  id: taskForUI.id,
                  title: taskForUI.title,
                  columnId: taskForUI.columnId,
                  boardId: boardId,
                  createdAt: taskForUI.createdAt,
                  assignees: taskForUI.assignees,
                }}
                columns={columns}
                contributors={currentContributors}
                onClose={handleClose}
              />
            </div>

            {/* Comments - Second on mobile/tablet (stacked), left side on desktop */}
            <div className="order-2 lg:order-1 flex-1 lg:flex-[7] min-h-0 lg:overflow-y-auto">
              <CommentsSection
                taskId={taskForUI.id}
                boardId={boardId}
                comments={taskForUI.comments}
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
