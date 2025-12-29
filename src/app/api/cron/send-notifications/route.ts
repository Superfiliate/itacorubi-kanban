import { NextResponse } from "next/server";
import { db } from "@/db";
import { pendingNotifications, sentEmails } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { Resend } from "resend";
import { TaskDigestEmail, type NotificationItem } from "@/emails/task-digest";
import { render } from "@react-email/render";
import { env } from "@/lib/validate-env";

// Initialize Resend client (may be undefined if no API key)
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

// Determine if we should actually send via Resend
const shouldSendToResend = Boolean(env.RESEND_API_KEY && env.NODE_ENV === "production");

// Verify cron secret to prevent unauthorized calls
function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = env.CRON_SECRET;

  // In development or test, allow without secret
  if (env.NODE_ENV === "development" || env.NODE_ENV === "test") {
    return true;
  }

  // In production, require the secret
  if (!cronSecret) {
    console.warn("CRON_SECRET not configured - cron endpoint is disabled");
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ message: "No pending notifications" });
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
    const results: {
      recipientId: string;
      success: boolean;
      sentToResend: boolean;
      error?: string;
    }[] = [];
    const processedNotificationIds: string[] = [];

    for (const [recipientId, data] of notificationsByRecipient) {
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
      const baseUrl = env.VERCEL_URL
        ? `https://${env.VERCEL_URL}`
        : env.NEXT_PUBLIC_BASE_URL || "http://localhost:5800";
      const boardUrl = `${baseUrl}/boards/${board.id}`;

      // Determine "from" address
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

      try {
        // Always save to sent_emails table
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
          sentToResend: shouldSendToResend,
        });

        // Only send to Resend in production with API key configured
        if (shouldSendToResend && resend) {
          await resend.emails.send({
            from: `Kanban Board <${fromEmail}>`,
            to: recipient.email!,
            subject,
            html: htmlContent,
          });
        }

        results.push({ recipientId, success: true, sentToResend: shouldSendToResend });
        processedNotificationIds.push(...items.map((n) => n.id));
      } catch (error) {
        console.error(`Failed to process email for ${recipient.email}:`, error);
        results.push({
          recipientId,
          success: false,
          sentToResend: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Delete successfully processed notifications
    if (processedNotificationIds.length > 0) {
      await db
        .delete(pendingNotifications)
        .where(inArray(pendingNotifications.id, processedNotificationIds));
    }

    // Also delete notifications for recipients without email (no point keeping them)
    const notificationsWithoutEmail = notifications.filter((n) => !n.recipient.email);
    if (notificationsWithoutEmail.length > 0) {
      await db.delete(pendingNotifications).where(
        inArray(
          pendingNotifications.id,
          notificationsWithoutEmail.map((n) => n.id),
        ),
      );
    }

    return NextResponse.json({
      message: "Notifications processed",
      processed: results.filter((r) => r.success).length,
      sentToResend: results.filter((r) => r.sentToResend).length,
      failed: results.filter((r) => !r.success).length,
      skippedNoEmail: notificationsWithoutEmail.length,
    });
  } catch (error) {
    console.error("Error processing notifications:", error);
    return NextResponse.json({ error: "Failed to process notifications" }, { status: 500 });
  }
}
