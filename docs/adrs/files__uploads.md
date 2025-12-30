# ADR 018: File Upload Storage

File uploads use environment-aware storage: local filesystem in development, Vercel Blob in production.

- **Development**: Files stored in `public/uploads/{boardId}/` (gitignored, served by Next.js static)
- **Production**: Vercel Blob storage with automatic CDN

## Upload Methods

Two upload methods based on file size and environment:

- **Server upload** (`/api/upload`): File goes through our API, then to storage. Works for files <4.5MB. Used in development and for small files in production.
- **Client upload** (`/api/upload/client`): File goes directly to Vercel Blob. Works for any file size up to 100MB. Used in production for files >=4MB.

The client automatically selects the best method based on file size and environment.

## Database Schema

Files tracked in `uploaded_files` table with:

- `board_id` - for quota calculations and cleanup
- `comment_id` - for cascade deletion
- `size` - for quota enforcement
- `onDelete: restrict` - forces explicit cleanup before comment deletion

## Limits

- 100 MB per file
- 10 GB per board

## Tiptap Integration

- `@tiptap/extension-file-handler` for drag-drop and paste handling with correct positioning
- `@tiptap/extension-image` for inline images
- Custom `FileAttachment` node for videos and documents
- Custom `UploadPlaceholder` node for visual feedback during upload

### Upload Flow

1. User drops/pastes/attaches file
2. `FileHandler` extension captures the event with exact document position
3. `UploadPlaceholder` node inserted at that position immediately
4. Toast shows "Uploading {filename}..."
5. File uploads (server or client method based on size)
6. Placeholder replaced with actual image/file node
7. Toast updates to success/error

## Production Setup

1. Create Vercel Blob store in project dashboard
2. Link to environments (adds `BLOB_READ_WRITE_TOKEN` automatically)
3. No local env needed - dev uses local filesystem

## File Cleanup

When a comment is deleted:

1. Query `uploaded_files` for comment
2. Delete from storage (Vercel Blob or local)
3. Delete database records
4. Delete comment

## Links

- Storage: `src/lib/storage/index.ts`
- Server upload API: `src/app/api/upload/route.ts`
- Client upload API: `src/app/api/upload/client/route.ts`
- Rich text editor: `src/components/ui/rich-text-editor.tsx`
- Tiptap extensions: `src/components/ui/tiptap-extensions/`
