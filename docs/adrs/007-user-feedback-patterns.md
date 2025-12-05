# ADR 007: User Feedback Patterns

## Context

Users need clear feedback when performing actions (create, delete, update) to understand what happened and feel confident the action succeeded.

## Decisions

### Toast Notifications (Sonner)

Use the `sonner` library for toast notifications. Toasts are configured in `src/components/ui/sonner.tsx` and added to the app via `ThemeProvider`.

**When to use toasts:**
- Successful create operations: "Task created", "Column created", "Comment added"
- Successful delete operations: "Task deleted", "Column deleted", "Comment deleted"
- Error feedback: "Cannot delete column with tasks"

**How to use:**

```tsx
import { toast } from "sonner"

// Success toast
toast.success("Task created")

// Error toast
toast.error("Cannot delete column with tasks")
```

**Styling:** Toasts automatically adapt to the current theme (light/dark).

### Confirmation Dialogs

Use shadcn/ui `Dialog` component for destructive actions that cannot be undone.

**When to use confirmation dialogs:**
- Deleting tasks
- Deleting columns
- Deleting comments
- Any irreversible action

**Pattern:**

```tsx
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
const [isDeleting, setIsDeleting] = useState(false)

const handleDelete = async () => {
  setIsDeleting(true)
  await deleteItem(id)
  toast.success("Item deleted")
  setIsDeleting(false)
  setIsDeleteDialogOpen(false)
}

// Trigger button
<Button onClick={() => setIsDeleteDialogOpen(true)}>Delete</Button>

// Dialog
<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete Item</DialogTitle>
      <DialogDescription>
        Are you sure you want to delete this item? This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button
        variant="ghost"
        onClick={() => setIsDeleteDialogOpen(false)}
        disabled={isDeleting}
      >
        Cancel
      </Button>
      <Button
        variant="destructive"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        Delete
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Key points:**
- Always disable buttons while submitting to prevent double-clicks
- Use `variant="destructive"` for the delete action button
- Provide clear description of what will happen

### Empty States

Show helpful empty states when lists are empty to guide users.

**Pattern:**

```tsx
import { SomeIcon } from "lucide-react"

if (items.length === 0) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <SomeIcon className="h-16 w-16 text-muted-foreground/50" />
      <div className="text-center">
        <h3 className="text-lg font-medium">No items yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your first item to get started
        </p>
      </div>
      <AddButton />
    </div>
  )
}
```
