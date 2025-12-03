"use server"

import { db } from "@/db"
import { boards, columns } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createBoard() {
  const id = crypto.randomUUID()

  await db.insert(boards).values({
    id,
    title: "New board",
  })

  // Create default columns
  const defaultColumns = ["To do", "Doing", "Done"]
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
