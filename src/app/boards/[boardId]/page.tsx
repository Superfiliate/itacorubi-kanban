import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getBoard } from "@/actions/boards"
import { getTask } from "@/actions/tasks"
import { BoardHeader } from "@/components/board/board-header"
import { BoardClient } from "@/components/board/board-client"
import { TaskSidebar } from "@/components/task-sidebar/task-sidebar"

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

  const board = await getBoard(boardId)

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

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <BoardHeader boardId={board.id} title={board.title} />
      <main className="relative flex-1 overflow-hidden">
        <BoardClient boardId={board.id} columns={board.columns} />
      </main>
      {task && (
        <TaskSidebar
          task={{
            id: task.id,
            title: task.title,
            columnId: task.columnId,
            boardId: task.boardId,
            createdAt: task.createdAt,
            assignees: task.assignees,
            comments: task.comments,
          }}
          columns={board.columns.map((c) => ({ id: c.id, name: c.name }))}
          contributors={board.contributors}
        />
      )}
    </div>
  )
}
