import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sentEmails } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireBoardAccess } from "@/lib/secure-board";
import { processBoardNotifications } from "@/lib/process-board-notifications";

interface RouteParams {
  params: Promise<{ boardId: string }>;
}

// GET - List emails for this board
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { boardId } = await params;

  try {
    await requireBoardAccess(boardId);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const emails = await db
    .select({
      id: sentEmails.id,
      fromEmail: sentEmails.fromEmail,
      recipientEmail: sentEmails.recipientEmail,
      recipientName: sentEmails.recipientName,
      subject: sentEmails.subject,
      boardId: sentEmails.boardId,
      boardTitle: sentEmails.boardTitle,
      sentToResend: sentEmails.sentToResend,
      createdAt: sentEmails.createdAt,
    })
    .from(sentEmails)
    .where(eq(sentEmails.boardId, boardId))
    .orderBy(desc(sentEmails.createdAt));

  return NextResponse.json({ emails });
}

// POST - Process pending notifications for this board
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { boardId } = await params;

  try {
    await requireBoardAccess(boardId);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processBoardNotifications(boardId);

    if (result.processed === 0 && result.skippedNoEmail === 0) {
      return NextResponse.json({ message: "No pending notifications", processed: 0 });
    }

    return NextResponse.json({
      message: "Notifications processed",
      processed: result.processed,
      sentToResend: result.sentToResend,
      failed: result.failed,
      skippedNoEmail: result.skippedNoEmail,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    console.error("Error processing notifications:", error);
    return NextResponse.json(
      {
        error: "Failed to process notifications",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}
