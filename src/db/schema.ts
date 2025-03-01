import { int, sqliteTable, text, integer, unique } from 'drizzle-orm/sqlite-core';
import { type InferSelectModel } from 'drizzle-orm';

export const track = sqliteTable(
    'track',
    {
        id: int().primaryKey({ autoIncrement: true }),
        chatId: integer().notNull(),
        run: text().notNull(),
        lastEntry: text().default(''),
    },
    (t) => [unique().on(t.chatId, t.run), unique('unique_chat_id_run').on(t.chatId, t.run)]
);

export type Track = InferSelectModel<typeof track>;

export type TrackWithLocation = { location: string } & Track;
