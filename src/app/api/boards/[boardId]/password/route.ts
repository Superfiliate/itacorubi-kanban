import { NextRequest, NextResponse } from "next/server"
import { getBoardPassword } from "@/lib/board-password"

interface RouteParams {
  params: Promise<{ boardId: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { boardId } = await params

  const password = await getBoardPassword(boardId)

  if (!password) {
    return NextResponse.json(
      { error: "Password not found" },
      { status: 404 }
    )
  }

  return NextResponse.json({ password })
}
