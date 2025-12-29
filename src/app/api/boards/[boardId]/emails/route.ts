import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sentEmails, pendingNotifications } from "@/db/schema";
import { desc, eq, inArray, and } from "drizzle-orm";
import { render } from "@react-email/render";
import { TaskDigestEmail, type NotificationItem } from "@/emails/task-digest";
import { requireBoardAccess } from "@/lib/secure-board";
import { env } from "@/lib/validate-env";

interface RouteParams {
  params: Promise<{ boardId: string }>;
}

// GET - List emails for this board
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { boardId } = await params;

  try {
    await requireBoardAccess(boardId);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    .where(eq(sentEmails.boardId, boardId))
    .orderBy(desc(sentEmails.createdAt));

  return NextResponse.json({ emails });
}

// POST - Process pending notifications for this board
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { boardId } = await params;

  try {
    await requireBoardAccess(boardId);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch pending notifications for this board only
    const notifications = await db.query.pendingNotifications.findMany({
      where: eq(pendingNotifications.boardId, boardId),
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
      const baseUrl = env.NEXT_PUBLIC_BASE_URL || "http://localhost:5800";
      const boardUrl = `${baseUrl}/boards/${board.id}`;

      const fromEmail = env.EMAIL_FROM || "notifications@resend.dev";
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

      // Save to sent_emails table
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
        .where(
          and(
            eq(pendingNotifications.boardId, boardId),
            inArray(pendingNotifications.id, processedNotificationIds),
          ),
        );
    }

    // Delete notifications for recipients without email
    const notificationsWithoutEmail = notifications.filter((n) => !n.recipient.email);
    if (notificationsWithoutEmail.length > 0) {
      await db.delete(pendingNotifications).where(
        and(
          eq(pendingNotifications.boardId, boardId),
          inArray(
            pendingNotifications.id,
            notificationsWithoutEmail.map((n) => n.id),
          ),
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
    return NextResponse.json({ error: "Failed to process notifications" }, { status: 500 });
  }
}
