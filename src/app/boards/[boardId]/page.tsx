import { notFound } from "next/navigation"
import { getBoard } from "@/actions/boards"
import { BoardHeader } from "@/components/board/board-header"
import { BoardClient } from "@/components/board/board-client"

interface BoardPageProps {
  params: Promise<{ boardId: string }>
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { boardId } = await params
  const board = await getBoard(boardId)

  if (!board) {
    notFound()
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <BoardHeader boardId={board.id} title={board.title} />
      <main className="flex-1 overflow-hidden">
        <BoardClient boardId={board.id} columns={board.columns} />
      </main>
    </div>
  )
}
