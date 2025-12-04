# ADR 004: Rich-Text Editor

We use **Tiptap** as our rich-text editor for comments.

## Decision

- Tiptap is a headless, framework-agnostic rich-text editor built on ProseMirror
- We use `@tiptap/react`, `@tiptap/starter-kit`, and `@tiptap/pm`

## Rationale

- **Headless architecture**: No default UI, allowing us to style everything with shadcn/ui components and Tailwind
- **Starter Kit**: Includes all common formatting (bold, italic, code, lists, etc.) out of the box
- **Single component**: Same editor works for create, edit, and read-only display modes
- **Lightweight**: Only import the extensions you need
- **Battle-tested**: ProseMirror-based, used by Notion, GitLab, and others
- **Great React integration**: Hooks like `useEditor` make it easy to integrate

## Alternatives Considered

- **Novel**: Built on Tiptap but more opinionated, Notion-like editor. Too heavy for simple comments.
- **react-markdown + textarea**: Lighter but requires separate components for editing vs viewing, less user-friendly for non-technical users.
- **Plate**: Another ProseMirror-based editor. More complex setup, heavier bundle.

## Storage Format

- Content is stored as JSON (Tiptap's native format)
- Stored in the existing `content: text` column in SQLite
- Example: `{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hello"}]}]}`

## Implementation

- `src/components/ui/rich-text-editor.tsx`: Reusable editor component
- `src/app/globals.css`: ProseMirror/Tiptap prose styles
