import makeWASocket from 'baileys';
import { BaileysEventMap, WAMessage } from 'baileys/lib/Types';
import { WhatsAppAPIOptions, Message, WhatsAppEvents, SendImageOptions, SendFileBufferOptions, SendFileOptions, SendAudioOptions } from './types';
export declare class WhatsAppAPI {
    private eventEmitter;
    on<K extends keyof WhatsAppEvents>(event: K, listener: WhatsAppEvents[K]): this;
    emit<K extends keyof WhatsAppEvents>(event: K, ...args: Parameters<WhatsAppEvents[K]>): boolean;
    off<K extends keyof WhatsAppEvents>(event: K, listener?: WhatsAppEvents[K]): this;
    removeAllListeners<K extends keyof WhatsAppEvents>(event?: K): this;
    socket: ReturnType<typeof makeWASocket> | undefined;
    options: WhatsAppAPIOptions | undefined;
    path: string;
    constructor(options?: WhatsAppAPIOptions);
    initialize(): Promise<void>;
    restart(): void;
    disconnect(): void;
    connectionUpdate(update: BaileysEventMap['connection.update']): void;
    message(update: BaileysEventMap['messages.upsert']): void;
    reply(message: Message, text: string): Promise<WAMessage | undefined>;
    sendText(to: string, message: string): Promise<WAMessage | undefined>;
    sendImage(to: string, options: SendImageOptions): Promise<WAMessage | undefined>;
    sendFileBuffer(to: string, options: SendFileBufferOptions): Promise<WAMessage | undefined>;
    sendFile(to: string, options: SendFileOptions): Promise<WAMessage | undefined>;
    sendAudio(to: string, options: SendAudioOptions): Promise<WAMessage | undefined>;
    deleteMessageForMe(message: WAMessage, jid: string): Promise<void>;
}
