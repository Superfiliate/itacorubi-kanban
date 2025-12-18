# Feature: Tags

## Overview

Tags are labels that can be assigned to tasks within a board. Each tag has a name and a randomly assigned color for visual identification. Tags help categorize and organize tasks.

## User Flows

### Assign Existing Tag

- Open task sidebar
- Click tags dropdown
- Select from existing tags
- Checkbox toggles assignment on/off

### Create and Assign New Tag

- Open task sidebar
- Click tags dropdown
- Type new name in search field
- Press Enter or click "Create {name}" option
- Tag created with random color and immediately assigned

### Remove Tag from Task

- **Option A**: Click `X` on tag badge in sidebar
- **Option B**: Uncheck tag in dropdown

### View Tag Assignments

- Tag badges appear on:
  - Task sidebar (full badges with remove button)
  - Tags dropdown (with checkboxes)

### Manage Tags

- Click tags button (`Tag` icon) in board header
- Tags dialog opens showing all tags for the board
- Edit tag name by clicking on it
- Change tag color by clicking color swatch
- Delete tag (only if no tasks reference it)
- Create new tag using form at bottom

## Notes

- Tags are scoped to a board — each board has its own tag list
- **Tag names always start with "#"** — the system automatically prepends "#" if missing when creating or editing tags
- Colors are randomly assigned from a palette of 17 colors (same as contributors)
- Colors help visually scan tasks by category
- Tag names should be unique within a board
- Tags can only be deleted when no tasks reference them

## Implementation Notes

Color utilities are centralized in `src/lib/tag-colors.ts`:

- `getRandomTagColor()` — use when creating new tags
- `tagColorStyles` — badge styles for each color (reuses contributor colors)
- `tagColorSwatches` — solid swatches for the color picker (reuses contributor colors)

The palette itself is defined in `src/db/schema.ts` as `CONTRIBUTOR_COLORS` (shared with contributors).

Tag name normalization is handled by `src/lib/tag-utils.ts`:

- `ensureTagHasHash(name)` — ensures tag name starts with "#" (used in all create/update operations)
- `removeTagHash(name)` — helper to remove "#" prefix if needed
