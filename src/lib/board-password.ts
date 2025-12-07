import { cookies } from "next/headers"

const COOKIE_PREFIX = "board-"
const COOKIE_SUFFIX = "-password"

/**
 * Gets the password for a board from HTTP-only cookie
 * Returns null if cookie doesn't exist
 */
export async function getBoardPassword(boardId: string): Promise<string | null> {
  const cookieStore = await cookies()
  const cookieName = `${COOKIE_PREFIX}${boardId}${COOKIE_SUFFIX}`
  const cookie = cookieStore.get(cookieName)
  return cookie?.value ?? null
}

/**
 * Sets the password for a board in an HTTP-only cookie
 */
export async function setBoardPassword(boardId: string, password: string): Promise<void> {
  const cookieStore = await cookies()
  const cookieName = `${COOKIE_PREFIX}${boardId}${COOKIE_SUFFIX}`

  // Set cookie with long expiration (1 year)
  // HTTP-only, Secure (HTTPS only), SameSite=Strict
  cookieStore.set(cookieName, password, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  })
}

/**
 * Clears the password cookie for a board
 */
export async function clearBoardPassword(boardId: string): Promise<void> {
  const cookieStore = await cookies()
  const cookieName = `${COOKIE_PREFIX}${boardId}${COOKIE_SUFFIX}`
  cookieStore.delete(cookieName)
}
