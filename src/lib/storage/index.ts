/**
 * Storage abstraction layer for file uploads (SERVER-ONLY)
 *
 * - Development: Local filesystem (public/uploads/)
 * - Production: Vercel Blob
 *
 * Note: This module uses Node.js fs APIs and should only be imported in server code.
 * For client-safe constants and utilities, import from '@/lib/storage/constants'
 */

import { put, del } from "@vercel/blob"
import { writeFile, mkdir, unlink } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

// Re-export client-safe constants
export {
  MAX_FILE_SIZE,
  MAX_BOARD_STORAGE,
  ALLOWED_FILE_TYPES,
  isAllowedFileType,
  isVercelBlobUrl,
  isLocalUploadUrl,
  formatFileSize,
  isImageType,
  isVideoType,
} from "./constants"

import { MAX_FILE_SIZE, isAllowedFileType, isVercelBlobUrl, isLocalUploadUrl } from "./constants"

function useVercelBlob(): boolean {
  // Use Vercel Blob only in production with a valid token
  // In development and test modes, use local filesystem
  return process.env.NODE_ENV === "production" && !!process.env.BLOB_READ_WRITE_TOKEN
}

/**
 * Upload a file to storage
 * Returns the public URL and file size
 */
export async function uploadFile(
  file: File,
  boardId: string
): Promise<{ url: string; size: number }> {
  const size = file.size

  if (size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum allowed (${MAX_FILE_SIZE / 1024 / 1024}MB)`)
  }

  if (!isAllowedFileType(file.type)) {
    throw new Error(`File type "${file.type}" is not allowed`)
  }

  if (useVercelBlob()) {
    // Production: Use Vercel Blob
    const blob = await put(`${boardId}/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    })
    return { url: blob.url, size }
  } else {
    // Development: Local filesystem
    const uploadsDir = path.join(process.cwd(), "public", "uploads", boardId)

    // Ensure directory exists
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const ext = path.extname(file.name)
    const uniqueName = `${crypto.randomUUID()}${ext}`
    const filePath = path.join(uploadsDir, uniqueName)

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    // Return local URL (served by Next.js static)
    const url = `/uploads/${boardId}/${uniqueName}`
    return { url, size }
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(url: string): Promise<void> {
  if (isVercelBlobUrl(url)) {
    // Production: Delete from Vercel Blob
    await del(url)
  } else if (isLocalUploadUrl(url)) {
    // Development: Delete local file
    const filePath = path.join(process.cwd(), "public", url)
    try {
      await unlink(filePath)
    } catch (error) {
      // Ignore if file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error
      }
    }
  }
  // If URL doesn't match either pattern, ignore (might be external URL)
}
