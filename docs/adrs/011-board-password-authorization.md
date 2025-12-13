# ADR 011: Board Password Authorization (No Encryption)

## Context

Boards feel safer when they are password-protected, but full at-rest encryption added substantial complexity to reads/writes and slowed iteration.

We still want the password to be used **thoroughly** as an authorization gate for all board actions.

## Decision

**Boards are password-protected, but board content is stored in plaintext.**

- We store a **password hash** on the board record.
- We store the **password itself** only in an **HTTP-only cookie** for convenience.
- On every server read/write, we verify the cookie password against the stored hash before allowing access.

### Password Strategy

- **Hashing**: `scrypt` (salted, parameterized) stored as a single encoded string
- **Password Storage**: HTTP-only cookies (for UX; never store raw password in DB)
- **Cookie Name**: `board-{boardId}-password`

### Stored Fields

All text fields are stored in plaintext (not encrypted):

- `boards.title`
- `columns.name`
- `tasks.title`
- `contributors.name`
- `comments.content`

### Password Management

- **Board Creation**: User must set a password (suggested password provided)
- **Password Verification**: Cookie password is verified against `boards.passwordHash`
- **Access Control**: Password entry page (`/boards/{boardId}/unlock`) required before accessing board
- **Sharing**: Share dialog provides URL + password, or public link with password embedded

### Public Links

Public links allow sharing a board with password prefilled:
- URL format: `/boards/{id}/unlock?password={password}`
- Redirects to unlock page with password prefilled in the form
- User must still click "Unlock Board" button (no auto-unlock)
- Password is visible in URL - treat as sensitive information

## Implementation Details

### Password Hashing (`src/lib/password-hash.ts`)

- `hashPassword(password)` → encoded hash string
- `verifyPassword(password, storedHash)` → boolean

### Access Helpers (`src/lib/secure-board.ts`)

- `getBoardPasswordOptional(boardId)` → returns cookie password only if it verifies against `boards.passwordHash`
- `requireBoardPassword(boardId)` / `requireBoardAccess(boardId)` → throws if missing/invalid
- Prefer these helpers in server actions instead of ad-hoc cookie reads to keep behavior consistent.

### Cookie Helpers (`src/lib/board-password.ts`)

- `getBoardPassword(boardId)` → password from cookie or null
- `setBoardPassword(boardId, password)` → set HTTP-only cookie
- `clearBoardPassword(boardId)` → remove cookie

### Server Actions Pattern

**Read Operations:**
1. Fetch data from database
2. Verify access via `requireBoardAccess(boardId)`
3. Return data

**Write Operations:**
1. Verify access via `requireBoardAccess(boardId)`
2. Verify record ownership (e.g. task/comment/column belongs to board)
3. Insert/update plaintext data

## Security Considerations

- **Password never stored in DB**: only a salted password hash
- **Cookie is not enough**: cookie password must verify against the stored hash on every action
- **Ownership checks**: server actions must verify the mutated entity belongs to the board (don’t trust `boardId` passed from the client)
- **Public Links**: Password embedded in URL (`/boards/{id}/unlock?password={password}`) - treat as sensitive

## Consequences

### Positive

- Much simpler read/write code paths
- Password is used consistently as an authorization gate
- Password is never stored in plaintext in the database
- HTTP-only cookies prevent XSS attacks
- Public links prefilled but require explicit unlock action

### Negative

- Data is not encrypted at rest (plaintext in database)
- Public links expose password in URL
- Password lost = board becomes inaccessible (no recovery mechanism)

## Notes

- Cookie expiration: 1 year (long-lived for convenience)
