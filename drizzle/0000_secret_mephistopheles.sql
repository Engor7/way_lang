CREATE TABLE `daily_stats` (
	`day` text PRIMARY KEY NOT NULL,
	`answered` integer DEFAULT 0 NOT NULL,
	`correct` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `exam_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`course_id` text NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`plan` text NOT NULL,
	`stage_results` text NOT NULL,
	`percent` integer,
	`grade` text,
	`started_at` integer NOT NULL,
	`finished_at` integer
);
--> statement-breakpoint
CREATE TABLE `item_progress` (
	`course_id` text NOT NULL,
	`item_id` text NOT NULL,
	`stage` integer DEFAULT 0 NOT NULL,
	`streak` integer DEFAULT 0 NOT NULL,
	`correct` integer DEFAULT 0 NOT NULL,
	`wrong` integer DEFAULT 0 NOT NULL,
	`learned_at` integer,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`course_id`, `item_id`)
);
