CREATE UNIQUE INDEX `track_chatId_run_unique` ON `track` (`chatId`,`run`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_chat_id_run` ON `track` (`chatId`,`run`);