import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sentEmails } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireBoardAccess } from "@/lib/secure-board";

interface RouteParams {
  params: Promise<{ boardId: string; id: string }>;
}

// GET - Get single email with full HTML content
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { boardId, id } = await params;

  try {
    await requireBoardAccess(boardId);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch email and verify it belongs to this board
  const email = await db.query.sentEmails.findFirst({
    where: and(eq(sentEmails.id, id), eq(sentEmails.boardId, boardId)),
  });

  if (!email) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  return NextResponse.json({ email });
}
