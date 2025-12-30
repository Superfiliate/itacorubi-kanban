# Feature: File Uploads

## Overview

Users can upload files (images, videos, documents) to task comments. Files are displayed inline in comments - images and videos show previews, while other file types appear as download links.

## Supported File Types

- **Images**: JPEG, PNG, GIF, WebP, SVG
- **Videos**: MP4, WebM, MOV
- **Documents**: PDF, Word (DOC/DOCX), Excel (XLS/XLSX), PowerPoint (PPT/PPTX)
- **Text**: TXT, CSV
- **Archives**: ZIP

## Limits

- **Per-file**: 100 MB maximum
- **Per-board**: 10 GB total storage

## User Flows

### Upload File via Toolbar

- Click the paperclip (attach) button in the rich-text editor toolbar
- Select one or more files from the file picker
- A placeholder appears at cursor position showing "Uploading..."
- Toast notification shows upload progress
- Placeholder is replaced with the file when upload completes

### Upload File via Drag and Drop

- Drag files from your computer into the rich-text editor
- Drop indicator shows where file will be inserted
- Drop to start upload - placeholder appears at exact drop location
- Toast notification shows upload progress
- Placeholder is replaced with the file when upload completes

### Upload File via Paste

- Copy an image (e.g., screenshot)
- Paste into the rich-text editor (Ctrl+V / Cmd+V)
- Placeholder appears at cursor position
- Image uploads automatically and replaces placeholder

### View Uploaded Image

- Images display inline at full width (max container width)
- Hover over image to reveal action buttons:
  - **Download** - saves image to your device
  - **Expand** - opens fullscreen lightbox preview
- Lightbox: dark backdrop, centered image at max size, click backdrop or X to close

### View Uploaded Video

- Videos display inline with native video controls
- Play/pause, volume, fullscreen available
- Hover to reveal Download button

### View Other Files

- Non-media files display as styled download cards
- Shows file icon (based on type), filename, and size
- Hover to reveal Download button
- Click filename to download

### Delete File (Edit Mode)

- When editing a comment, all files show a Delete button on hover
- Click Delete to remove the file from the comment
- Orphaned files are cleaned up from storage when comment is saved

### Check Storage Usage

- Click the theme toggle (sun/moon icon) in the board header
- Storage usage appears at bottom of dropdown
- Shows used space, total limit, and percentage bar
- Bar colors: green (< 70%), amber (70-90%), red (> 90%)

## Display

### Images in Comments

- Rounded corners
- Max width: 100% of container
- Responsive height
- Hover overlay with action buttons (Download, Expand, Delete in edit mode)

### Videos in Comments

- Native HTML5 video player
- Controls: play, pause, volume, fullscreen
- Preloads metadata only (saves bandwidth)
- Hover overlay with action buttons (Download, Delete in edit mode)

### File Attachments

- Card-style display with border
- File type icon (emoji)
- Filename (truncated if long)
- File size in human-readable format
- Hover overlay with action buttons (Download, Delete in edit mode)

## Technical Notes

- Uploads require board authentication (password)
- Files are tracked in database linked to board and comment
- When a comment is deleted, its files are also deleted
- When a comment is updated, orphaned files (removed from content) are cleaned up
- File URLs are stored in Tiptap JSON content
- Storage check happens before upload (quota enforcement)
