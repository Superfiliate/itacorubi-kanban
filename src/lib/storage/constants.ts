/**
 * Storage constants and utilities - safe for both client and server
 */

// Constants
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB per file
export const MAX_BOARD_STORAGE = 10 * 1024 * 1024 * 1024; // 10GB per board

// Allowed file types (MIME type prefixes)
export const ALLOWED_FILE_TYPES = [
  // Images
  "image/",
  // Videos
  "video/",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Text
  "text/plain",
  "text/csv",
  // Archives
  "application/zip",
  "application/x-zip-compressed",
];

export function isAllowedFileType(contentType: string): boolean {
  return ALLOWED_FILE_TYPES.some(
    (allowed) => contentType.startsWith(allowed) || contentType === allowed,
  );
}

export function isVercelBlobUrl(url: string): boolean {
  return url.includes(".public.blob.vercel-storage.com");
}

export function isLocalUploadUrl(url: string): boolean {
  return url.startsWith("/uploads/");
}

/**
 * Get a human-readable file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);

  return `${size.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

/**
 * Check if a content type is an image
 */
export function isImageType(contentType: string): boolean {
  return contentType.startsWith("image/");
}

/**
 * Check if a content type is a video
 */
export function isVideoType(contentType: string): boolean {
  return contentType.startsWith("video/");
}
