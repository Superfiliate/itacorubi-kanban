import Link from "next/link"
import { Github } from "lucide-react"
import { getBoards, createBoard } from "@/actions/boards"
import { Button } from "@/components/ui/button"
import { RecentBoards } from "@/components/recent-boards"

const isDevelopment = process.env.NODE_ENV === "development"

export default async function Home() {
  const boards = isDevelopment ? await getBoards() : []

  return (
    <div className="flex min-h-screen flex-col gradient-mesh">
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mx-auto max-w-4xl glass glass-strong border border-border/50 px-8 py-10 shadow-2xl">
          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl">
            Itacorubi
          </h1>
          <p className="mt-4 text-xl text-muted-foreground sm:text-2xl">
            Kanban boards for cross-team collaboration
          </p>
          <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
            No sign-ups. No friction.
            <br />
            Just share the link and start working together.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <form action={createBoard}>
              <Button type="submit" size="lg" className="h-14 px-8 text-lg">
                Create a Board
              </Button>
            </form>

            <Button variant="outline" size="lg" className="h-14 px-6" asChild>
              <a
                href="https://github.com/Superfiliate/itacorubi-kanban"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4" />
                View on GitHub
              </a>
            </Button>
          </div>

          <RecentBoards />

          {/* Debug board list - only visible in development */}
          {isDevelopment && boards.length > 0 && (
            <div className="mx-auto mt-12 max-w-md">
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Existing Boards (Dev Only)
              </h2>
              <ul className="space-y-2 rounded-xl border border-border/50 bg-white/40 p-3 text-left shadow-sm backdrop-blur-sm dark:bg-white/5">
                {boards.map((board) => (
                  <li key={board.id}>
                    <Link
                      href={`/boards/${board.id}`}
                      className="group flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-white/60 dark:hover:bg-white/10"
                    >
                      <span className="text-sm font-medium text-foreground group-hover:text-foreground">
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
          )}
        </div>
      </main>
    </div>
  )
}
