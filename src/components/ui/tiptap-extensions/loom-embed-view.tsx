"use client";

import { useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { ExternalLink, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * React component for rendering Loom video embeds in Tiptap with hover actions.
 *
 * Read-only mode: Open in new tab button
 * Edit mode: Open in new tab + Delete buttons
 */
export function LoomEmbedView({ node, deleteNode, editor }: NodeViewProps) {
  const [isHovered, setIsHovered] = useState(false);

  const { videoId } = node.attrs as { videoId: string };
  const isEditable = editor.isEditable;

  const embedUrl = `https://www.loom.com/embed/${videoId}`;
  const shareUrl = `https://www.loom.com/share/${videoId}`;

  const handleOpenInNewTab = () => {
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  const handleDelete = () => {
    deleteNode();
  };

  return (
    <NodeViewWrapper className="my-2">
      <div
        className="relative w-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Loom embed iframe */}
        <iframe
          src={embedUrl}
          frameBorder="0"
          allowFullScreen
          className="w-full aspect-video rounded-md"
          title="Loom video"
        />

        {/* Hover overlay with action buttons - positioned in top right */}
        <div
          className={cn(
            "absolute top-2 right-2 flex items-center gap-1 transition-opacity duration-200",
            isHovered ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          {/* Open in new tab button */}
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md"
            onClick={handleOpenInNewTab}
            title="Open in Loom"
            aria-label="Open video in Loom"
          >
            <ExternalLink className="h-4 w-4" />
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
              aria-label="Delete Loom embed"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
}
