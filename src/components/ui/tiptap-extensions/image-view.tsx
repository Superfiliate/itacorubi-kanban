"use client";

import { useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { ArrowDownToLine, Maximize2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ImageLightbox } from "@/components/ui/image-lightbox";

/**
 * React component for rendering images in Tiptap with hover actions.
 *
 * Read-only mode: Download + Expand buttons
 * Edit mode: Download + Expand + Delete buttons
 */
export function ImageView({ node, deleteNode, editor }: NodeViewProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const { src, alt } = node.attrs as { src: string; alt?: string };
  const isEditable = editor.isEditable;

  const handleDownload = () => {
    // Create a temporary link to trigger download
    const link = document.createElement("a");
    link.href = src;
    link.download = alt || "image";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExpand = () => {
    setIsLightboxOpen(true);
  };

  const handleDelete = () => {
    deleteNode();
  };

  return (
    <NodeViewWrapper className="relative my-2 inline-block max-w-full">
      <div
        className="relative inline-block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image */}
        <img src={src} alt={alt || ""} className="rounded-md max-w-full h-auto" draggable={false} />

        {/* Hover overlay with action buttons */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center gap-2 rounded-md transition-opacity duration-200",
            "bg-black/40",
            isHovered ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          {/* Download button */}
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-10 w-10 rounded-full bg-white/90 hover:bg-white text-gray-800"
            onClick={handleDownload}
            title="Download"
            aria-label="Download image"
          >
            <ArrowDownToLine className="h-5 w-5" />
          </Button>

          {/* Expand/Preview button */}
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-10 w-10 rounded-full bg-white/90 hover:bg-white text-gray-800"
            onClick={handleExpand}
            title="View fullscreen"
            aria-label="View fullscreen"
          >
            <Maximize2 className="h-5 w-5" />
          </Button>

          {/* Delete button - only in edit mode */}
          {isEditable && (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-10 w-10 rounded-full bg-white/90 hover:bg-white text-red-600 hover:text-red-700"
              onClick={handleDelete}
              title="Delete"
              aria-label="Delete image"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Lightbox dialog */}
      <ImageLightbox src={src} alt={alt} open={isLightboxOpen} onOpenChange={setIsLightboxOpen} />
    </NodeViewWrapper>
  );
}
