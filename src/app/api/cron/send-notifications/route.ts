import { NextResponse } from "next/server";
import { db } from "@/db";
import { pendingNotifications } from "@/db/schema";
import { env } from "@/lib/validate-env";
import { processBoardNotifications } from "@/lib/process-board-notifications";

// Verify cron secret to prevent unauthorized calls
function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = env.CRON_SECRET;

  // In development or test, allow without secret
  if (env.NODE_ENV === "development" || env.NODE_ENV === "test") {
    return true;
  }

  // In production, require the secret
  if (!cronSecret) {
    console.warn("CRON_SECRET not configured - cron endpoint is disabled");
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get distinct board IDs with pending notifications
    const boardsWithNotifications = await db
      .selectDistinct({ boardId: pendingNotifications.boardId })
      .from(pendingNotifications);

    if (boardsWithNotifications.length === 0) {
      return NextResponse.json({ message: "No pending notifications" });
    }

    // Process each board with error isolation
    const boardResults: Array<{
      boardId: string;
      success: boolean;
      processed: number;
      sentToResend: number;
      failed: number;
      skippedNoEmail: number;
      error?: string;
    }> = [];

    for (const { boardId } of boardsWithNotifications) {
      try {
        const result = await processBoardNotifications(boardId);

        boardResults.push({
          boardId,
          success: true,
          processed: result.processed,
          sentToResend: result.sentToResend,
          failed: result.failed,
          skippedNoEmail: result.skippedNoEmail,
        });
      } catch (error) {
        console.error(`Failed to process notifications for board ${boardId}:`, error);
        boardResults.push({
          boardId,
          success: false,
          processed: 0,
          sentToResend: 0,
          failed: 0,
          skippedNoEmail: 0,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Aggregate results
    const totals = boardResults.reduce(
      (acc, r) => ({
        processed: acc.processed + r.processed,
        sentToResend: acc.sentToResend + r.sentToResend,
        failed: acc.failed + r.failed,
        skippedNoEmail: acc.skippedNoEmail + r.skippedNoEmail,
        boardsSucceeded: acc.boardsSucceeded + (r.success ? 1 : 0),
        boardsFailed: acc.boardsFailed + (r.success ? 0 : 1),
      }),
      {
        processed: 0,
        sentToResend: 0,
        failed: 0,
        skippedNoEmail: 0,
        boardsSucceeded: 0,
        boardsFailed: 0,
      },
    );

    return NextResponse.json({
      message: "Notifications processed",
      boards: boardsWithNotifications.length,
      boardsSucceeded: totals.boardsSucceeded,
      boardsFailed: totals.boardsFailed,
      processed: totals.processed,
      sentToResend: totals.sentToResend,
      failed: totals.failed,
      skippedNoEmail: totals.skippedNoEmail,
    });
  } catch (error) {
    console.error("Error processing notifications:", error);
    return NextResponse.json({ error: "Failed to process notifications" }, { status: 500 });
  }
}
