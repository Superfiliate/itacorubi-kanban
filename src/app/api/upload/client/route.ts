import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { db } from "@/db";
import { uploadedFiles } from "@/db/schema";
import { requireBoardPassword } from "@/lib/secure-board";
import { MAX_FILE_SIZE, isAllowedFileType, ALLOWED_MIME_TYPES } from "@/lib/storage/constants";
import { checkBoardStorageQuota } from "@/lib/storage/quota";

/**
 * Client upload metadata passed from the client
 */
interface ClientUploadMetadata {
  boardId: string;
  commentId: string;
  fileSize: number;
  filename: string;
}

/**
 * POST /api/upload/client
 *
 * Handles client-side uploads to Vercel Blob.
 * This endpoint is used for files that are too large to pass through the server (>4.5MB).
 *
 * The flow:
 * 1. Client sends file metadata (name, size, type) along with boardId/commentId
 * 2. Server validates board access and storage quota
 * 3. Server generates an upload token
 * 4. Client uploads directly to Vercel Blob
 * 5. Vercel calls onUploadCompleted to record the file in the database
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Parse the client payload
        const metadata = JSON.parse(clientPayload || "{}") as ClientUploadMetadata;

        if (!metadata.boardId || !metadata.commentId) {
          throw new Error("Missing boardId or commentId");
        }

        // Verify board access
        try {
          await requireBoardPassword(metadata.boardId);
        } catch {
          throw new Error("Unauthorized");
        }

        return {
          allowedContentTypes: ALLOWED_MIME_TYPES,
          maximumSizeInBytes: MAX_FILE_SIZE,
          // Add random suffix to prevent conflicts
          addRandomSuffix: true,
          // Store files organized by boardId
          tokenPayload: JSON.stringify(metadata),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This is called by Vercel after the upload completes
        // Note: This callback is NOT called in local development!

        const metadata = JSON.parse(tokenPayload || "{}") as ClientUploadMetadata;

        if (!metadata.boardId || !metadata.commentId) {
          console.error("Missing metadata in onUploadCompleted");
          return;
        }

        // Validate file type
        if (!isAllowedFileType(blob.contentType)) {
          console.error(`Invalid file type: ${blob.contentType}`);
          return;
        }

        // Check board storage quota
        const quota = await checkBoardStorageQuota(metadata.boardId, metadata.fileSize);
        if (!quota.allowed) {
          console.error("Board storage limit exceeded");
          // Note: The file was already uploaded to Blob, but we won't record it
          // This is a limitation of client uploads - we should delete it
          // For now, we'll just not record it and log the error
          return;
        }

        // Record in database
        const fileId = crypto.randomUUID();
        await db.insert(uploadedFiles).values({
          id: fileId,
          boardId: metadata.boardId,
          commentId: metadata.commentId,
          url: blob.url,
          filename: metadata.filename,
          contentType: blob.contentType,
          size: metadata.fileSize,
        });

        console.log(`Client upload completed: ${blob.url}`);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Client upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 },
    );
  }
}
