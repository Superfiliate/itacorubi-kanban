import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { uploadedFiles } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireBoardPassword } from "@/lib/secure-board";
import {
  uploadFile,
  deleteFile,
  MAX_FILE_SIZE,
  MAX_BOARD_STORAGE,
  isAllowedFileType,
} from "@/lib/storage";

/**
 * POST /api/upload
 * Upload a file to storage and record it in the database
 *
 * FormData:
 * - file: The file to upload
 * - boardId: The board ID
 * - commentId: The comment ID (can be a pending ID for new comments)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const boardId = formData.get("boardId") as string | null;
    const commentId = formData.get("commentId") as string | null;

    // Validate inputs
    if (!file || !boardId || !commentId) {
      return NextResponse.json(
        { error: "Missing required fields: file, boardId, commentId" },
        { status: 400 },
      );
    }

    // Verify board access
    try {
      await requireBoardPassword(boardId);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed (${MAX_FILE_SIZE / 1024 / 1024}MB)` },
        { status: 400 },
      );
    }

    // Validate file type
    if (!isAllowedFileType(file.type)) {
      return NextResponse.json(
        { error: `File type "${file.type}" is not allowed` },
        { status: 400 },
      );
    }

    // Check board storage quota
    const boardUsage = await db
      .select({ total: sql<number>`COALESCE(SUM(${uploadedFiles.size}), 0)` })
      .from(uploadedFiles)
      .where(eq(uploadedFiles.boardId, boardId));

    const currentUsage = boardUsage[0]?.total ?? 0;
    if (currentUsage + file.size > MAX_BOARD_STORAGE) {
      return NextResponse.json(
        { error: `Board storage limit exceeded (${MAX_BOARD_STORAGE / 1024 / 1024 / 1024}GB max)` },
        { status: 400 },
      );
    }

    // Upload file to storage
    const { url, size } = await uploadFile(file, boardId);

    // Record in database (commentId may not exist yet but will when comment is created)
    const fileId = crypto.randomUUID();
    await db.insert(uploadedFiles).values({
      id: fileId,
      boardId,
      commentId, // Stored before comment exists - linked when comment is created with same ID
      url,
      filename: file.name,
      contentType: file.type,
      size,
    });

    return NextResponse.json({
      id: fileId,
      url,
      filename: file.name,
      contentType: file.type,
      size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}

/**
 * DELETE /api/upload
 * Delete a file from storage and database
 *
 * Query params:
 * - fileId: The file ID to delete
 * - boardId: The board ID (for authorization)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");
    const boardId = searchParams.get("boardId");

    if (!fileId || !boardId) {
      return NextResponse.json(
        { error: "Missing required params: fileId, boardId" },
        { status: 400 },
      );
    }

    // Verify board access
    try {
      await requireBoardPassword(boardId);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get file record
    const file = await db.query.uploadedFiles.findFirst({
      where: eq(uploadedFiles.id, fileId),
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (file.boardId !== boardId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete from storage
    await deleteFile(file.url);

    // Delete from database
    await db.delete(uploadedFiles).where(eq(uploadedFiles.id, fileId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
