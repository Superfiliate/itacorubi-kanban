import { cookies } from "next/headers";
import { env } from "@/lib/validate-env";

const COOKIE_PREFIX = "board-";
const COOKIE_SUFFIX = "-password";

/**
 * Gets the password for a board from HTTP-only cookie
 * Returns null if cookie doesn't exist
 */
export async function getBoardPassword(boardId: string): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieName = `${COOKIE_PREFIX}${boardId}${COOKIE_SUFFIX}`;
  const cookie = cookieStore.get(cookieName);
  return cookie?.value ?? null;
}

/**
 * Sets the password for a board in an HTTP-only cookie
 */
export async function setBoardPassword(boardId: string, password: string): Promise<void> {
  const cookieStore = await cookies();
  const cookieName = `${COOKIE_PREFIX}${boardId}${COOKIE_SUFFIX}`;

  // Set cookie with long expiration (1 year)
  // HTTP-only, Secure (HTTPS only), SameSite=Lax (allows email link navigation)
  const options = {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  } as const;

  cookieStore.set(cookieName, password, options);
}

/**
 * Clears the password cookie for a board
 */
export async function clearBoardPassword(boardId: string): Promise<void> {
  const cookieStore = await cookies();
  const cookieName = `${COOKIE_PREFIX}${boardId}${COOKIE_SUFFIX}`;
  cookieStore.delete(cookieName);
}
