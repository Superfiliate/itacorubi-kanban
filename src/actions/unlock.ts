"use server"

import { db } from "@/db"
import { boards } from "@/db/schema"
import { eq } from "drizzle-orm"
import { decrypt } from "@/lib/encryption"
import { setBoardPassword } from "@/lib/board-password"

const VERIFICATION_STRING = "itacorubi-verification"

export async function unlockBoard(boardId: string, password: string) {
  // Get board with encrypted verification
  const board = await db.query.boards.findFirst({
    where: eq(boards.id, boardId),
  })

  if (!board) {
    return { success: false, error: "Board not found" }
  }

  if (!board.encryptedVerification) {
    return { success: false, error: "Board encryption not initialized" }
  }

  // Try to decrypt verification string
  try {
    const decrypted = await decrypt(board.encryptedVerification, password)
    if (decrypted === VERIFICATION_STRING) {
      // Password is correct - set cookie
      await setBoardPassword(boardId, password)
      return { success: true }
    } else {
      return { success: false, error: "Invalid password" }
    }
  } catch (error) {
    // Decryption failed - wrong password
    return { success: false, error: "Invalid password" }
  }
}
