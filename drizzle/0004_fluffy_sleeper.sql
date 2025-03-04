DROP INDEX `track_chatId_run_unique`;--> statement-breakpoint
DROP INDEX `unique_chat_id_run`;--> statement-breakpoint
CREATE UNIQUE INDEX `track_chatId_run_type_unique` ON `track` (`chatId`,`run`,`type`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_chat_id_run_type` ON `track` (`chatId`,`run`,`type`);