# ADR 018: File Upload Storage

File uploads use environment-aware storage: local filesystem in development, Vercel Blob in production.

- **Development**: Files stored in `public/uploads/{boardId}/` (gitignored, served by Next.js static)
- **Production**: Vercel Blob storage with automatic CDN

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

- `@tiptap/extension-image` for inline images
- Custom `FileAttachment` node for videos and documents
- Drop/paste/click handlers for upload flow

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
- API: `src/app/api/upload/route.ts`
- Tiptap: `src/components/ui/tiptap-extensions/file-attachment.ts`
