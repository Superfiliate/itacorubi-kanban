import Image from "@tiptap/extension-image"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { ImageView } from "./image-view"

/**
 * Custom Image extension that uses a React component for rendering.
 * This enables interactive hover actions (download, expand, delete).
 */
export const ImageExtension = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ImageView)
  },
})
