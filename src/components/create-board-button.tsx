"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CreateBoardDialog } from "@/components/create-board-dialog"

export function CreateBoardButton() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        size="lg"
        className="h-14 px-8 text-lg"
        onClick={() => setIsCreateDialogOpen(true)}
      >
        Create a Board
      </Button>
      <CreateBoardDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </>
  )
}
