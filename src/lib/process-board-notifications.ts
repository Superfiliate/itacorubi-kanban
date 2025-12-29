import { db } from "@/db";
import { pendingNotifications, sentEmails } from "@/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { render } from "@react-email/render";
import { TaskDigestEmail, type NotificationItem } from "@/emails/task-digest";
import { Resend } from "resend";
import { env } from "@/lib/validate-env";

// Initialize Resend client if API key is present
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

// Production domain for email links
const PRODUCTION_DOMAIN = "https://itacorubi.com";

/**
 * Determine base URL for email links.
 * Uses the production domain for Vercel production, VERCEL_URL for preview deployments,
 * and localhost for local development.
 */
function getBaseUrl(): string {
  if (env.VERCEL_ENV === "production") return PRODUCTION_DOMAIN;
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  return "http://localhost:5800";
}

// Hardcoded "from" email address for notifications
const FROM_EMAIL = "noreply@notifications.itacorubi.com";

export interface ProcessBoardNotificationsResult {
  processed: number;
  sentToResend: number;
  failed: number;
  skippedNoEmail: number;
  errors: Array<{ recipientId: string; error: string }>;
}

/**
 * Process pending notifications for a single board.
 *
 * This function:
 * 1. Fetches pending notifications for the given board
 * 2. Groups them by recipient
 * 3. Renders and saves email digests to sent_emails table
 * 4. Sends via Resend if API key is configured
 * 5. Cleans up processed notifications
 *
 * Configuration (baseUrl, fromEmail, Resend client) is determined automatically from env.
 *
 * @param boardId - The board ID to process notifications for
 * @returns Detailed results of the processing
 */
export async function processBoardNotifications(
  boardId: string,
): Promise<ProcessBoardNotificationsResult> {
  const baseUrl = getBaseUrl();

  // Fetch pending notifications for this board
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
    return { processed: 0, sentToResend: 0, failed: 0, skippedNoEmail: 0, errors: [] };
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

  // Track results
  const processedNotificationIds: string[] = [];
  const errors: Array<{ recipientId: string; error: string }> = [];
  let processed = 0;
  let sentToResend = 0;
  let failed = 0;

  // Process emails for each recipient
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

    const boardUrl = `${baseUrl}/boards/${board.id}`;
    const subject = `Task updates on ${board.title}`;

    try {
      // Render email to HTML
      const htmlContent = await render(
        TaskDigestEmail({
          recipientName: recipient.name,
          boardTitle: board.title,
          boardUrl,
          notifications: emailNotifications,
        }),
      );

      // Determine if we'll send via Resend
      const willSendToResend = Boolean(resend);

      // Save to sent_emails table
      await db.insert(sentEmails).values({
        id: crypto.randomUUID(),
        fromEmail: FROM_EMAIL,
        recipientEmail: recipient.email!,
        recipientName: recipient.name,
        subject,
        boardId: board.id,
        boardTitle: board.title,
        htmlContent,
        notificationIds: JSON.stringify(items.map((n) => n.id)),
        sentToResend: willSendToResend,
      });

      // Send via Resend if client is available
      if (resend) {
        await resend.emails.send({
          from: `Kanban Board <${FROM_EMAIL}>`,
          to: recipient.email!,
          subject,
          html: htmlContent,
        });
        sentToResend++;
      }

      processed++;
      processedNotificationIds.push(...items.map((n) => n.id));
    } catch (error) {
      console.error(`Failed to process email for ${recipient.email}:`, error);
      failed++;
      errors.push({
        recipientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Delete successfully processed notifications
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

  // Delete notifications for recipients without email (no point keeping them)
  const notificationsWithoutEmail = notifications.filter((n) => !n.recipient.email);
  const skippedNoEmail = notificationsWithoutEmail.length;

  if (skippedNoEmail > 0) {
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

  return { processed, sentToResend, failed, skippedNoEmail, errors };
}
