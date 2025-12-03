import { notFound } from "next/navigation"
import { getTask } from "@/actions/tasks"
import { getBoard } from "@/actions/boards"
import { TaskSidebar } from "@/components/task-sidebar/task-sidebar"

interface TaskSidebarPageProps {
  params: Promise<{
    boardId: string
    taskId: string
  }>
}

export default async function TaskSidebarPage({ params }: TaskSidebarPageProps) {
  const { boardId, taskId } = await params

  const [task, board] = await Promise.all([
    getTask(taskId),
    getBoard(boardId),
  ])

  if (!task || !board) {
    notFound()
  }

  // Verify task belongs to this board
  if (task.boardId !== boardId) {
    notFound()
  }

  return (
    <TaskSidebar
      task={{
        id: task.id,
        title: task.title,
        columnId: task.columnId,
        boardId: task.boardId,
        assignees: task.assignees,
      }}
      columns={board.columns.map((c) => ({ id: c.id, name: c.name }))}
      contributors={board.contributors}
    />
  )
}
