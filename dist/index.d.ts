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
    reply(message: Message, text: string): Promise<import("baileys").proto.WebMessageInfo | undefined>;
    sendText(to: string, message: string): Promise<import("baileys").proto.WebMessageInfo | undefined>;
    sendImage(to: string, options: SendImageOptions): Promise<import("baileys").proto.WebMessageInfo | undefined>;
    sendFileBuffer(to: string, options: SendFileBufferOptions): Promise<import("baileys").proto.WebMessageInfo | undefined>;
    sendFile(to: string, options: SendFileOptions): Promise<import("baileys").proto.WebMessageInfo | undefined>;
    sendAudio(to: string, options: SendAudioOptions): Promise<import("baileys").proto.WebMessageInfo | undefined>;
    deleteMessageForMe(message: WAMessage, jid: string): Promise<void>;
}
