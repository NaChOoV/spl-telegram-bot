import { and, or, eq, ne, SQL, sql, inArray } from 'drizzle-orm';
import db from '../db/database';
import { track, TrackType, type Track } from '../db/schema';
import type { Access } from '../types/access';

class TrackRepository {
    private readonly client: typeof db;
    constructor() {
        this.client = db;
    }

    public async createTrack(
        chatId: number,
        userId: string,
        run: string,
        fullName: string,
        type: TrackType,
        lastEntry?: string
    ): Promise<void> {
        await this.client
            .insert(track)
            .values({ chatId, run, userId, fullName, lastEntry, type })
            .onConflictDoNothing();
    }

    public listTrack(chatId: number, type: TrackType): Promise<Track[]> {
        return this.client
            .select()
            .from(track)
            .where(and(eq(track.chatId, chatId), eq(track.type, type)));
    }

    public async removeTrack(chatId: number, run: string, type: TrackType): Promise<void> {
        await this.client
            .delete(track)
            .where(and(eq(track.chatId, chatId), eq(track.run, run), eq(track.type, type)));
    }

    public async checkTrack(accessToVerify: Access[], type: TrackType): Promise<Track[]> {
        const conditionals = accessToVerify.reduce<SQL[]>((acc, access) => {
            const condition = and(
                eq(track.userId, access.userId),
                ne(track.lastEntry, access.entryAt),
                eq(track.type, type)
            );
            return condition ? [...acc, condition] : acc;
        }, []);

        const trackResponse = await this.client
            .select()
            .from(track)
            .where(or(...conditionals));

        return trackResponse;
    }

    public async updateTrack(accesses: Access[], type: TrackType): Promise<void> {
        const sqlChunks: SQL[] = [];
        const userIds: string[] = [];

        sqlChunks.push(sql`(case`);
        for (const access of accesses) {
            sqlChunks.push(sql`when ${track.userId} = ${access.userId} then ${access.entryAt}`);
            userIds.push(access.userId);
        }
        sqlChunks.push(sql`end)`);

        const finalSql: SQL = sql.join(sqlChunks, sql.raw(' '));

        await db
            .update(track)
            .set({ lastEntry: finalSql })
            .where(and(inArray(track.userId, userIds), eq(track.type, type)));
    }

    public async getAll(type: TrackType): Promise<Track[]> {
        return this.client.select().from(track).where(eq(track.type, type));
    }
}

const trackRepository = new TrackRepository();

export { trackRepository, TrackRepository };
