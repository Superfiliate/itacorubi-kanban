"use client"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useCreateColumn } from "@/hooks/use-board"

interface AddColumnButtonProps {
  boardId: string
}

export function AddColumnButton({ boardId }: AddColumnButtonProps) {
  const createColumnMutation = useCreateColumn(boardId)

  const handleClick = () => {
    const id = crypto.randomUUID()
    createColumnMutation.mutate({ id }, {
      onSuccess: () => {
        toast.success("Column created")
      },
      onError: () => {
        toast.error("Failed to create column")
      },
    })
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={createColumnMutation.isPending}
      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
      title="Add column"
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
        <path d="M5 12h14" />
        <path d="M12 5v14" />
      </svg>
    </Button>
  )
}
