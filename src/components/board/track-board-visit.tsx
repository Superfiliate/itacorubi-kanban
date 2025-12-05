"use client"

import { useEffect } from "react"
import { trackBoardVisit } from "@/lib/use-visited-boards"

interface TrackBoardVisitProps {
  boardId: string
  title: string
}

export function TrackBoardVisit({ boardId, title }: TrackBoardVisitProps) {
  useEffect(() => {
    trackBoardVisit(boardId, title)
  }, [boardId, title])

  return null
}
