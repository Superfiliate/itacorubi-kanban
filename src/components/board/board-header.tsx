"use client"

import { updateBoardTitle } from "@/actions/boards"
import { EditableText } from "@/components/editable-text"
import Link from "next/link"

interface BoardHeaderProps {
  boardId: string
  title: string
}

export function BoardHeader({ boardId, title }: BoardHeaderProps) {
  const handleSave = async (newTitle: string) => {
    await updateBoardTitle(boardId, newTitle)
  }

  return (
    <header className="flex items-center gap-4 border-b border-border bg-background px-6 py-4">
      <Link
        href="/"
        className="text-muted-foreground transition-colors hover:text-foreground"
        title="Back to boards"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
      </Link>
      <EditableText
        value={title}
        onSave={handleSave}
        as="h1"
        className="text-xl font-semibold"
        inputClassName="text-xl font-semibold"
      />
    </header>
  )
}
