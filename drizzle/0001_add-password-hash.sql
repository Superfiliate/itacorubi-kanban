-- Migration: Add password_hash column and drop encrypted_verification
-- This migration handles existing boards by setting a placeholder hash value
-- that will fail password verification, effectively making old boards inaccessible.

-- Add the new password_hash column with a default value for existing rows
-- The default 'INVALID' will fail password verification in the app
ALTER TABLE `boards` ADD `password_hash` text DEFAULT 'INVALID' NOT NULL;--> statement-breakpoint

-- Drop the old encrypted_verification column that is no longer used
ALTER TABLE `boards` DROP COLUMN `encrypted_verification`;
