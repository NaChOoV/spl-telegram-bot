import { Telegraf, Context } from 'telegraf';
import EnvConfig from '../config/enviroment';
import { TrackRepository, trackRepository } from '../repository/track.repository';
import type { NotifyTrack } from '../types/notify-track';
import type { Message } from 'telegraf/types';
import { sourceService, type SourceService } from './source.service';

// @ts-ignore
type CommandContext = Parameters<Parameters<Telegraf['command']>[1]>[0];
// @ts-ignore
type HelpContext = Parameters<Parameters<Telegraf['help']>[1]>[0];
// @ts-ignore
type StartContext = Parameters<Parameters<Telegraf['start']>[1]>[0];

type NotifyResult = {
    fullFilled: number;
    rejected: number;
};

class TelegramService {
    private readonly bot: Telegraf;
    private readonly trackRepository: TrackRepository;
    private readonly sourceService: SourceService;

    constructor() {
        this.bot = new Telegraf(EnvConfig.botToken);
        this.trackRepository = trackRepository;
        this.sourceService = sourceService;

        this.setupCommands();
    }

    private setupCommands() {
        this.bot.start(this.start);
        this.bot.help(this.help);
        this.bot.command('test', this.test);
        this.bot.command('track', async (ctx) => await this.track(ctx));
        this.bot.command('untrack', async (ctx) => await this.untrack(ctx));
        this.bot.command('list', async (ctx) => await this.showTracked(ctx));
        this.bot.command('photo', async (ctx) => await this.showPhoto(ctx));
        this.bot.command('block', async (ctx) => await this.block(ctx));
        this.bot.command('unblock', async (ctx) => await this.unBlock(ctx));
    }

    public launch() {
        this.bot.launch();
        process.once('SIGINT', () => this.bot.stop('SIGINT'));
        process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
        console.log('[TelegramService] Bot is running');
    }

    private start(ctx: StartContext) {
        ctx.reply('Bienvenido, escriba /help para ver los comandos disponibles');
    }

    private help(ctx: HelpContext) {
        ctx.reply(
            'Comandos disponibles:\n\n' +
                '/track [RUT] - Agrega un RUT a la lista de seguimiento.\nEjemplo: /track 12345678-9\n\n' +
                '/untrack [RUT] - Elimina un RUT de la lista de seguimiento\nEjemplo: /untrack 12345678-9\n\n' +
                '/list - Muestra la lista de RUTs en seguimiento.\n\n' +
                '/photo [RUT] - Muestra la foto de un usuario.\nEjemplo: /photo 12345678-9\n\n' +
                '/block [RUT] - Bloquea un usuario.\nEjemplo: /block 12345678-9\n\n' +
                '/unblock [RUT] - Desbloquea un usuario.\nEjemplo: /unblock 12345678-9\n\n'
        );
    }

    private test(ctx: CommandContext) {
        if (!ctx.chat?.id) return;

        console.log('test', ctx.chat.id);
        ctx.reply(String(ctx.chat?.id));
    }

    private async track(ctx: CommandContext): Promise<void> {
        if (!ctx.chat?.id) return;
        if (ctx.args.length === 0) {
            ctx.reply('Debes ingresar RUT!\nEjemplo: /track 12345678-9');
            return;
        }

        const userId = await this.sourceService.getIdByRun(ctx.args[0]);
        if (!userId) {
            ctx.reply('RUT no existe');
            return;
        }

        const chatId = ctx.chat.id;
        const run = ctx.args[0];

        await this.trackRepository.createTrack(chatId, run);

        ctx.reply('✅ Agregado correctamente');
    }

    private async untrack(ctx: CommandContext): Promise<void> {
        if (!ctx.chat?.id) return;
        if (ctx.args.length === 0) {
            ctx.reply('Debes ingresar RUT\nEjemplo: /untrack 12345678-9');
            return;
        }

        const chatId = ctx.chat.id;
        const run = ctx.args[0];
        await this.trackRepository.removeTrack(chatId, run);

        ctx.reply('✅ Removido correctamente');
    }

    private async showTracked(ctx: CommandContext): Promise<void> {
        if (!ctx.chat?.id) return;
        const track = await this.trackRepository.listTrack(ctx.chat.id);

        const response = `📋 Listado\n\n${track.map((t) => t.run).join('\n')}`;
        ctx.reply(response);
    }

    public async notify(tracks: NotifyTrack[]): Promise<NotifyResult> {
        const promises = tracks.map<Promise<Message.TextMessage>>((track) => {
            const message = `🚨 ${track.run}\n${track.fullName}\nAcaba de ingresar a ${track.location}`;

            return this.bot.telegram.sendMessage(track.chatId, message);
        });

        const response = await Promise.allSettled(promises);
        const fulfilled = response.filter((res) => res.status === 'fulfilled');
        const rejected = response.filter((res) => res.status === 'rejected');

        return {
            fullFilled: fulfilled.length,
            rejected: rejected.length,
        };
    }

    public async showPhoto(ctx: CommandContext): Promise<void> {
        if (!ctx.chat?.id) return;
        const userId = await this.sourceService.getIdByRun(ctx.args[0]);

        if (!userId) {
            ctx.reply('RUT no encontrado');
            return;
        }
        const cookies = await this.sourceService.login();
        const user = await this.sourceService.getUserProfile(userId, cookies);

        if (!user.imageUrl) {
            ctx.reply('Usuario sin foto');
            return;
        }

        ctx.replyWithPhoto(user.imageUrl);
    }

    private async block(ctx: CommandContext): Promise<void> {
        if (!ctx.chat?.id) return;
        if (ctx.args.length === 0) {
            ctx.reply('Debes ingresar RUT\nEjemplo: /block 12345678-9');
            return;
        }

        const run = ctx.args[0];
        const userId = await this.sourceService.getIdByRun(run);
        if (!userId) {
            ctx.reply('RUT no encontrado');
            return;
        }

        const cookies = await this.sourceService.login();
        await this.sourceService.blockUser(userId, cookies);

        ctx.reply('✅ Usuario bloqueado');
    }

    private async unBlock(ctx: CommandContext): Promise<void> {
        if (!ctx.chat?.id) return;
        if (ctx.args.length === 0) {
            ctx.reply('Debes ingresar RUT\nEjemplo: /unblock 12345678-9');
            return;
        }
        const run = ctx.args[0];
        const userId = await this.sourceService.getIdByRun(run);
        if (!userId) {
            ctx.reply('RUT no encontrado');
            return;
        }

        const cookies = await this.sourceService.login();
        await this.sourceService.unBlockUser(userId, cookies);

        ctx.reply('✅ Usuario desbloqueado');
    }
}

const telegramService = new TelegramService();

export { telegramService, TelegramService };
