# Feature Documentation

Product requirements and user flows (what we build).

> **Start with [../vision.md](../vision.md)** for overall product context before diving into specific features.

## File Naming

Use format: `{prefix}__{name}.md`

| Prefix                                | Domain                |
| ------------------------------------- | --------------------- |
| `board__`, `task__`, `column__`       | Core entities         |
| `comment__`, `contributor__`, `tag__` | Task-related entities |
| `theme__`, `sync__`, `ux__`           | Cross-cutting UX      |
| `email__`, `file__`                   | Integrations          |
| `global__`                            | App-wide              |

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
