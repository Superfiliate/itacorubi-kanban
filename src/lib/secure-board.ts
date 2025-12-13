import { db } from "@/db"
import { boards } from "@/db/schema"
import { clearBoardPassword, getBoardPassword } from "@/lib/board-password"
import { verifyPassword } from "@/lib/password-hash"
import { eq } from "drizzle-orm"

export async function getBoardPasswordOptional(boardId: string): Promise<string | null> {
  const password = await getBoardPassword(boardId)
  if (!password) return null

  const board = await db.query.boards.findFirst({
    where: eq(boards.id, boardId),
    columns: { passwordHash: true },
  })

  if (!board?.passwordHash) {
    return null
  }

  const ok = verifyPassword(password, board.passwordHash)
  if (!ok) {
    await clearBoardPassword(boardId)
    return null
  }

  return password
}

export async function requireBoardPassword(boardId: string): Promise<string> {
  const password = await getBoardPasswordOptional(boardId)
  if (!password) {
    throw new Error("Board password missing or invalid")
  }
  return password
}

export async function requireBoardAccess(boardId: string): Promise<void> {
  await requireBoardPassword(boardId)
}
