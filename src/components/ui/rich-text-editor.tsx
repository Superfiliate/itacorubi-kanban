"use client"

import React, { useEffect, useRef, useCallback, useState } from "react"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import { FileAttachment } from "./tiptap-extensions/file-attachment"
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
  Paperclip,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { toast } from "sonner"

interface RichTextEditorProps {
  content?: string
  onChange?: (content: string) => void
  editable?: boolean
  placeholder?: string
  className?: string
  // File upload props (optional - only needed when file uploads are enabled)
  boardId?: string
  commentId?: string
  onUploadStart?: () => void
  onUploadEnd?: () => void
}

interface UploadedFileResult {
  id: string
  url: string
  filename: string
  contentType: string
  size: number
}

async function uploadFileToServer(
  file: File,
  boardId: string,
  commentId: string
): Promise<UploadedFileResult> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("boardId", boardId)
  formData.append("commentId", commentId)

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to upload file")
  }

  return response.json()
}

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  children,
  title,
}: {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  children: React.ReactNode
  title: string
}) {
  return (
    <Button
      type="button"
      variant={isActive ? "secondary" : "ghost"}
      size="icon-sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="h-7 w-7"
    >
      {children}
    </Button>
  )
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-border mx-1" />
}

interface ToolbarProps {
  editor: Editor
  onAttachClick?: () => void
  isUploading?: boolean
  canUpload?: boolean
}

function Toolbar({ editor, onAttachClick, isUploading, canUpload }: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 p-1 border-b border-border bg-muted/30">
      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        title="Inline Code"
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive("heading", { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Block elements */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        title="Quote"
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive("codeBlock")}
        title="Code Block"
      >
        <div className="flex items-center justify-center h-4 w-4 text-[10px] font-mono font-bold">
          {"</>"}
        </div>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      >
        <Minus className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (Ctrl+Z)"
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>

      {/* Attachment button - only show if upload is enabled */}
      {canUpload && (
        <>
          <ToolbarDivider />
          <ToolbarButton
            onClick={() => onAttachClick?.()}
            disabled={isUploading}
            title="Attach file"
            aria-label="Attach file"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </ToolbarButton>
        </>
      )}
    </div>
  )
}

export function RichTextEditor({
  content,
  onChange,
  editable = true,
  placeholder = "Write something...",
  className,
  boardId,
  commentId,
  onUploadStart,
  onUploadEnd,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<Editor | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const canUpload = !!(boardId && commentId)

  const handleFileUpload = useCallback(
    async (files: FileList | File[]) => {
      const currentEditor = editorRef.current
      if (!boardId || !commentId || !currentEditor) return

      const fileArray = Array.from(files)
      if (fileArray.length === 0) return

      setIsUploading(true)
      onUploadStart?.()

      try {
        for (const file of fileArray) {
          try {
            const result = await uploadFileToServer(file, boardId, commentId)

            // Insert appropriate node based on file type
            if (result.contentType.startsWith("image/")) {
              // Insert image inline
              currentEditor.chain().focus().setImage({ src: result.url, alt: result.filename }).run()
            } else if (result.contentType.startsWith("video/")) {
              // Insert video as custom HTML
              currentEditor
                .chain()
                .focus()
                .insertContent({
                  type: "fileAttachment",
                  attrs: {
                    url: result.url,
                    filename: result.filename,
                    contentType: result.contentType,
                    size: result.size,
                  },
                })
                .run()
            } else {
              // Insert file attachment node
              currentEditor
                .chain()
                .focus()
                .insertContent({
                  type: "fileAttachment",
                  attrs: {
                    url: result.url,
                    filename: result.filename,
                    contentType: result.contentType,
                    size: result.size,
                  },
                })
                .run()
            }

            toast.success(`Uploaded ${result.filename}`)
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to upload file")
          }
        }
      } finally {
        setIsUploading(false)
        onUploadEnd?.()
      }
    },
    [boardId, commentId, onUploadStart, onUploadEnd]
  )

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: "rounded-md max-w-full h-auto cursor-pointer",
        },
      }),
      FileAttachment,
    ],
    content: content ? JSON.parse(content) : undefined,
    editable,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[100px] px-3 py-2",
          !editable && "min-h-0 p-0"
        ),
      },
      handleDrop: (view, event, _slice, moved) => {
        if (!canUpload || moved || !event.dataTransfer?.files.length) {
          return false
        }
        event.preventDefault()
        handleFileUpload(event.dataTransfer.files)
        return true
      },
      handlePaste: (view, event) => {
        if (!canUpload) return false

        const files = event.clipboardData?.files
        if (files && files.length > 0) {
          // Check if there are actual files (not just text)
          const hasFiles = Array.from(files).some((file) => file.type)
          if (hasFiles) {
            event.preventDefault()
            handleFileUpload(files)
            return true
          }
        }
        return false
      },
    },
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(JSON.stringify(editor.getJSON()))
      }
    },
    // Prevent SSR hydration issues
    immediatelyRender: false,
  })

  // Keep ref in sync with editor
  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  // Sync editor content when prop changes (e.g., when form is reset)
  useEffect(() => {
    if (!editor) return

    const newContent = content ? JSON.parse(content) : null
    const currentContent = editor.getJSON()

    // Only update if content actually changed (compare serialized versions)
    if (JSON.stringify(newContent) !== JSON.stringify(currentContent)) {
      editor.commands.setContent(newContent)
    }
  }, [editor, content])

  const handleAttachClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      handleFileUpload(files)
    }
    // Reset input so same file can be selected again
    e.target.value = ""
  }

  if (!editor) {
    return null
  }

  // Read-only mode: just render the content without toolbar or border
  if (!editable) {
    return (
      <div className={cn("rich-text-content", className)}>
        <EditorContent editor={editor} />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background",
        className
      )}
    >
      <Toolbar
        editor={editor}
        onAttachClick={handleAttachClick}
        isUploading={isUploading}
        canUpload={canUpload}
      />
      <div className="relative">
        <EditorContent editor={editor} />
        {/* Placeholder */}
        {editor.isEmpty && (
          <div className="absolute top-2 left-3 text-muted-foreground pointer-events-none text-sm">
            {placeholder}
          </div>
        )}
      </div>
      {/* Hidden file input for attachment button */}
      {canUpload && (
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
        />
      )}
    </div>
  )
}

// Helper to check if content is empty
export function isRichTextEmpty(content: string | undefined): boolean {
  if (!content) return true
  try {
    const json = JSON.parse(content)
    if (!json.content || json.content.length === 0) return true
    // Check if all nodes are empty (no text content)
    return json.content.every(
      (node: { type: string; content?: unknown[] }) =>
        !node.content || node.content.length === 0
    )
  } catch {
    return true
  }
}
