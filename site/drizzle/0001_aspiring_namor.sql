CREATE TABLE `message_translations` (
	`message_id` text NOT NULL,
	`target_language` text NOT NULL,
	`translated_text` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `message_translations_pair` ON `message_translations` (`message_id`,`target_language`);--> statement-breakpoint
ALTER TABLE `messages` ADD `language_code` text DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `preferred_language` text DEFAULT 'en' NOT NULL;