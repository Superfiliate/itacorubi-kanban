# Product Vision

A collaborative Kanban board for small teams. Simple, fast, no sign-up required.

## Core Principles

- **No authentication friction** — Share a link + password, start collaborating immediately
- **Local-first UX** — Instant interactions, background sync (see `adrs/store__local-first-architecture.md`)
- **Mobile-friendly** — Fully responsive, works on any device
- **Delightful details** — Random emojis, smooth animations, glassmorphism aesthetic

## Data Model

| Entity | Key Fields |
| ------ | ---------- |
| Board | UUID, title, password hash |
| Column | Name, position, collapsed state |
| Task | Title, priority, position, timestamps |
| Contributor | Name, color, optional email |
| Comment | Author, content (rich text), timestamps |
| Tag | Name (with #), color |

**Relationships:**
- Tasks have assignees and stakeholders (both are contributors)
- Comments have an author and optional stakeholder mention
- Contributors can be @mentioned in comments

## Visual Design

### Aesthetic
- **Glassmorphism** — Soft blur, translucent surfaces, subtle borders (see `features/theme__glassmorphism.md`)
- **Light/dark themes** — System-aware with manual toggle
- **Random emojis** — New boards, columns, tasks get a random emoji prefix
- **17-color palette** — For contributors and tags

### Icons
Lucide React throughout: `Plus`, `Trash2`, `Minimize2`/`Maximize2`, etc.

### Feedback Patterns
- Toast notifications for confirmations
- Confirmation dialogs for destructive actions
- Empty states with helpful prompts

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Framework | Next.js (App Router) |
| Database | Turso (SQLite) + Drizzle ORM |
| State | Zustand (local-first store) |
| UI | shadcn/ui + Tailwind CSS |
| Editor | Tiptap (rich text) |
| Drag & Drop | @dnd-kit |
| Email | Resend |
| Testing | Playwright |

## Key ADRs

Start with these for any substantial work:

- `store__local-first-architecture.md` — **Read for any data/mutation work**
- `security__board-password.md` — Auth model, cookie handling
- `testing__playwright-setup.md` — E2E test patterns
