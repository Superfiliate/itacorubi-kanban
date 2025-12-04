import Link from "next/link"
import { getBoards, createBoard } from "@/actions/boards"
import { Button } from "@/components/ui/button"

const isDevelopment = process.env.NODE_ENV === "development"

export default async function Home() {
  const boards = isDevelopment ? await getBoards() : []

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Kanban Boards
          </h1>
          <p className="mt-2 text-muted-foreground">
            Create and manage your boards
          </p>
        </header>

        <form action={createBoard}>
          <Button type="submit" size="lg" className="mb-8">
            Create New Board
          </Button>
        </form>

        {/* Debug board list - only visible in development */}
        {isDevelopment && boards.length > 0 && (
          <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Existing Boards (Dev Only)
            </h2>
            <ul className="space-y-2">
              {boards.map((board) => (
                <li key={board.id}>
                  <Link
                    href={`/boards/${board.id}`}
                    className="group flex items-center justify-between rounded-md px-3 py-2 transition-colors hover:bg-accent"
                  >
                    <span className="font-medium text-foreground group-hover:text-accent-foreground">
                      {board.title}
                    </span>
                    <code className="text-xs text-muted-foreground">
                      {board.id.slice(0, 8)}...
                    </code>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
