import * as React from "react";

export type NotificationItem = {
  id: string;
  type: "comment" | "move" | "assign" | "priority";
  taskId: string;
  taskTitle: string;
  triggeredByName?: string;
  metadata?: {
    fromColumn?: string;
    toColumn?: string;
    priority?: string;
    commentPreview?: string;
  };
  createdAt: Date;
};

export type TaskDigestEmailProps = {
  recipientName: string;
  boardTitle: string;
  boardUrl: string;
  notifications: NotificationItem[];
};

function formatNotification(notification: NotificationItem): string {
  const { type, triggeredByName, metadata } = notification;
  const actor = triggeredByName || "Someone";

  switch (type) {
    case "comment":
      return `${actor} commented${metadata?.commentPreview ? `: "${metadata.commentPreview}"` : ""}`;
    case "move":
      if (metadata?.fromColumn && metadata?.toColumn) {
        return `${actor} moved task from "${metadata.fromColumn}" to "${metadata.toColumn}"`;
      }
      return `${actor} moved the task`;
    case "assign":
      return `${actor} assigned you to this task`;
    case "priority":
      return `${actor} changed priority to ${metadata?.priority || "unknown"}`;
    default:
      return `${actor} updated the task`;
  }
}

export function TaskDigestEmail({
  recipientName,
  boardTitle,
  boardUrl,
  notifications,
}: TaskDigestEmailProps) {
  // Group notifications by task
  const notificationsByTask = notifications.reduce(
    (acc, notification) => {
      const key = notification.taskId;
      if (!acc[key]) {
        acc[key] = {
          taskTitle: notification.taskTitle,
          taskId: notification.taskId,
          items: [],
        };
      }
      acc[key].items.push(notification);
      return acc;
    },
    {} as Record<string, { taskTitle: string; taskId: string; items: NotificationItem[] }>,
  );

  const taskGroups = Object.values(notificationsByTask);

  return (
    <div
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        maxWidth: "600px",
        margin: "0 auto",
        padding: "20px",
        backgroundColor: "#ffffff",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "600", color: "#111827", margin: "0 0 8px 0" }}>
          Task Updates
        </h1>
        <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
          Hi {recipientName}, here&apos;s what happened on{" "}
          <strong style={{ color: "#111827" }}>{boardTitle}</strong>
        </p>
      </div>

      {/* Task groups */}
      {taskGroups.map((group) => (
        <div
          key={group.taskId}
          style={{
            marginBottom: "20px",
            padding: "16px",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}
        >
          <a
            href={`${boardUrl}?task=${group.taskId}`}
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#2563eb",
              textDecoration: "none",
              display: "block",
              marginBottom: "12px",
            }}
          >
            {group.taskTitle}
          </a>
          <ul style={{ margin: 0, padding: "0 0 0 16px", listStyleType: "disc" }}>
            {group.items.map((notification) => (
              <li
                key={notification.id}
                style={{
                  fontSize: "14px",
                  color: "#374151",
                  marginBottom: "4px",
                }}
              >
                {formatNotification(notification)}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Footer */}
      <div
        style={{
          marginTop: "32px",
          paddingTop: "16px",
          borderTop: "1px solid #e5e7eb",
          fontSize: "12px",
          color: "#9ca3af",
        }}
      >
        <p style={{ margin: "0 0 8px 0" }}>
          You received this email because you are assigned to or a stakeholder on these tasks.
        </p>
        <p style={{ margin: 0 }}>
          To stop receiving notifications, remove your email from your contributor profile on the
          board.
        </p>
      </div>
    </div>
  );
}


