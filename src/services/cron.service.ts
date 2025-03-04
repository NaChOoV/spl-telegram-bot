import { CronJob } from 'cron';
import { telegramService, type TelegramService } from './telegram.service';
import { TrackRepository, trackRepository } from '../repository/track.repository';
import { SourceService, sourceService } from './source.service';
import { extractUnique } from '../utils/utility';
import type { NotifyTrack } from '../types/notify-track';
import { getLocation } from '../utils/location';
import { TrackType } from '../db/schema';

class CronJobService {
    private readonly telegramService: TelegramService;
    private readonly trackRepository: TrackRepository;
    private readonly sourceService: SourceService;

    constructor() {
        this.telegramService = telegramService;
        this.trackRepository = trackRepository;
        this.sourceService = sourceService;
    }
    public setup() {
        const job1 = CronJob.from({
            cronTime: '*/3 * * * * *',
            onTick: async () => await this.checkAccess(),
            start: true,
            waitForCompletion: true,
        });

        console.log('[CronJobService] Running.');
    }

    public async checkAccess() {
        // consultar la bd
        const tracks = await trackRepository.getAll(TrackType.TRACK);

        const userIds = extractUnique(tracks, (track) => track.userId);
        const chunkSize = 5;
        const chunks = [];
        for (let i = 0; i < userIds.length; i += chunkSize) {
            chunks.push(userIds.slice(i, i + chunkSize));
        }
        const results = await Promise.all(
            chunks.map((chunk) => this.sourceService.getLastEntryByUserId(chunk))
        );
        const accesses = results.flat();
        if (accesses.length === 0) return;

        const matchTracks = await this.trackRepository.checkTrack(accesses, TrackType.TRACK);
        if (matchTracks.length === 0) return;

        const matchUserIds = extractUnique(matchTracks, (track) => track.userId);
        const accessToUpdate = accesses.filter((access) => matchUserIds.includes(access.userId));

        await this.trackRepository.updateTrack(accessToUpdate, TrackType.TRACK);
        // @ts-ignore
        const notifyTracks = matchTracks.map<NotifyTrack>((track) => {
            const access = accessToUpdate.find((access) => access.userId === track.userId);
            if (!access) return;

            return {
                chatId: track.chatId,
                run: track.run,
                location: getLocation(access.sedeId),
                fullName: track.fullName,
            };
        });

        console.log('Nuevos seguimientos:', notifyTracks.length);
        const result = await this.telegramService.notify(notifyTracks);
        console.log(`FullFilled: ${result.fullFilled}, Rejected: ${result.rejected}`);
    }
    private checkFailedAccess() {}
}

export default CronJobService;
