"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageLightboxProps {
  src: string
  alt?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Fullscreen image preview lightbox.
 * Uses a minimal dark backdrop with centered image at max size.
 * Closes on backdrop click, X button, or Escape key.
 */
export function ImageLightbox({ src, alt, open, onOpenChange }: ImageLightboxProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/90",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center p-4",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
          // Close on backdrop click
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onOpenChange(false)
            }
          }}
        >
          {/* Close button */}
          <DialogPrimitive.Close
            className={cn(
              "absolute top-4 right-4 z-50",
              "rounded-full p-2 bg-black/50 text-white",
              "hover:bg-black/70 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-white/50"
            )}
          >
            <XIcon className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          {/* Image */}
          <img
            src={src}
            alt={alt || "Preview"}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on image
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
