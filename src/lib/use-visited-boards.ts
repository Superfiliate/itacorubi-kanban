"use client"

import { useEffect, useState } from "react"

const STORAGE_KEY = "itacorubi:visited-boards"
const MAX_BOARDS = 20

export interface VisitedBoard {
  id: string
  title: string
  visitedAt: string
}

function getVisitedBoardsFromStorage(): VisitedBoard[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveVisitedBoardsToStorage(boards: VisitedBoard[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(boards))
  } catch {
    // Ignore storage errors
  }
}

export function trackBoardVisit(id: string, title: string) {
  const boards = getVisitedBoardsFromStorage()

  // Remove existing entry for this board (if any)
  const filtered = boards.filter((b) => b.id !== id)

  // Add to front with updated timestamp
  const updated: VisitedBoard[] = [
    { id, title, visitedAt: new Date().toISOString() },
    ...filtered,
  ].slice(0, MAX_BOARDS)

  saveVisitedBoardsToStorage(updated)
}

export function useVisitedBoards() {
  const [boards, setBoards] = useState<VisitedBoard[]>([])

  useEffect(() => {
    setBoards(getVisitedBoardsFromStorage())
  }, [])

  return boards
}
