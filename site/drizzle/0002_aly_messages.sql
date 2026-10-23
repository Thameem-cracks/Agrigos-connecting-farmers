CREATE TABLE `aly_messages` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `role` text NOT NULL,
  `body` text NOT NULL,
  `image_key` text,
  `created_at` text NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `aly_messages_user_date` ON `aly_messages` (`user_id`,`created_at`);
