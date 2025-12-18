# ADR 004: Rich-Text Editor

We use **Tiptap** for comment editing and display.

- Headless, ProseMirror-based, works with our own UI styling
- Starter Kit covers the formatting we need without custom extensions
- One component can handle edit and read-only modes
- Content is stored as Tiptap JSON in the `content` text column

Keep implementation minimal: prefer built-in extensions, keep the toolbar lean, and only add styling needed for readability. Alternative editors are acceptable only if they stay lightweight and preserve JSON storage.

## Examples

Storage format:

```json
{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hello"}]}]}
```

## Links

- Component: `src/components/ui/rich-text-editor.tsx`
