import { NextResponse } from "next/server";
import { db } from "@/db";
import { sentEmails, pendingNotifications } from "@/db/schema";
import { desc, inArray } from "drizzle-orm";
import { render } from "@react-email/render";
import { TaskDigestEmail, type NotificationItem } from "@/emails/task-digest";

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

// HEAD - Check if dev email API is accessible (for client-side feature detection)
export async function HEAD() {
  if (!isDevOrTest()) {
    return new NextResponse(null, { status: 404 });
  }
  return new NextResponse(null, { status: 200 });
}

// GET - List all sent emails
export async function GET() {
  if (!isDevOrTest()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const emails = await db
    .select({
      id: sentEmails.id,
      fromEmail: sentEmails.fromEmail,
      recipientEmail: sentEmails.recipientEmail,
      recipientName: sentEmails.recipientName,
      subject: sentEmails.subject,
      boardId: sentEmails.boardId,
      boardTitle: sentEmails.boardTitle,
      sentToResend: sentEmails.sentToResend,
      createdAt: sentEmails.createdAt,
    })
    .from(sentEmails)
    .orderBy(desc(sentEmails.createdAt));

  return NextResponse.json({ emails });
}

// DELETE - Clear all sent emails
export async function DELETE() {
  if (!isDevOrTest()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(sentEmails);

  return NextResponse.json({ message: "All sent emails cleared" });
}

// POST - Trigger the notification cron (process pending notifications)
export async function POST() {
  if (!isDevOrTest()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    // Fetch all pending notifications with related data
    const notifications = await db.query.pendingNotifications.findMany({
      with: {
        recipient: true,
        triggeredBy: true,
        task: true,
        board: true,
      },
    });

    if (notifications.length === 0) {
      return NextResponse.json({ message: "No pending notifications", processed: 0 });
    }

    // Group notifications by recipient
    const notificationsByRecipient = new Map<
      string,
      {
        recipient: (typeof notifications)[0]["recipient"];
        board: (typeof notifications)[0]["board"];
        items: typeof notifications;
      }
    >();

    for (const notification of notifications) {
      const recipientId = notification.recipientId;

      // Skip if recipient has no email
      if (!notification.recipient.email) {
        continue;
      }

      if (!notificationsByRecipient.has(recipientId)) {
        notificationsByRecipient.set(recipientId, {
          recipient: notification.recipient,
          board: notification.board,
          items: [],
        });
      }

      notificationsByRecipient.get(recipientId)!.items.push(notification);
    }

    // Process emails for each recipient
    const processedNotificationIds: string[] = [];
    let processedCount = 0;

    for (const [, data] of notificationsByRecipient) {
      const { recipient, board, items } = data;

      // Build notification items for email template
      const emailNotifications: NotificationItem[] = items.map((n) => {
        let metadata: NotificationItem["metadata"];
        if (n.metadata) {
          try {
            metadata = JSON.parse(n.metadata);
          } catch {
            metadata = undefined;
          }
        }

        return {
          id: n.id,
          type: n.type,
          taskId: n.taskId,
          taskTitle: n.task.title,
          triggeredByName: n.triggeredBy?.name,
          metadata,
          createdAt: n.createdAt ?? new Date(),
        };
      });

      // Determine the board URL
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5800";
      const boardUrl = `${baseUrl}/boards/${board.id}`;

      const fromEmail = process.env.EMAIL_FROM || "notifications@resend.dev";
      const subject = `Task updates on ${board.title}`;

      // Render email to HTML
      const htmlContent = await render(
        TaskDigestEmail({
          recipientName: recipient.name,
          boardTitle: board.title,
          boardUrl,
          notifications: emailNotifications,
        }),
      );

      // Save to sent_emails table (never send to Resend in dev/test)
      await db.insert(sentEmails).values({
        id: crypto.randomUUID(),
        fromEmail,
        recipientEmail: recipient.email!,
        recipientName: recipient.name,
        subject,
        boardId: board.id,
        boardTitle: board.title,
        htmlContent,
        notificationIds: JSON.stringify(items.map((n) => n.id)),
        sentToResend: false,
      });

      processedNotificationIds.push(...items.map((n) => n.id));
      processedCount++;
    }

    // Delete processed notifications
    if (processedNotificationIds.length > 0) {
      await db
        .delete(pendingNotifications)
        .where(inArray(pendingNotifications.id, processedNotificationIds));
    }

    // Delete notifications for recipients without email
    const notificationsWithoutEmail = notifications.filter((n) => !n.recipient.email);
    if (notificationsWithoutEmail.length > 0) {
      await db
        .delete(pendingNotifications)
        .where(
          inArray(
            pendingNotifications.id,
            notificationsWithoutEmail.map((n) => n.id),
          ),
        );
    }

    return NextResponse.json({
      message: "Notifications processed",
      processed: processedCount,
      skippedNoEmail: notificationsWithoutEmail.length,
    });
  } catch (error) {
    console.error("Error processing notifications:", error);
    return NextResponse.json(
      { error: "Failed to process notifications" },
      { status: 500 },
    );
  }
}
