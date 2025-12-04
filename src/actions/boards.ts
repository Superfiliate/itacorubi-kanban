"use server"

import { db } from "@/db"
import { boards, columns } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getRandomEmoji } from "@/lib/emojis"

export async function createBoard() {
  const id = crypto.randomUUID()
  const emoji = getRandomEmoji()

  await db.insert(boards).values({
    id,
    title: `${emoji} New board`,
  })

  // Create default columns
  const defaultColumns = ["📥 To do", "🔄 Doing", "✅ Done"]
  for (let i = 0; i < defaultColumns.length; i++) {
    await db.insert(columns).values({
      id: crypto.randomUUID(),
      boardId: id,
      name: defaultColumns[i],
      position: i,
    })
  }

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
  return db.query.boards.findFirst({
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
}

export async function updateBoardTitle(id: string, title: string) {
  await db.update(boards).set({ title }).where(eq(boards.id, id))
  revalidatePath(`/boards/${id}`)
}
