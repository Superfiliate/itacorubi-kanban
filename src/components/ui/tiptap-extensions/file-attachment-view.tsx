"use client";

import { useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { ArrowDownToLine, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Format file size to human readable string
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Get file icon based on content type
 */
function getFileIcon(contentType: string): string {
  if (contentType.startsWith("video/")) return "🎬";
  if (contentType.startsWith("audio/")) return "🎵";
  if (contentType === "application/pdf") return "📄";
  if (contentType.includes("word") || contentType.includes("document")) return "📝";
  if (contentType.includes("excel") || contentType.includes("spreadsheet")) return "📊";
  if (contentType.includes("powerpoint") || contentType.includes("presentation")) return "📽️";
  if (contentType.startsWith("text/")) return "📃";
  if (contentType.includes("zip") || contentType.includes("archive")) return "📦";
  return "📎";
}

/**
 * React component for rendering file attachments (videos/documents) in Tiptap with hover actions.
 *
 * Videos: inline player with hover overlay for download/delete
 * Documents: card-style with hover overlay for download/delete
 */
export function FileAttachmentView({ node, deleteNode, editor }: NodeViewProps) {
  const [isHovered, setIsHovered] = useState(false);

  const { url, filename, contentType, size } = node.attrs as {
    url: string;
    filename: string;
    contentType: string;
    size: number;
  };

  const isEditable = editor.isEditable;
  const isVideo = contentType?.startsWith("video/");

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || "file";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = () => {
    deleteNode();
  };

  // Action buttons overlay
  const ActionButtons = () => (
    <div
      className={cn(
        "absolute top-2 right-2 flex items-center gap-1 transition-opacity duration-200",
        isHovered ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
    >
      {/* Download button */}
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md"
        onClick={handleDownload}
        title="Download"
        aria-label={`Download ${filename}`}
      >
        <ArrowDownToLine className="h-4 w-4" />
      </Button>

      {/* Delete button - only in edit mode */}
      {isEditable && (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-red-600 hover:text-red-700 shadow-md"
          onClick={handleDelete}
          title="Delete"
          aria-label={`Delete ${filename}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  // Video rendering
  if (isVideo) {
    return (
      <NodeViewWrapper className="my-2">
        <div
          className="relative inline-block max-w-full"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* User-uploaded video - captions not available */}
          {/* oxlint-disable-next-line jsx-a11y/media-has-caption */}
          <video src={url} controls className="rounded-md max-w-full h-auto" preload="metadata">
            Your browser does not support the video tag.
          </video>
          <ActionButtons />
        </div>
      </NodeViewWrapper>
    );
  }

  // Document/file rendering
  const icon = getFileIcon(contentType || "");
  const sizeStr = formatFileSize(size || 0);

  return (
    <NodeViewWrapper className="my-2">
      <div
        className={cn(
          "relative inline-flex items-center gap-3 p-3 rounded-lg border border-border",
          "bg-muted/50 hover:bg-muted/70 transition-colors max-w-full",
          isHovered && "ring-2 ring-ring ring-offset-2 ring-offset-background",
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* File icon */}
        <span className="text-2xl flex-shrink-0">{icon}</span>

        {/* File info - using <a> for file download (Link doesn't support download attribute) */}
        <div className="flex-1 min-w-0 pr-16">
          {/* oxlint-disable-next-line nextjs/no-html-link-for-pages */}
          <a
            href={url}
            download={filename}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground hover:underline block truncate"
          >
            {filename}
          </a>
          <span className="text-xs text-muted-foreground">{sizeStr}</span>
        </div>

        {/* Action buttons positioned in top right */}
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 right-2 flex items-center gap-1 transition-opacity duration-200",
            isHovered ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-8 w-8 rounded-full bg-background hover:bg-muted text-foreground shadow-sm border"
            onClick={handleDownload}
            title="Download"
            aria-label={`Download ${filename}`}
          >
            <ArrowDownToLine className="h-4 w-4" />
          </Button>

          {isEditable && (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full bg-background hover:bg-muted text-red-600 hover:text-red-700 shadow-sm border"
              onClick={handleDelete}
              title="Delete"
              aria-label={`Delete ${filename}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
}
