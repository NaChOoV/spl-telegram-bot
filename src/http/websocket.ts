import { sleep } from 'bun';
import EnvConfig from '../config/enviroment';
import { AccessService, accessService } from '../services/access.service';
import { TelegramService, telegramService } from '../services/telegram.service';
import { TrackService, trackService } from '../services/track.service';
import { getLocation } from '../utils/location';
import { getSleepSeconds } from '../utils/sleep-time';

class AccessWebsocket {
    private readonly telegramService: TelegramService;
    private readonly trackService: TrackService;
    private readonly accessService: AccessService;

    private socket: WebSocket | null = null;

    constructor() {
        this.telegramService = telegramService;
        this.trackService = trackService;
        this.accessService = accessService;
    }

    public init() {
        this.connect();
    }

    private connect() {
        if (this.socket) {
            if (
                this.socket.readyState === WebSocket.OPEN ||
                this.socket.readyState === WebSocket.CONNECTING
            ) {
                this.socket.close();
            }
            this.socket = null;
        }

        const socket = new WebSocket(EnvConfig.accessWssUrl);
        socket.addEventListener('message', (_) => this.handleMessage());
        socket.addEventListener('open', (_) => this.handleOpen());
        socket.addEventListener('error', (event) => this.handleError(event));
        socket.addEventListener('close', async (event) => await this.handleClose(event));
    }

    private async handleMessage() {
        try {
            const accesses = await this.accessService.getAccess();
            if (accesses.data.length === 0) return;

            const tracksToNotify = await this.trackService.checkTracks(accesses.data);
            if (tracksToNotify.length === 0) return;

            // @ts-ignore
            const notifyTracks = tracksToNotify.map<NotifyTrack>((track) => {
                const access = accesses.data.find((access) => access.run === track.run);
                if (!access) return;

                return {
                    chatId: track.chatId,
                    run: track.run,
                    location: getLocation(access.location),
                    fullName: access.fullName,
                };
            });

            console.log('Nuevos seguimientos:', notifyTracks.length);
            const result = await this.telegramService.notify(notifyTracks);
            console.log(`FullFilled: ${result.fullFilled}, Rejected: ${result.rejected}`);
        } catch (error) {
            console.log('[WebSocket] Message Error:', error);
        }
    }

    private handleOpen() {
        if (!this.socket) console.log('[WebSocket] Connected to:', EnvConfig.accessWssUrl);
    }

    private handleError(event: Event) {
        console.log('[WebSocket] Error:', event);
    }

    private async handleClose(event: CloseEvent) {
        const secondsLeft = getSleepSeconds(EnvConfig.timeZone);
        if (secondsLeft > 0) {
            console.log(
                `[WebSocket] Server close. Reconnecting in ${(secondsLeft / 60 / 60).toFixed(
                    1
                )} hours`
            );
        }
        await sleep(secondsLeft * 1000);

        if (event.code === 1006) {
            this.connect();
            return;
        }

        console.log('[WebSocket] Close Event:', event.code);
        console.log('[WebSocket] Attempting to reconnect in 10 seconds...');
        await sleep(10 * 1000);
        this.connect();
    }
}

export default AccessWebsocket;
