"use server"

import { db } from "@/db"
import { uploadedFiles } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { requireBoardAccess } from "@/lib/secure-board"

/**
 * Get the total storage used by a board (in bytes)
 */
export async function getBoardStorageUsage(boardId: string): Promise<number> {
  await requireBoardAccess(boardId)

  const result = await db
    .select({ total: sql<number>`COALESCE(SUM(${uploadedFiles.size}), 0)` })
    .from(uploadedFiles)
    .where(eq(uploadedFiles.boardId, boardId))

  return result[0]?.total ?? 0
}
