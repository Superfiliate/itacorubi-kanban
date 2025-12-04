# Feature: Contributors

## Overview

Contributors are people who can be assigned to tasks within a board. Each contributor has a name and a randomly assigned color for visual identification.

## User Flows

### Assign Existing Contributor

- Open task sidebar
- Click assignees dropdown
- Select from existing contributors
- Checkbox toggles assignment on/off

### Create and Assign New Contributor

- Open task sidebar
- Click assignees dropdown
- Type new name in search field
- Press Enter or click "Create {name}" option
- Contributor created with random color and immediately assigned

### Remove Assignee from Task

- **Option A**: Click `X` on assignee badge in sidebar
- **Option B**: Uncheck contributor in dropdown

### View Contributor Assignments

- Contributor badges appear on:
  - Task cards in the board (compact view)
  - Task sidebar (full badges with remove button)
  - Assignees dropdown (with checkboxes)

## Notes

- Contributors are scoped to a board — each board has its own contributor list
- Colors are randomly assigned from a palette of 17 colors
- Colors help visually scan the board for tasks assigned to specific people
- Contributor names should be unique within a board
