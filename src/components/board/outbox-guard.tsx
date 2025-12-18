"use client"

import { useOutboxGuard } from "@/hooks/use-outbox-guard"

interface OutboxGuardProps {
  boardId: string
}

/**
 * Client component that guards against data loss from navigation.
 *
 * When placed in the board page, it:
 * - Warns users if they try to close/refresh the tab while changes are syncing
 * - Registers beforeunload handler automatically
 *
 * This component renders nothing - it's purely a side-effect component.
 */
export function OutboxGuard({ boardId }: OutboxGuardProps) {
  // The hook handles all the beforeunload logic
  useOutboxGuard(boardId)
  return null
}
