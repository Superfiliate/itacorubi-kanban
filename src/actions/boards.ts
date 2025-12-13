"use server"

import { db } from "@/db"
import { boards, columns } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { encrypt } from "@/lib/encryption"
import { setBoardPassword } from "@/lib/board-password"
import { decryptRequired, decryptWithFallback, encryptForBoard, getBoardPasswordOptional } from "@/lib/secure-board"

export async function createBoard(title: string, password: string) {
  const id = crypto.randomUUID()

  // Encrypt board title
  const encryptedTitle = await encrypt(title, password)

  // Create encrypted verification string (used to verify password)
  const verificationString = "itacorubi-verification"
  const encryptedVerification = await encrypt(verificationString, password)

  await db.insert(boards).values({
    id,
    title: encryptedTitle,
    encryptedVerification,
    createdAt: new Date(),
  })

  // Create default columns with encrypted names
  const defaultColumns = ["📥 To do", "🔄 Doing", "✅ Done"]
  for (let i = 0; i < defaultColumns.length; i++) {
    const encryptedName = await encrypt(defaultColumns[i], password)
    await db.insert(columns).values({
      id: crypto.randomUUID(),
      boardId: id,
      name: encryptedName,
      position: i,
    })
  }

  // Create Archive column (collapsed by default)
  const archiveColumnName = "📦 Archive"
  const encryptedArchiveName = await encrypt(archiveColumnName, password)
  await db.insert(columns).values({
    id: crypto.randomUUID(),
    boardId: id,
    name: encryptedArchiveName,
    position: defaultColumns.length,
    isCollapsed: true,
  })

  // Set password in HTTP-only cookie
  await setBoardPassword(id, password)

  redirect(`/boards/${id}`)
}

export async function getBoards() {
  // Protect against leaking board UUIDs in production
  if (process.env.NODE_ENV !== "development") {
    return []
  }

  return db.query.boards.findMany({
    orderBy: (boards, { desc }) => [desc(boards.createdAt)],
  })
}

export async function getBoard(id: string) {
  const board = await db.query.boards.findFirst({
    where: eq(boards.id, id),
    with: {
      columns: {
        orderBy: (columns, { asc }) => [asc(columns.position)],
        with: {
          tasks: {
            orderBy: (tasks, { asc }) => [asc(tasks.position)],
            with: {
              assignees: {
                with: {
                  contributor: true,
                },
              },
              comments: {
                orderBy: (comments, { desc }) => [desc(comments.createdAt)],
                columns: {
                  id: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      },
      contributors: true,
    },
  })

  if (!board) {
    return null
  }

  // Password is required
  const password = await getBoardPasswordOptional(id)
  if (!password) {
    // Password not set - board needs to be unlocked
    return null
  }

  // Decrypt board title
  const decryptedTitle = await decryptRequired(board.title, password)
  if (!decryptedTitle) {
    // Wrong password or corrupted data
    return null
  }
  board.title = decryptedTitle

  // Decrypt column names
  for (const column of board.columns) {
    column.name = await decryptWithFallback(column.name, password)
  }

  // Decrypt contributor names
  for (const contributor of board.contributors) {
    contributor.name = await decryptWithFallback(contributor.name, password)
  }

  // Decrypt task titles and assignee contributor names
  for (const column of board.columns) {
    for (const task of column.tasks) {
      task.title = await decryptWithFallback(task.title, password)

      // Decrypt assignee contributor names
      for (const assignee of task.assignees) {
        assignee.contributor.name = await decryptWithFallback(assignee.contributor.name, password)
      }
    }
  }

  return board
}

export async function updateBoardTitle(id: string, title: string) {
  const encryptedTitle = await encryptForBoard(id, title)
  await db.update(boards).set({ title: encryptedTitle }).where(eq(boards.id, id))
  revalidatePath(`/boards/${id}`)
}
