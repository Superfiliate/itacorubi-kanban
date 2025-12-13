"use server"

import { db } from "@/db"
import { boards } from "@/db/schema"
import { eq } from "drizzle-orm"
import { setBoardPassword } from "@/lib/board-password"
import { verifyPassword } from "@/lib/password-hash"

export async function unlockBoard(boardId: string, password: string) {
  const board = await db.query.boards.findFirst({
    where: eq(boards.id, boardId),
  })

  if (!board) {
    return { success: false, error: "Board not found" }
  }

  if (!board.passwordHash) {
    return { success: false, error: "Board password not initialized" }
  }

  const ok = verifyPassword(password, board.passwordHash)
  if (!ok) {
    return { success: false, error: "Invalid password" }
  }

  await setBoardPassword(boardId, password)
  return { success: true }
}
