"use server"

import { db } from "@/db"
import { boards, columns } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { encrypt } from "@/lib/encryption"
import { setBoardPassword } from "@/lib/board-password"

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
  const { getBoardPassword } = await import("@/lib/board-password")
  const { decrypt } = await import("@/lib/encryption")

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
  const password = await getBoardPassword(id)
  if (!password) {
    // Password not set - board needs to be unlocked
    return null
  }

  // Decrypt board title
  try {
    board.title = await decrypt(board.title, password)
  } catch (error) {
    // Wrong password or corrupted data
    return null
  }

  // Decrypt column names
  for (const column of board.columns) {
    try {
      column.name = await decrypt(column.name, password)
    } catch (error) {
      column.name = "❌ Decryption Error"
    }
  }

  // Decrypt contributor names
  for (const contributor of board.contributors) {
    try {
      contributor.name = await decrypt(contributor.name, password)
    } catch (error) {
      contributor.name = "❌ Decryption Error"
    }
  }

  // Decrypt task titles and assignee contributor names
  for (const column of board.columns) {
    for (const task of column.tasks) {
      try {
        task.title = await decrypt(task.title, password)
      } catch (error) {
        task.title = "❌ Decryption Error"
      }

      // Decrypt assignee contributor names
      for (const assignee of task.assignees) {
        try {
          assignee.contributor.name = await decrypt(assignee.contributor.name, password)
        } catch (error) {
          assignee.contributor.name = "❌ Decryption Error"
        }
      }
    }
  }

  return board
}

export async function updateBoardTitle(id: string, title: string) {
  const { getBoardPassword } = await import("@/lib/board-password")
  const { encrypt } = await import("@/lib/encryption")

  const password = await getBoardPassword(id)
  if (!password) {
    throw new Error("Board password not set")
  }

  const encryptedTitle = await encrypt(title, password)
  await db.update(boards).set({ title: encryptedTitle }).where(eq(boards.id, id))
  revalidatePath(`/boards/${id}`)
}
