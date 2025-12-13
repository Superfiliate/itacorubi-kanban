"use server"

import { db } from "@/db"
import { boards, columns } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { setBoardPassword } from "@/lib/board-password"
import { getBoardPasswordOptional, requireBoardAccess } from "@/lib/secure-board"
import { hashPassword } from "@/lib/password-hash"

export async function createBoard(title: string, password: string) {
  const id = crypto.randomUUID()
  const passwordHash = hashPassword(password)

  await db.insert(boards).values({
    id,
    title,
    passwordHash,
    createdAt: new Date(),
  })

  const defaultColumns = ["📥 To do", "🔄 Doing", "✅ Done"]
  for (let i = 0; i < defaultColumns.length; i++) {
    await db.insert(columns).values({
      id: crypto.randomUUID(),
      boardId: id,
      name: defaultColumns[i],
      position: i,
    })
  }

  // Create Archive column (collapsed by default)
  const archiveColumnName = "📦 Archive"
  await db.insert(columns).values({
    id: crypto.randomUUID(),
    boardId: id,
    name: archiveColumnName,
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
    columns: {
      id: true,
      title: true,
      createdAt: true,
    },
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

  return board
}

export async function updateBoardTitle(id: string, title: string) {
  await requireBoardAccess(id)
  await db.update(boards).set({ title }).where(eq(boards.id, id))
  revalidatePath(`/boards/${id}`)
}
