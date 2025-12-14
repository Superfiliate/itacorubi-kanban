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
      <div className="glass-subtle rounded-xl border border-border/50 p-3 shadow-sm">
        <ul className="space-y-2 text-left">
          {boards.map((board) => (
            <li key={board.id}>
              <Link
                href={`/boards/${board.id}`}
                className="group flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-white/60 dark:hover:bg-white/10"
              >
                <span className="text-heading-sm text-foreground group-hover:text-foreground">
                  {board.title}
                </span>
                <code className="text-xs text-muted-foreground/80">
                  {board.id.slice(0, 8)}...
                </code>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
