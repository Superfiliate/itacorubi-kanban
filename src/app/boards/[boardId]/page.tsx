import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { getBoard } from "@/actions/boards"
import { getTask } from "@/actions/tasks"
import { getContributorsWithStats } from "@/actions/contributors"
import { getTagsWithStats } from "@/actions/tags"
import { BoardHeader } from "@/components/board/board-header"
import { BoardClient } from "@/components/board/board-client"
import { TrackBoardVisit } from "@/components/board/track-board-visit"
import { TaskSidebarHost } from "@/components/task-sidebar/task-sidebar"
import { HydrateBoard } from "@/components/board/hydrate-board"
import type { BoardData } from "@/hooks/use-board"
import type { TaskWithComments } from "@/hooks/use-task"

interface BoardPageProps {
  params: Promise<{ boardId: string }>
  searchParams: Promise<{ task?: string }>
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ boardId: string }>
}): Promise<Metadata> {
  const { boardId } = await params

  // Check if board exists first (without password check)
  const { db } = await import("@/db")
  const { boards } = await import("@/db/schema")
  const { eq } = await import("drizzle-orm")
  const boardExists = await db.query.boards.findFirst({
    where: eq(boards.id, boardId),
  })

  if (!boardExists) {
    return { title: "Board Not Found" }
  }

  // Try to get board with password (for title)
  const board = await getBoard(boardId)
  if (!board) {
    // Board exists but password not set - return generic title
    return { title: "Board Locked | Itacorubi Kanban" }
  }

  return {
    title: `${board.title} | Itacorubi Kanban`,
  }
}

export default async function BoardPage({ params, searchParams }: BoardPageProps) {
  const { boardId } = await params
  const { task: taskId } = await searchParams

  // Check if board exists first (without password check)
  const { db } = await import("@/db")
  const { boards } = await import("@/db/schema")
  const { eq } = await import("drizzle-orm")
  const boardExists = await db.query.boards.findFirst({
    where: eq(boards.id, boardId),
  })

  if (!boardExists) {
    notFound()
  }

  // Now try to get board with password
  const board = await getBoard(boardId)

  // If board is null, password is not set - redirect to unlock
  if (!board) {
    redirect(`/boards/${boardId}/unlock`)
  }

  const contributorsWithStats = await getContributorsWithStats(boardId)
  const tagsWithStats = await getTagsWithStats(boardId)

  // Fetch task if taskId is provided
  let task = null
  if (taskId) {
    task = await getTask(taskId)
    // Verify task belongs to this board
    if (task && task.boardId !== boardId) {
      task = null
    }
  }

  // Cast to types expected by TanStack Query hooks
  const boardData = board as BoardData
  const taskData = task as TaskWithComments | null

  return (
    <div className="flex h-screen flex-col overflow-hidden gradient-mesh">
      <HydrateBoard boardId={board.id} boardData={boardData} taskData={taskData} />
      <TrackBoardVisit boardId={board.id} title={board.title} />
      <BoardHeader boardId={board.id} title={board.title} contributors={contributorsWithStats} tags={tagsWithStats} />
      <main className="relative flex-1 overflow-hidden">
        <BoardClient boardId={board.id} />
      </main>
      <TaskSidebarHost
        boardId={board.id}
        columns={board.columns.map((c) => ({ id: c.id, name: c.name }))}
        contributors={board.contributors}
        tags={board.tags ?? []}
      />
    </div>
  )
}
