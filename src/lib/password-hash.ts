import { randomBytes, scryptSync, timingSafeEqual } from "crypto"

const SCRYPT_KEYLEN = 32
const SCRYPT_N = 16384
const SCRYPT_R = 8
const SCRYPT_P = 1
const SALT_BYTES = 16

/**
 * Format: scrypt$N$r$p$saltB64$hashB64
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_BYTES)
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  })

  return [
    "scrypt",
    String(SCRYPT_N),
    String(SCRYPT_R),
    String(SCRYPT_P),
    salt.toString("base64"),
    Buffer.from(hash).toString("base64"),
  ].join("$")
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$")
  if (parts.length !== 6) return false

  const [algo, nStr, rStr, pStr, saltB64, hashB64] = parts
  if (algo !== "scrypt") return false

  const N = Number(nStr)
  const r = Number(rStr)
  const p = Number(pStr)
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false

  let salt: Buffer
  let expected: Buffer
  try {
    salt = Buffer.from(saltB64, "base64")
    expected = Buffer.from(hashB64, "base64")
  } catch {
    return false
  }

  const actual = scryptSync(password, salt, expected.length, { N, r, p })
  if (actual.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(actual), expected)
}
