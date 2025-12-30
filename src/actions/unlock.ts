"use server";

import { db } from "@/db";
import { boards } from "@/db/schema";
import { eq } from "drizzle-orm";
import { setBoardPassword } from "@/lib/board-password";
import { verifyPassword } from "@/lib/password-hash";

export async function unlockBoard(boardId: string, password: string) {
  const board = await db.query.boards.findFirst({
    where: eq(boards.id, boardId),
  });

  // Use generic error message to prevent board existence enumeration
  const genericError = "Invalid board or password";

  if (!board) {
    return { success: false, error: genericError };
  }

  if (!board.passwordHash) {
    return { success: false, error: genericError };
  }

  const ok = verifyPassword(password, board.passwordHash);
  if (!ok) {
    return { success: false, error: genericError };
  }

  await setBoardPassword(boardId, password);
  return { success: true };
}
