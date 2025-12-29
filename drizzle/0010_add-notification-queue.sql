CREATE TABLE pending_notifications (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE RESTRICT,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  recipient_id TEXT NOT NULL REFERENCES contributors(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  triggered_by_id TEXT REFERENCES contributors(id) ON DELETE SET NULL,
  metadata TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE INDEX idx_pending_notifications_recipient ON pending_notifications(recipient_id);
--> statement-breakpoint
CREATE INDEX idx_pending_notifications_created_at ON pending_notifications(created_at);
