CREATE TABLE `uploaded_files` (
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
