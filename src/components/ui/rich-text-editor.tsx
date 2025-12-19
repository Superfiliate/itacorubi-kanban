"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { FileHandler } from "@tiptap/extension-file-handler";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { ImageExtension } from "./tiptap-extensions/image-extension";
import { FileAttachment } from "./tiptap-extensions/file-attachment";
import { LoomEmbed } from "./tiptap-extensions/loom-embed";
import { YouTubeEmbed } from "./tiptap-extensions/youtube-embed";
import { UploadPlaceholder } from "./tiptap-extensions/upload-placeholder";
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
  ListTodo,
  Quote,
  Minus,
  Undo,
  Redo,
  Paperclip,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { toast } from "sonner";

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  editable?: boolean;
  placeholder?: string;
  className?: string;
  // File upload props (optional - only needed when file uploads are enabled)
  boardId?: string;
  commentId?: string;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
}

interface UploadedFileResult {
  id: string;
  url: string;
  filename: string;
  contentType: string;
  size: number;
}

// Threshold for using client upload (4MB - below Vercel's function payload limit)
const CLIENT_UPLOAD_THRESHOLD = 4 * 1024 * 1024;

/**
 * Upload a file using server-side upload (goes through our API)
 * Works for files < 4.5MB
 */
async function uploadFileViaServer(
  file: File,
  boardId: string,
  commentId: string,
): Promise<UploadedFileResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("boardId", boardId);
  formData.append("commentId", commentId);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to upload file");
  }

  return response.json();
}

/**
 * Upload a file using client-side upload (direct to Vercel Blob)
 * Works for any file size up to 100MB
 * Only works in production (onUploadCompleted doesn't work locally)
 */
async function uploadFileViaClient(
  file: File,
  boardId: string,
  commentId: string,
): Promise<UploadedFileResult> {
  // Dynamic import to avoid bundling in non-production builds
  const { upload } = await import("@vercel/blob/client");

  const blob = await upload(file.name, file, {
    access: "public",
    handleUploadUrl: "/api/upload/client",
    clientPayload: JSON.stringify({
      boardId,
      commentId,
      fileSize: file.size,
      filename: file.name,
    }),
  });

  return {
    id: crypto.randomUUID(), // ID is generated server-side in onUploadCompleted
    url: blob.url,
    filename: file.name,
    contentType: blob.contentType,
    size: file.size,
  };
}

/**
 * Upload a file using the best available method:
 * - Production + large files: client upload (direct to Vercel Blob)
 * - Development or small files: server upload (through our API)
 */
async function uploadFile(
  file: File,
  boardId: string,
  commentId: string,
): Promise<UploadedFileResult> {
  const isProduction = process.env.NODE_ENV === "production";
  const isLargeFile = file.size >= CLIENT_UPLOAD_THRESHOLD;

  // Use client upload for large files in production
  // (client upload callback doesn't work in development)
  if (isProduction && isLargeFile) {
    return uploadFileViaClient(file, boardId, commentId);
  }

  // Use server upload for small files or in development
  return uploadFileViaServer(file, boardId, commentId);
}

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
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
  );
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-border mx-1" />;
}

