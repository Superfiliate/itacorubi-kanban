"use server";

import { requireBoardAccess } from "@/lib/secure-board";
import { getBoardStorageUsage as getStorageUsage } from "@/lib/storage/quota";

/**
 * Get the total storage used by a board (in bytes)
 */
export async function getBoardStorageUsage(boardId: string): Promise<number> {
  await requireBoardAccess(boardId);
  return getStorageUsage(boardId);
}
