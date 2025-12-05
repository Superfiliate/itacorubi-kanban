import Link from "next/link"
import { Github } from "lucide-react"
import { getBoards, createBoard } from "@/actions/boards"
import { Button } from "@/components/ui/button"
import { RecentBoards } from "@/components/recent-boards"

const isDevelopment = process.env.NODE_ENV === "development"

export default async function Home() {
  const boards = isDevelopment ? await getBoards() : []

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero - everything above the fold */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl">
            Itacorubi
          </h1>
          <p className="mt-4 text-xl text-muted-foreground sm:text-2xl">
            Kanban boards for cross-team collaboration
          </p>
          <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
            No sign-ups. No friction.<br/>Just share the link and start working together.
          </p>
          <form action={createBoard} className="mt-10">
            <Button type="submit" size="lg" className="h-14 px-8 text-lg">
              Create a Board
            </Button>
          </form>

          <Button variant="outline" className="mt-4" asChild>
            <a
              href="https://github.com/Superfiliate/itacorubi-kanban"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-4 w-4" />
              View on GitHub
            </a>
          </Button>

          <RecentBoards />

          {/* Debug board list - only visible in development */}
          {isDevelopment && boards.length > 0 && (
            <div className="mx-auto mt-12 max-w-md">
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-500">
                Existing Boards (Dev Only)
              </h2>
              <ul className="space-y-1 rounded-lg border border-amber-300 bg-amber-50 p-3 text-left dark:border-amber-700 dark:bg-amber-950/50">
                {boards.map((board) => (
                  <li key={board.id}>
                    <Link
                      href={`/boards/${board.id}`}
                      className="group flex items-center justify-between rounded-md px-3 py-2 transition-colors hover:bg-amber-100 dark:hover:bg-amber-900/50"
                    >
                      <span className="text-sm font-medium text-foreground group-hover:text-amber-900 dark:group-hover:text-amber-100">
                        {board.title}
                      </span>
                      <code className="text-xs text-amber-700 dark:text-amber-400">
                        {board.id.slice(0, 8)}...
                      </code>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
