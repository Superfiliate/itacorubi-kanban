import { getBoardPassword } from "@/lib/board-password"
import { decrypt, encrypt } from "@/lib/encryption"

const DECRYPT_FALLBACK = "❌ Decryption Error"

export async function getBoardPasswordOptional(boardId: string): Promise<string | null> {
  return getBoardPassword(boardId)
}

export async function requireBoardPassword(boardId: string): Promise<string> {
  const password = await getBoardPassword(boardId)
  if (!password) {
    throw new Error("Board password not set")
  }
  return password
}

export async function encryptForBoard(boardId: string, value: string): Promise<string> {
  const password = await requireBoardPassword(boardId)
  return encrypt(value, password)
}

export async function encryptWithPassword(password: string, value: string): Promise<string> {
  return encrypt(value, password)
}

export async function decryptRequired(
  encrypted: string,
  password: string
): Promise<string | null> {
  try {
    return await decrypt(encrypted, password)
  } catch {
    return null
  }
}

export async function decryptWithFallback(
  encrypted: string,
  password: string,
  fallback: string = DECRYPT_FALLBACK
): Promise<string> {
  const value = await decryptRequired(encrypted, password)
  return value ?? fallback
}

