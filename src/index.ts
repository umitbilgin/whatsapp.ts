import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestWaWebVersion,
    SocketConfig,
} from '@whiskeysockets/baileys';

import { BaileysEventMap } from '@whiskeysockets/baileys/lib/Types/Events';

import { Boom } from '@hapi/boom';
import pino, { Logger } from 'pino';
import EventEmitter from 'events';
import { clone, formatPhone } from './helpers';
import { WhatsAppAPIOptions } from './types';

export class WhatsAppAPI extends EventEmitter {
    public socket: ReturnType<typeof makeWASocket> | undefined;
    public options: WhatsAppAPIOptions | undefined;

    constructor(options?: WhatsAppAPIOptions) {
        super();
        this.options = options;
    }

    async initialize() {
        console.log('Client initializing...');

        let { state, saveCreds } = await useMultiFileAuthState(this.options?.sessionPath || './wp-session');
        const { version } = await fetchLatestWaWebVersion({});

        const socketOptions: SocketConfig = {
            printQRInTerminal: false,
            auth: state,
            //@ts-ignore
            logger: pino({ level: 'silent' }) as Logger,
            version,
        };

        if (this.options?.deviceName) {
            socketOptions.browser = [this.options.deviceName, 'Safari', '3.0'];
        }

        this.socket = makeWASocket(socketOptions);

        this.socket.ev.on('creds.update', saveCreds);
        this.socket.ev.on('connection.update', this.connectionUpdate.bind(this));
        this.socket.ev.on('messages.upsert', this.message.bind(this));
    }

    connectionUpdate(update: any) {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            this.emit('qr', qr);
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) this.initialize();
        } else if (connection === 'open') {
            let data = clone(this.socket?.authState.creds.me);
            if (!data) return;

            data.id = formatPhone(data.id);
            this.emit('ready', data);
        }
    }

    message(update: BaileysEventMap['messages.upsert']) {
        for (const message of update.messages) {
            if (message.key.fromMe) continue;
            this.emit('message', message);
        }
    }

    async sendText(to: string, message: string) {
        if (!this.socket) throw new Error('Client not initialized');

        await this.socket.sendMessage(to, { text: message });
    }
}
