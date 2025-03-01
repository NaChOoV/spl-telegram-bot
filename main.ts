import EnvConfig from './src/config/enviroment';
import accessService from './src/services/access.service';
import { telegramService } from './src/services/telegram.service';
import { trackService } from './src/services/track.service';
import type { NotifyTrack } from './src/types/notify-track';
import { getLocation } from './src/utils/location';

// SETUP
telegramService.launch();

// Websocket connection
const socket = new WebSocket(EnvConfig.accessWssUrl);
socket.addEventListener('message', async (_) => {
    try {
        const accesses = await accessService.getAccess();
        if (accesses.data.length === 0) return;

        const tracksToNotify = await trackService.checkTracks(accesses.data);
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
        const result = await telegramService.notify(notifyTracks);
        console.log(`FullFilled: ${result.fullFilled}, Rejected: ${result.rejected}`);
    } catch (error) {
        console.log('Error:', error);
    }
});

socket.addEventListener('open', (_) => {
    console.log('Websocket connected to:', EnvConfig.accessWssUrl);
});
socket.addEventListener('error', (event) => {
    console.log('Websocket error:', event);
});
