import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getBoard } from "@/actions/boards"
import { getTask } from "@/actions/tasks"
import { getContributorsWithStats } from "@/actions/contributors"
import { BoardHeader } from "@/components/board/board-header"
import { BoardClient } from "@/components/board/board-client"
import { TrackBoardVisit } from "@/components/board/track-board-visit"
import { TaskSidebar } from "@/components/task-sidebar/task-sidebar"
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
  const board = await getBoard(boardId)

  if (!board) {
    return { title: "Board Not Found" }
  }

  return {
    title: `${board.title} | Itacorubi Kanban`,
  }
}

export default async function BoardPage({ params, searchParams }: BoardPageProps) {
  const { boardId } = await params
  const { task: taskId } = await searchParams

  const [board, contributorsWithStats] = await Promise.all([
    getBoard(boardId),
    getContributorsWithStats(boardId),
  ])

  if (!board) {
    notFound()
  }

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
    <div className="flex h-screen flex-col overflow-hidden">
      <HydrateBoard boardId={board.id} boardData={boardData} taskData={taskData} />
      <TrackBoardVisit boardId={board.id} title={board.title} />
      <BoardHeader boardId={board.id} title={board.title} contributors={contributorsWithStats} />
      <main className="relative flex-1 overflow-hidden">
        <BoardClient boardId={board.id} initialColumns={board.columns} />
      </main>
      {task && (
        <TaskSidebar
          taskId={task.id}
          boardId={board.id}
          columns={board.columns.map((c) => ({ id: c.id, name: c.name }))}
          contributors={board.contributors}
        />
      )}
    </div>
  )
}
