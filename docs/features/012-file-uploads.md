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
- Files upload in sequence with progress indicator
- Uploaded files appear inline in the comment content

### Upload File via Drag and Drop

- Drag files from your computer into the rich-text editor
- Drop to start upload
- Files appear inline after upload completes

### Upload File via Paste

- Copy an image (e.g., screenshot)
- Paste into the rich-text editor (Ctrl+V / Cmd+V)
- Image uploads automatically and appears inline

### View Uploaded Image

- Images display inline at full width (max container width)
- Click image to open in new tab (full size)

### View Uploaded Video

- Videos display inline with native video controls
- Play/pause, volume, fullscreen available
- Download link below video

### View Other Files

- Non-media files display as styled download links
- Shows file icon (based on type), filename, and size
- Click to download

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
- Clickable to view full size

### Videos in Comments

- Native HTML5 video player
- Controls: play, pause, volume, fullscreen
- Preloads metadata only (saves bandwidth)

### File Attachments

- Card-style display with border
- File type icon (emoji)
- Filename (truncated if long)
- File size in human-readable format
- Hover effect for interactivity

## Technical Notes

- Uploads require board authentication (password)
- Files are tracked in database linked to board and comment
- When a comment is deleted, its files are also deleted
- File URLs are stored in Tiptap JSON content
- Storage check happens before upload (quota enforcement)
