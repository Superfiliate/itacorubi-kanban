"use server"

import { db } from "@/db"
import { columns, tasks } from "@/db/schema"
import { eq, and, gt, gte, lt, lte, sql, count } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getRandomEmoji } from "@/lib/emojis"
import { requireBoardAccess } from "@/lib/secure-board"

export async function createColumn(boardId: string, id?: string) {
  await requireBoardAccess(boardId)

  // Get the max position for this board
  const maxPositionResult = await db
    .select({ maxPosition: sql<number>`COALESCE(MAX(${columns.position}), -1)` })
    .from(columns)
    .where(eq(columns.boardId, boardId))

  const maxPosition = maxPositionResult[0]?.maxPosition ?? -1

  const columnId = id ?? crypto.randomUUID()
  const emoji = getRandomEmoji()
  const plainName = `${emoji} New column`

  await db.insert(columns).values({
    id: columnId,
    boardId,
    name: plainName,
    position: maxPosition + 1,
  })

  revalidatePath(`/boards/${boardId}`)
  return columnId
}

export async function updateColumnName(id: string, name: string, boardId: string) {
  await requireBoardAccess(boardId)
  const column = await db.query.columns.findFirst({ where: eq(columns.id, id) })
  if (!column || column.boardId !== boardId) {
    throw new Error("Column not found")
  }

  await db.update(columns).set({ name }).where(eq(columns.id, id))
  revalidatePath(`/boards/${boardId}`)
}

export async function toggleColumnCollapsed(id: string, boardId: string) {
  await requireBoardAccess(boardId)
  const column = await db.query.columns.findFirst({
    where: eq(columns.id, id),
  })

  if (column) {
    if (column.boardId !== boardId) {
      throw new Error("Column not found")
    }
    await db.update(columns).set({ isCollapsed: !column.isCollapsed }).where(eq(columns.id, id))
    revalidatePath(`/boards/${boardId}`)
  }
}

export async function deleteColumn(id: string, boardId: string) {
  await requireBoardAccess(boardId)
  // Check if there are any tasks in this column
  const taskCount = await db
    .select({ count: count() })
    .from(tasks)
    .where(eq(tasks.columnId, id))

  if (taskCount[0].count > 0) {
    return { error: "Cannot delete column with tasks" }
  }

  const column = await db.query.columns.findFirst({
    where: eq(columns.id, id),
  })

  if (!column) {
    return { error: "Column not found" }
  }
  if (column.boardId !== boardId) {
    return { error: "Column not found" }
  }

  await db.delete(columns).where(eq(columns.id, id))

  // Update positions of columns after the deleted one
  await db.update(columns)
    .set({ position: sql`${columns.position} - 1` })
    .where(and(
      eq(columns.boardId, boardId),
      gt(columns.position, column.position)
    ))

  revalidatePath(`/boards/${boardId}`)
  return { success: true }
}

export async function reorderColumns(boardId: string, columnId: string, newPosition: number) {
  await requireBoardAccess(boardId)
  const column = await db.query.columns.findFirst({
    where: eq(columns.id, columnId),
  })

  if (!column) return
  if (column.boardId !== boardId) {
    throw new Error("Column not found")
  }

  const oldPosition = column.position

  if (oldPosition === newPosition) return

  if (oldPosition < newPosition) {
    // Moving right: decrease positions of columns between old and new
    await db.update(columns)
      .set({ position: sql`${columns.position} - 1` })
      .where(and(
        eq(columns.boardId, boardId),
        gt(columns.position, oldPosition),
        lte(columns.position, newPosition)
      ))
  } else {
    // Moving left: increase positions of columns between new and old
    await db.update(columns)
      .set({ position: sql`${columns.position} + 1` })
      .where(and(
        eq(columns.boardId, boardId),
        gte(columns.position, newPosition),
        lt(columns.position, oldPosition)
      ))
  }

  await db.update(columns)
    .set({ position: newPosition })
    .where(eq(columns.id, columnId))

  revalidatePath(`/boards/${boardId}`)
}
