/**
 * Storage quota utilities (SERVER-ONLY)
 *
 * Shared functions for checking and querying board storage usage.
 */

import { db } from "@/db";
import { uploadedFiles } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { MAX_BOARD_STORAGE } from "./constants";

export interface StorageQuotaResult {
  allowed: boolean;
  currentUsage: number;
  remainingSpace: number;
  limit: number;
}

/**
 * Get the total storage used by a board (in bytes).
 * Does NOT include auth check - caller must verify access.
 */
export async function getBoardStorageUsage(boardId: string): Promise<number> {
  const result = await db
    .select({ total: sql<number>`COALESCE(SUM(${uploadedFiles.size}), 0)` })
    .from(uploadedFiles)
    .where(eq(uploadedFiles.boardId, boardId));

  return result[0]?.total ?? 0;
}

/**
 * Check if a board has enough storage quota for additional bytes.
 * Does NOT include auth check - caller must verify access.
 */
export async function checkBoardStorageQuota(
  boardId: string,
  additionalBytes: number,
): Promise<StorageQuotaResult> {
  const currentUsage = await getBoardStorageUsage(boardId);
  const remainingSpace = MAX_BOARD_STORAGE - currentUsage;
  const allowed = currentUsage + additionalBytes <= MAX_BOARD_STORAGE;

  return {
    allowed,
    currentUsage,
    remainingSpace,
    limit: MAX_BOARD_STORAGE,
  };
}
