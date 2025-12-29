import { NextResponse } from "next/server";
import { db } from "@/db";
import { sentEmails } from "@/db/schema";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Block access in production
// We check for local database (file:*) or non-production NODE_ENV
function isDevOrTest(): boolean {
  // If using a local SQLite file, we're in dev/test mode
  const dbUrl = process.env.TURSO_DATABASE_URL || "";
  if (dbUrl.startsWith("file:")) {
    return true;
  }
  // Also check NODE_ENV as fallback
  return process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
}

// GET - Get single email with full HTML content
export async function GET(_request: Request, { params }: RouteParams) {
  if (!isDevOrTest()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { id } = await params;

  const email = await db.query.sentEmails.findFirst({
    where: eq(sentEmails.id, id),
  });

  if (!email) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  return NextResponse.json({ email });
}
