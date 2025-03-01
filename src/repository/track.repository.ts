import { and, or, eq, ne, SQL, sql, inArray } from 'drizzle-orm';
import db from '../db/database';
import { track, type Track } from '../db/schema';
import type { Access } from '../types/access';

class TrackRepository {
    private readonly client: typeof db;
    constructor() {
        this.client = db;
    }

    public async createTrack(chatId: number, run: string): Promise<void> {
        await this.client
            .insert(track)
            .values({
                chatId: chatId,
                run: run,
            })
            .onConflictDoNothing();
    }

    public listTrack(chatId: number): Promise<Track[]> {
        return this.client.select().from(track).where(eq(track.chatId, chatId));
    }

    public async removeTrack(chatId: number, run: string): Promise<void> {
        await this.client.delete(track).where(and(eq(track.chatId, chatId), eq(track.run, run)));
    }

    public async checkTrack(accessToVerify: Access[]): Promise<Track[]> {
        const conditionals = accessToVerify.reduce<SQL[]>((acc, access) => {
            const condition = and(eq(track.run, access.run), ne(track.lastEntry, access.entryAt));
            return condition ? [...acc, condition] : acc;
        }, []);

        const trackResponse = await this.client
            .select()
            .from(track)
            .where(or(...conditionals));

        return trackResponse;
    }

    public async updateTrack(accesses: Access[]): Promise<void> {
        if (accesses.length === 0) return;

        const sqlChunks: SQL[] = [];
        const runs: string[] = [];

        sqlChunks.push(sql`(case`);
        for (const access of accesses) {
            sqlChunks.push(sql`when ${track.run} = ${access.run} then ${access.entryAt}`);
            runs.push(access.run);
        }
        sqlChunks.push(sql`end)`);

        const finalSql: SQL = sql.join(sqlChunks, sql.raw(' '));

        await db.update(track).set({ lastEntry: finalSql }).where(inArray(track.run, runs));
    }
}

const trackRepository = new TrackRepository();

export { trackRepository, TrackRepository };
