import { Node, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { FileAttachmentView } from "./file-attachment-view"

export interface FileAttachmentOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fileAttachment: {
      setFileAttachment: (options: {
        url: string
        filename: string
        contentType: string
        size: number
      }) => ReturnType
    }
  }
}

/**
 * Format file size to human readable string
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = bytes / Math.pow(1024, i)
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

/**
 * Get file icon based on content type
 */
function getFileIcon(contentType: string): string {
  if (contentType.startsWith("video/")) return "🎬"
  if (contentType.startsWith("audio/")) return "🎵"
  if (contentType === "application/pdf") return "📄"
  if (contentType.includes("word") || contentType.includes("document")) return "📝"
  if (contentType.includes("excel") || contentType.includes("spreadsheet")) return "📊"
  if (contentType.includes("powerpoint") || contentType.includes("presentation")) return "📽️"
  if (contentType.startsWith("text/")) return "📃"
  if (contentType.includes("zip") || contentType.includes("archive")) return "📦"
  return "📎"
}

export const FileAttachment = Node.create<FileAttachmentOptions>({
  name: "fileAttachment",

  group: "block",

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      url: {
        default: null,
      },
      filename: {
        default: null,
      },
      contentType: {
        default: null,
      },
      size: {
        default: 0,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-file-attachment]',
      },
      {
        tag: 'video[data-file-attachment]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const { url, filename, contentType, size } = HTMLAttributes

    // Render video elements inline
    if (contentType?.startsWith("video/")) {
      return [
        "div",
        mergeAttributes(this.options.HTMLAttributes, {
          "data-file-attachment": "",
          class: "my-2",
        }),
        [
          "video",
          {
            src: url,
            controls: true,
            class: "rounded-md max-w-full h-auto",
            preload: "metadata",
          },
          [
            "a",
            {
              href: url,
              download: filename,
              class: "text-sm text-muted-foreground hover:underline",
            },
            `Download ${filename}`,
          ],
        ],
      ]
    }

    // Render other files as download links
    const icon = getFileIcon(contentType || "")
    const sizeStr = formatFileSize(size || 0)

    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, {
        "data-file-attachment": "",
        class:
          "my-2 p-3 rounded-lg border border-border bg-muted/50 flex items-center gap-3 hover:bg-muted/70 transition-colors",
      }),
      [
        "span",
        { class: "text-2xl" },
        icon,
      ],
      [
        "div",
        { class: "flex-1 min-w-0" },
        [
          "a",
          {
            href: url,
            download: filename,
            target: "_blank",
            rel: "noopener noreferrer",
            class: "font-medium text-foreground hover:underline block truncate",
          },
          filename,
        ],
        [
          "span",
          { class: "text-xs text-muted-foreground" },
          sizeStr,
        ],
      ],
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(FileAttachmentView)
  },

  addCommands() {
    return {
      setFileAttachment:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },
})
