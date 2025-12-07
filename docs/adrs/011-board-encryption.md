# ADR 011: Board Password Encryption

## Context

Boards contain sensitive information that should be protected. We need a way to encrypt board data so that only users with the correct password can access it.

## Decision

**All board text content is encrypted using AES-256-GCM with a board-specific password stored in HTTP-only cookies.**

### Encryption Strategy

- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Derivation**: PBKDF2 with SHA-256, 100,000 iterations
- **Storage Format**: Base64-encoded `iv:authTag:ciphertext`
- **Password Storage**: HTTP-only cookies (never in database)
- **Cookie Name**: `board-{boardId}-password`

### Encrypted Fields

All text fields are encrypted:
- `boards.title`
- `columns.name`
- `tasks.title`
- `contributors.name`
- `comments.content`

### Password Management

- **Board Creation**: User must set a password (suggested password provided)
- **Password Verification**: Encrypted verification string stored in `boards.encryptedVerification`
- **Access Control**: Password entry page (`/boards/{boardId}/unlock`) required before accessing board
- **Sharing**: Share dialog provides URL + password, or public link with password embedded

### Legacy Support

Boards created before encryption (without `encryptedVerification`) are treated as legacy:
- No password required
- Data returned as-is (not decrypted)
- Detection: Check if data contains `:` (encryption format separator)

## Implementation Details

### Encryption Utilities (`src/lib/encryption.ts`)

- `encrypt(text, password)` → encrypted string
- `decrypt(encrypted, password)` → plain text (throws on wrong password)
- `generatePassword()` → secure random 16-character password

### Cookie Helpers (`src/lib/board-password.ts`)

- `getBoardPassword(boardId)` → password from cookie or null
- `setBoardPassword(boardId, password)` → set HTTP-only cookie
- `clearBoardPassword(boardId)` → remove cookie

### Server Actions Pattern

**Read Operations:**
1. Fetch data from database
2. Check if encrypted (contains `:`)
3. If encrypted: get password from cookie, decrypt
4. If legacy: return as-is

**Write Operations:**
1. Get password from cookie
2. Encrypt data before insert/update
3. Store encrypted data

## Security Considerations

- **Password Never Stored**: Only in HTTP-only cookies (not in database)
- **Authenticated Encryption**: AES-GCM provides both confidentiality and authenticity
- **Key Derivation**: PBKDF2 makes brute-force attacks harder
- **Static Salt**: Acceptable trade-off since password provides security
- **Public Links**: Password embedded in URL (`/boards/{id}/public/{password}`) - treat as sensitive

## Consequences

### Positive

- Data encrypted at rest (in database)
- Password never stored in database
- HTTP-only cookies prevent XSS attacks
- Legacy boards continue to work

### Negative

- Password lost = data lost (no recovery mechanism)
- Public links expose password in URL
- Encryption/decryption overhead on every read/write
- Legacy detection heuristic (checking for `:`) is not foolproof

## Notes

- Password verification uses a known string encrypted with the password
- Wrong password causes decryption to fail (AES-GCM authentication error)
- Cookie expiration: 1 year (long-lived for convenience)
