import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestWaWebVersion, SocketConfig } from 'baileys';

import { BaileysEventMap, UserFacingSocketConfig, WAMessage } from 'baileys/lib/Types';

import { Boom } from '@hapi/boom';
import pino, { Logger } from 'pino';
import mime from 'mime-types';
import EventEmitter from 'events';
import { clone } from './helpers';
import {
    WhatsAppAPIOptions,
    Message,
    WhatsAppEvents,
    SendImageOptions,
    SendFileBufferOptions,
    SendFileOptions,
    SendAudioOptions,
} from './types';
import fs from 'fs';

export class WhatsAppAPI {
    private eventEmitter = new EventEmitter();

    // Typed event methods
    on<K extends keyof WhatsAppEvents>(event: K, listener: WhatsAppEvents[K]): this {
        this.eventEmitter.on(event as string, listener);
        return this;
    }

    emit<K extends keyof WhatsAppEvents>(event: K, ...args: Parameters<WhatsAppEvents[K]>): boolean {
        return this.eventEmitter.emit(event as string, ...args);
    }

    off<K extends keyof WhatsAppEvents>(event: K, listener: WhatsAppEvents[K]): this {
        this.eventEmitter.off(event as string, listener);
        return this;
    }

    public socket: ReturnType<typeof makeWASocket> | undefined;
    public options: WhatsAppAPIOptions | undefined;
    public path = './wp-session';

    constructor(options?: WhatsAppAPIOptions) {
        this.options = options;

        if (this.options?.sessionPath) {
            this.path = this.options.sessionPath;
        }
    }

    async initialize() {
        let { state, saveCreds } = await useMultiFileAuthState(this.path);
        const { version } = await fetchLatestWaWebVersion({});

        const socketOptions: UserFacingSocketConfig = {
            printQRInTerminal: false,
            auth: state,
            //@ts-ignore
            logger: pino({ level: 'silent' }) as Logger,
            version,
        };

        if (this.options?.deviceName) {
            socketOptions.browser = [this.options.deviceName, 'Safari', '3.0'];
        }

        if (this.options?.baileysOptions) {
            Object.assign(socketOptions, this.options.baileysOptions);
        }

        this.socket = makeWASocket(socketOptions);

        this.socket.ev.on('creds.update', saveCreds);
        this.socket.ev.on('connection.update', this.connectionUpdate.bind(this));
        this.socket.ev.on('messages.upsert', this.message.bind(this));
    }

    restart() {
        this.socket?.ev.removeAllListeners('creds.update');
        this.socket?.ev.removeAllListeners('connection.update');
        this.socket?.ev.removeAllListeners('messages.upsert');
    }

    disconnect() {
        this.restart();
        const files = fs.readdirSync(this.path);

        for (const file of files) {
            fs.unlinkSync(`${this.path}/${file}`);
        }
    }

    connectionUpdate(update: BaileysEventMap['connection.update']) {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            this.emit('qr', qr);
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                this.initialize();
            } else {
                this.disconnect();
                this.emit('disconnect', update);
            }
        } else if (connection === 'open') {
            let data = clone(this.socket?.authState.creds.me);
            if (!data) return;

            //data.id = formatPhone(data.id);
            data.session = this.socket?.authState.creds.myAppStateKeyId ? true : false;

            this.emit('ready', data);
        }
    }

    message(update: BaileysEventMap['messages.upsert']) {
        for (const _message of update.messages) {
            if (_message.key.fromMe) continue;
            if (_message.broadcast) continue;
            if (!_message.key.remoteJid) continue;
            if (!_message.message) continue;

            let text = _message.message?.conversation || '';

            const type = Object.keys(_message?.message)[0];

            if (type === 'videoMessage') text = _message.message?.videoMessage?.caption || '';
            if (type === 'imageMessage') text = _message.message?.imageMessage?.caption || '';
            if (type === 'extendedTextMessage') text = _message.message?.extendedTextMessage?.text || '';

            const message: Message = {
                from: _message.key.remoteJid,
                text,
                type,
                reply: (text) => this.reply(message, text),
                data: _message,
            };

            this.emit('message', message);

            if (text.startsWith('/')) {
                const command = text.split(' ')[0];
                message.text = text.replace(`${command} `, '');
                this.emit(command, message);
            }
        }
    }

    async reply(message: Message, text: string) {
        if (!this.socket) throw new Error('Client not initialized');
        return this.socket.sendMessage(message.from, { text }, { quoted: message.data });
    }

    async sendText(to: string, message: string) {
        if (!this.socket) throw new Error('Client not initialized');
        return this.socket.sendMessage(to, { text: message });
    }

    async sendImage(to: string, options: SendImageOptions) {
        if (!this.socket) throw new Error('Client not initialized');

        if (typeof options.image === 'string') {
            if (!fs.existsSync(options.image)) throw new Error('File not found');
            options.image = fs.readFileSync(options.image);
        }

        return this.socket.sendMessage(to, { image: options.image as Buffer, caption: options.caption });
    }

    async sendFileBuffer(to: string, options: SendFileBufferOptions) {
        if (!this.socket) throw new Error('Client not initialized');
        return this.socket.sendMessage(to, options);
    }

    async sendFile(to: string, options: SendFileOptions) {
        if (!this.socket) throw new Error('Client not initialized');
        if (!fs.existsSync(options.path)) throw new Error('File not found');

        const fileBuffer = fs.readFileSync(options.path);
        const mimetype = mime.lookup(options.path);
        return this.socket.sendMessage(to, {
            document: fileBuffer,
            caption: options.caption,
            mimetype: mimetype || 'application/octet-stream',
            fileName: options.fileName,
        });
    }

    async sendAudio(to: string, options: SendAudioOptions) {
        if (!this.socket) throw new Error('Client not initialized');

        if (typeof options.audio === 'string') {
            if (!fs.existsSync(options.audio)) throw new Error('File not found');
            options.audio = fs.readFileSync(options.audio);
        }

        return this.socket.sendMessage(to, {
            audio: options.audio as Buffer,
            ptt: options.ptt,
            seconds: options.seconds,
        });
    }

    async deleteMessageForMe(message: WAMessage, jid: string) {
        if (!this.socket) throw new Error('Client not initialized');
        return this.socket.chatModify(
            {
                deleteForMe: {
                    deleteMedia: true,
                    key: message.key,
                    timestamp: Date.now(),
                },
            },
            jid
        );
    }
}
