import { Telegraf, Context } from 'telegraf';
import EnvConfig from '../config/enviroment';
import { TrackRepository, trackRepository } from '../repository/track.repository';
import type { NotifyTrack } from '../types/notify-track';
import type { Message } from 'telegraf/types';

// @ts-ignore
type CommandContext = Parameters<Parameters<Telegraf['command']>[1]>[0];
// @ts-ignore
type HelpContext = Parameters<Parameters<Telegraf['help']>[1]>[0];
// @ts-ignore
type StartContext = Parameters<Parameters<Telegraf['start']>[1]>[0];

class TelegramService {
    private readonly bot: Telegraf;
    private readonly trackRepository: TrackRepository;

    constructor() {
        this.bot = new Telegraf(EnvConfig.botToken);
        this.trackRepository = trackRepository;
        this.setupCommands();
    }

    private setupCommands() {
        this.bot.start(this.start);
        this.bot.help(this.help);
        this.bot.command('test', this.test);
        this.bot.command('track', async (ctx) => await this.track(ctx));
        this.bot.command('untrack', async (ctx) => await this.untrack(ctx));
        this.bot.command('list', async (ctx) => await this.showTracked(ctx));
    }

    public launch() {
        this.bot.launch();
        process.once('SIGINT', () => this.bot.stop('SIGINT'));
        process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
        console.log('Bot is running');
    }

    private start(ctx: StartContext) {
        ctx.reply('Bienvenido, escriba /help para ver los comandos disponibles');
    }

    private help(ctx: HelpContext) {
        ctx.reply(`
        /track [RUT] - Agrega un RUT a la lista de seguimiento, ejemplo: /track 12345678-9\n
        /untrack [RUT] - Elimina un RUT de la lista de seguimiento, ejemplo: /untrack 12345678-9\n
        /list - Muestra la lista de RUTs en seguimiento\n 
        `);
    }

    private test(ctx: CommandContext) {
        if (!ctx.chat?.id) return;

        ctx.reply(String(ctx.chat?.id));
    }

    private async track(ctx: CommandContext): Promise<void> {
        if (!ctx.chat?.id) return;
        if (ctx.args.length === 0) {
            ctx.reply('Debes ingresar RUN, ejemplo: /track 12345678-9');
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
            ctx.reply('Debes ingresar RUN, ejemplo: /untrack 12345678-9');
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

    public async notify(tracks: NotifyTrack[]) {
        const promises = tracks.map<Promise<Message.TextMessage>>((track) => {
            const message = `🚨 ${track.run}\n${track.fullName}\nAcaba de ingresar a ${track.location}`;

            return this.bot.telegram.sendMessage(track.chatId, message);
        });

        const response = await Promise.allSettled(promises);
        const rejected = response.filter((res) => res.status === 'rejected');

        // TODO: return chatId of rejectd chats to be deleted
        console.log('Total rejected:', rejected.length);
    }
}

const telegramService = new TelegramService();

export { telegramService, TelegramService };
