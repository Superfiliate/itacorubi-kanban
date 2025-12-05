"use client"

import { useState } from "react"
import { Users } from "lucide-react"
import { updateBoardTitle } from "@/actions/boards"
import { EditableText } from "@/components/editable-text"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { ContributorsDialog, type ContributorWithStats } from "@/components/board/contributors-dialog"

interface BoardHeaderProps {
  boardId: string
  title: string
  contributors: ContributorWithStats[]
}

export function BoardHeader({ boardId, title, contributors }: BoardHeaderProps) {
  const [isContributorsOpen, setIsContributorsOpen] = useState(false)

  const handleSave = async (newTitle: string) => {
    await updateBoardTitle(boardId, newTitle)
  }

  return (
    <header className="flex items-center gap-4 border-b border-border bg-background px-6 py-4">
      <EditableText
        value={title}
        onSave={handleSave}
        as="h1"
        className="text-xl font-semibold"
        inputClassName="text-xl font-semibold"
      />
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setIsContributorsOpen(true)}
          title="Manage contributors"
        >
          <Users className="h-4 w-4" />
        </Button>
        <ThemeToggle />
      </div>

      <ContributorsDialog
        boardId={boardId}
        contributors={contributors}
        open={isContributorsOpen}
        onOpenChange={setIsContributorsOpen}
      />
    </header>
  )
}
