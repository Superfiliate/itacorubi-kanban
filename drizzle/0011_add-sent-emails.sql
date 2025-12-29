-- Sent emails table for "Letter Opener" style email viewing
-- Always populated in all environments; helps debug email issues

CREATE TABLE sent_emails (
  id TEXT PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  board_id TEXT NOT NULL,
  board_title TEXT NOT NULL,
  html_content TEXT NOT NULL,
  notification_ids TEXT NOT NULL,
  sent_to_resend INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_sent_emails_created_at ON sent_emails(created_at);
