import { Node, mergeAttributes } from "@tiptap/core"

export interface UploadPlaceholderOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    uploadPlaceholder: {
      /**
       * Insert an upload placeholder at a specific position
       */
      setUploadPlaceholder: (options: {
        uploadId: string
        filename: string
      }) => ReturnType
      /**
       * Remove an upload placeholder by its uploadId
       */
      removeUploadPlaceholder: (uploadId: string) => ReturnType
    }
  }
}

/**
 * A placeholder node that displays while a file is being uploaded.
 * Shows a loading spinner and filename, gets replaced when upload completes.
 */
export const UploadPlaceholder = Node.create<UploadPlaceholderOptions>({
  name: "uploadPlaceholder",

  group: "block",

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      uploadId: {
        default: null,
      },
      filename: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-upload-placeholder]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const { filename } = HTMLAttributes

    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, {
        "data-upload-placeholder": "",
        class:
          "my-2 p-3 rounded-lg border border-border bg-muted/50 flex items-center gap-3 animate-pulse",
      }),
      // Spinner (CSS-based)
      [
        "div",
        {
          class: "h-5 w-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin",
        },
      ],
      // Filename and status
      [
        "div",
        { class: "flex-1 min-w-0" },
        [
          "span",
          { class: "font-medium text-foreground block truncate" },
          filename || "Uploading...",
        ],
        [
          "span",
          { class: "text-xs text-muted-foreground" },
          "Uploading...",
        ],
      ],
    ]
  },

  addCommands() {
    return {
      setUploadPlaceholder:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
      removeUploadPlaceholder:
        (uploadId) =>
        ({ tr, state, dispatch }) => {
          const { doc } = state
          let found = false

          doc.descendants((node, pos) => {
            if (node.type.name === "uploadPlaceholder" && node.attrs.uploadId === uploadId) {
              if (dispatch) {
                tr.delete(pos, pos + node.nodeSize)
              }
              found = true
              return false // Stop searching
            }
            return true
          })

          return found
        },
    }
  },
})
