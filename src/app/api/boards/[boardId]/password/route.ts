import { NextRequest, NextResponse } from "next/server"
import { requireBoardPassword } from "@/lib/secure-board"

interface RouteParams {
  params: Promise<{ boardId: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { boardId } = await params

  let password: string
  try {
    password = await requireBoardPassword(boardId)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json({ password })
}
