CREATE TABLE IF NOT EXISTS `task_stakeholders` (
	`task_id` text NOT NULL,
	`contributor_id` text NOT NULL,
	PRIMARY KEY(`task_id`, `contributor_id`),
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`contributor_id`) REFERENCES `contributors`(`id`) ON UPDATE no action ON DELETE restrict
);
