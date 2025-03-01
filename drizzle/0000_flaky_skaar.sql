CREATE TABLE `track` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`chatId` integer NOT NULL,
	`run` text NOT NULL,
	`lastEntry` text DEFAULT ''
);
