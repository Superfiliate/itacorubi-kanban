-- Add from_email column to sent_emails table
ALTER TABLE sent_emails ADD COLUMN from_email TEXT NOT NULL DEFAULT 'notifications@resend.dev';
