import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from "crypto"

// Static salt for PBKDF2 (since we can't store per-board salts without the password)
// This is acceptable because the password itself provides the security
const PBKDF2_SALT = Buffer.from("itacorubi-kanban-salt-v1", "utf-8")
const PBKDF2_ITERATIONS = 100000
const KEY_LENGTH = 32 // 256 bits for AES-256
const IV_LENGTH = 12 // 96 bits for GCM
const ALGORITHM = "aes-256-gcm"

/**
 * Derives a 256-bit key from a password using PBKDF2
 */
function deriveKey(password: string): Buffer {
  return pbkdf2Sync(password, PBKDF2_SALT, PBKDF2_ITERATIONS, KEY_LENGTH, "sha256")
}

/**
 * Encrypts text using AES-256-GCM
 * Returns base64-encoded string in format: "iv:authTag:ciphertext"
 */
export async function encrypt(text: string, password: string): Promise<string> {
  const key = deriveKey(password)
  const iv = randomBytes(IV_LENGTH)

  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, "utf-8", "base64")
  encrypted += cipher.final("base64")

  const authTag = cipher.getAuthTag()

  // Format: iv:authTag:ciphertext (all base64)
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`
}

/**
 * Decrypts text encrypted with encrypt()
 * Throws an error if the password is incorrect (GCM authentication fails)
 */
export async function decrypt(encrypted: string, password: string): Promise<string> {
  const parts = encrypted.split(":")
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format")
  }

  const [ivBase64, authTagBase64, ciphertext] = parts

  const key = deriveKey(password)
  const iv = Buffer.from(ivBase64, "base64")
  const authTag = Buffer.from(authTagBase64, "base64")

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(ciphertext, "base64", "utf-8")
  decrypted += decipher.final("utf-8")

  return decrypted
}

/**
 * Generates a secure random password
 * Returns a 16-character alphanumeric string
 */
export function generatePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  const length = 16
  let password = ""

  // Use cryptographically strong randomness; discard high values to avoid bias
  // 62 * 4 = 248, so values >= 248 are skipped
  while (password.length < length) {
    const byte = randomBytes(1)[0]
    if (byte >= 248) continue
    password += chars[byte % chars.length]
  }

  return password
}
