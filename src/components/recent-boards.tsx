"use client"

import Link from "next/link"
import { useVisitedBoards } from "@/lib/use-visited-boards"

export function RecentBoards() {
  const boards = useVisitedBoards()

  if (boards.length === 0) {
    return null
  }

  return (
    <div className="mx-auto mt-12 max-w-md">
      <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Recent Boards
      </h2>
      <ul className="space-y-1 rounded-lg border border-border bg-card p-3 text-left">
        {boards.map((board) => (
          <li key={board.id}>
            <Link
              href={`/boards/${board.id}`}
              className="group flex items-center justify-between rounded-md px-3 py-2 transition-colors hover:bg-accent"
            >
              <span className="text-sm font-medium text-foreground group-hover:text-accent-foreground">
                {board.title}
              </span>
              <code className="text-xs text-muted-foreground">
                {board.id.slice(0, 8)}...
              </code>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
