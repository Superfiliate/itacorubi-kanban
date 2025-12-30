# ADR 009: Random UUID Identifiers

## Context

This application has no authentication system. Anyone with a board's URL can access and modify it. This design choice makes the application simple and frictionless, but it also means we need to prevent unauthorized access through other means.

Without authentication, the primary defense against unauthorized access is **obscurity of identifiers**. If an attacker could guess or enumerate IDs, they could:

- Access boards they weren't meant to see
- Modify tasks on boards they don't know about
- Impersonate contributors by guessing their IDs
- Delete or manipulate comments

## Decision

**All entity identifiers MUST be random UUIDs generated using `crypto.randomUUID()`.**

This applies to:

- Boards
- Columns
- Tasks
- Contributors
- Comments
- Any future entities

## Implementation

```ts
// CORRECT: Use crypto.randomUUID() for all IDs
const id = crypto.randomUUID()

// INCORRECT: Never use sequential or predictable IDs
const id = nextSequentialId++  // ❌ Enumerable
const id = Date.now().toString() // ❌ Predictable
const id = slugify(title)        // ❌ Guessable
```

## Rationale

### Why UUIDs?

- **UUIDv4** (random) provides 122 bits of randomness
- Probability of guessing a valid UUID is ~1 in 5.3×10^36
- Practically impossible to enumerate or brute-force

### Why `crypto.randomUUID()`?

- Uses cryptographically secure random number generator
- Native to Node.js and browsers (no external dependencies)
- Generates compliant UUIDv4 strings

### Security Model

Since the UUID acts as both an identifier and an access token:

| Entity              | UUID acts as                                                     |
| ------------------- | ---------------------------------------------------------------- |
| Board               | Access token to view/modify the entire board                     |
| Contributor         | Identity token for that contributor's actions                    |
| Task/Column/Comment | Part of the board's internal structure (protected by board UUID) |

## Consequences

### Positive

- No authentication required for basic security
- URLs are shareable but not guessable
- Simple permission model: if you know the UUID, you have access

### Negative

- URLs must be treated as secrets (don't share publicly)
- No way to revoke access once a URL is shared
- Lost URLs mean lost access (no recovery mechanism)

## Notes

- This security model is similar to Google Docs "anyone with the link" sharing
- Board URLs should be shared only with trusted collaborators
- Consider adding optional authentication in the future for sensitive use cases