interface ToolbarProps {
  editor: Editor;
  onAttachClick?: () => void;
  isUploading?: boolean;
  canUpload?: boolean;
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
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        isActive={editor.isActive("taskList")}
        title="Task List"
      >
        <ListTodo className="h-4 w-4" />
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
  );
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const canUpload = !!(boardId && commentId);

  const handleFileUpload = useCallback(
    async (files: FileList | File[], pos?: number) => {
      const currentEditor = editorRef.current;
      if (!boardId || !commentId || !currentEditor) return;

      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      setIsUploading(true);
      onUploadStart?.();

      try {
        for (const file of fileArray) {
          // Generate unique ID for this upload's placeholder
          const uploadId = crypto.randomUUID();

          // Insert placeholder immediately at the drop position
          const placeholderNode = {
            type: "uploadPlaceholder",
            attrs: { uploadId, filename: file.name },
          };

          if (pos !== undefined) {
            currentEditor.chain().focus().insertContentAt(pos, placeholderNode).run();
          } else {
            currentEditor.chain().focus().insertContent(placeholderNode).run();
          }

          // Show loading toast
          const toastId = toast.loading(`Uploading ${file.name}...`);

          try {
            const result = await uploadFile(file, boardId, commentId);

            // Build the content to replace placeholder with
            let nodeContent: { type: string; attrs: Record<string, unknown> };

            if (result.contentType.startsWith("image/")) {
              nodeContent = {
                type: "image",
                attrs: { src: result.url, alt: result.filename },
              };
            } else {
              // Video and other files use fileAttachment node
              nodeContent = {
                type: "fileAttachment",
                attrs: {
                  url: result.url,
                  filename: result.filename,
                  contentType: result.contentType,
                  size: result.size,
                },
              };
            }

            // Find and replace the placeholder with actual content
            const { doc } = currentEditor.state;
            let placeholderPos: number | null = null;

            doc.descendants((node, nodePos) => {
              if (node.type.name === "uploadPlaceholder" && node.attrs.uploadId === uploadId) {
                placeholderPos = nodePos;
                return false; // Stop searching
              }
              return true;
            });

            if (placeholderPos !== null) {
              // Replace placeholder with actual content
              currentEditor
                .chain()
                .focus()
                .deleteRange({ from: placeholderPos, to: placeholderPos + 1 })
                .insertContentAt(placeholderPos, nodeContent)
                .run();
            }

            toast.success(`Uploaded ${result.filename}`, { id: toastId });
          } catch (error) {
            // Remove placeholder on error
            currentEditor.commands.removeUploadPlaceholder(uploadId);
            toast.error(error instanceof Error ? error.message : "Failed to upload file", {
              id: toastId,
            });
          }
        }
      } finally {
        setIsUploading(false);
        onUploadEnd?.();
      }
    },
    [boardId, commentId, onUploadStart, onUploadEnd],
  );

  // Store refs to allow callbacks to access latest values without recreating extension
  const handleFileUploadRef = useRef(handleFileUpload);
  const canUploadRef = useRef(canUpload);

  useEffect(() => {
    handleFileUploadRef.current = handleFileUpload;
  }, [handleFileUpload]);

  useEffect(() => {
    canUploadRef.current = canUpload;
  }, [canUpload]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false, // Don't open links when clicking in edit mode
        autolink: true, // Auto-detect URLs when typing
        defaultProtocol: "https",
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2",
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true, // Allow nested task lists
      }),
      ImageExtension.configure({
        inline: false,
        allowBase64: false,
      }),
      FileAttachment,
      LoomEmbed,
      YouTubeEmbed,
      UploadPlaceholder,
      // FileHandler is always included, but callbacks check if upload is enabled
      // Note: Not using allowedMimeTypes to avoid filtering issues - we validate on the server
      FileHandler.configure({
        onDrop: (_currentEditor, files, pos) => {
          // Always handle the event to prevent browser default (opening file)
          if (canUploadRef.current && files.length > 0) {
            // pos is the exact document position where file was dropped
            handleFileUploadRef.current(files, pos);
          }
        },
        onPaste: (_currentEditor, files) => {
          // Always handle the event to prevent browser default
          if (canUploadRef.current && files.length > 0) {
            // For paste, insert at current selection
            handleFileUploadRef.current(files);
          }
        },
      }),
    ],
    content: content ? JSON.parse(content) : undefined,
    editable,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[100px] px-3 py-2",
          !editable && "min-h-0 p-0",
        ),
      },
      // Prevent browser's default behavior for file drops (especially images)
      // FileHandler will handle the actual upload via its onDrop callback
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false; // Let ProseMirror handle internal moves

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
          // Check if any of the files are types we handle
          const hasHandledFiles = Array.from(files).some(
            (file) => file.type.startsWith("image/") || file.type.startsWith("video/") || file.type,
          );
          if (hasHandledFiles) {
            // Prevent browser from opening the file
            // FileHandler extension will process it via onDrop callback
            event.preventDefault();
            return false; // Let FileHandler process the files
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(JSON.stringify(editor.getJSON()));
      }
    },
    // Prevent SSR hydration issues
    immediatelyRender: false,
  });

  // Keep ref in sync with editor
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Sync editor content when prop changes (e.g., when form is reset)
  useEffect(() => {
    if (!editor) return;

    const newContent = content ? JSON.parse(content) : null;
    const currentContent = editor.getJSON();

    // Only update if content actually changed (compare serialized versions)
    if (JSON.stringify(newContent) !== JSON.stringify(currentContent)) {
      editor.commands.setContent(newContent);
    }
  }, [editor, content]);

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFileUpload(files);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  if (!editor) {
    return null;
  }

  // Read-only mode: just render the content without toolbar or border
  if (!editable) {
    return (
      <div className={cn("rich-text-content", className)}>
        <EditorContent editor={editor} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background",
        className,
      )}
    >
      <Toolbar
        editor={editor}
        onAttachClick={handleAttachClick}
        isUploading={isUploading}
        canUpload={canUpload}
      />
      <EditorContent editor={editor} />
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
  );
}

// Helper to check if content is empty
export function isRichTextEmpty(content: string | undefined): boolean {
  if (!content) return true;
  try {
    const json = JSON.parse(content);
    if (!json.content || json.content.length === 0) return true;

    // Recursively check if there's any meaningful content
    function hasContent(nodes: unknown[]): boolean {
      for (const node of nodes) {
        if (typeof node !== "object" || node === null) continue;
        const n = node as {
          type?: string;
          content?: unknown[];
          text?: string;
          attrs?: Record<string, unknown>;
        };

        // Images, file attachments, and video embeds are meaningful content
        if (
          n.type === "image" ||
          n.type === "fileAttachment" ||
          n.type === "loomEmbed" ||
          n.type === "youtubeEmbed"
        ) {
          return true;
        }

        // Text nodes with actual text
        if (n.text && n.text.trim().length > 0) {
          return true;
        }

        // Recursively check children
        if (n.content && hasContent(n.content)) {
          return true;
        }
      }
      return false;
    }

    return !hasContent(json.content);
  } catch {
    return true;
  }
}
