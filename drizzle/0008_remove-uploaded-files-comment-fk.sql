-- SQLite doesn't support ALTER TABLE DROP CONSTRAINT
-- We need to recreate the table without the foreign key on comment_id

-- Step 1: Create new table without the comment_id foreign key
CREATE TABLE `uploaded_files_new` (
	`id` text PRIMARY KEY NOT NULL,
	`board_id` text NOT NULL,
	`comment_id` text NOT NULL,
	`url` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
-- Step 2: Copy data from old table
INSERT INTO `uploaded_files_new` SELECT * FROM `uploaded_files`;
--> statement-breakpoint
-- Step 3: Drop old table
DROP TABLE `uploaded_files`;
--> statement-breakpoint
-- Step 4: Rename new table to original name
ALTER TABLE `uploaded_files_new` RENAME TO `uploaded_files`;
