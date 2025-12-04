# Features Documentation

This folder contains user flows and feature documentation organized **by model/entity**.

## Organization

Each feature file focuses on a single model and its interactions:

| File | Model | Scope |
|------|-------|-------|
| `000-overview.md` | — | App overview, data model, visual design, tech notes |
| `001-homepage.md` | — | Landing page, entry points |
| `002-boards.md` | Board | Create, access, rename, delete |
| `003-columns.md` | Column | Add, rename, reorder, collapse/expand, delete |
| `004-tasks.md` | Task | Create, view/edit, move, delete |
| `005-contributors.md` | Contributor | Assign, create, remove, colors |
| `006-comments.md` | Comment | Add, edit, delete, author memory, age indicators |

## File Structure

Each feature file should follow this structure:

```markdown
# Feature: {Model Name}

## Overview
Brief description of what this model represents and its role in the app.

## User Flows

### {Action Name}
- Step-by-step bullet points
- Keep it clear and succinct
- Include UI elements in backticks (`Button Name`)
- Include URLs in parentheses (`/path/{param}`)

### {Another Action}
- ...

## Notes (optional)
Any model-specific technical notes or edge cases.
```

## Writing Guidelines

1. **Be succinct** — Use bullet points, not paragraphs
2. **Be specific** — Include button names, URLs, field names
3. **Be complete** — Cover happy path and important edge cases
4. **Be consistent** — Follow the same format across all files

## Example User Flow

```markdown
### Create Task
- Click "Add task" button at top of column
- Task created with "{emoji} New task" title
- Sidebar automatically opens for editing
- URL updates to `/boards/{boardId}/tasks/{taskId}`
```
