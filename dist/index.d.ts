/// <reference types="node" />
import makeWASocket from '@whiskeysockets/baileys';
import { BaileysEventMap } from '@whiskeysockets/baileys/lib/Types/Events';
import EventEmitter from 'events';
import { WhatsAppAPIOptions } from './types';
export declare class WhatsAppAPI extends EventEmitter {
    socket: ReturnType<typeof makeWASocket> | undefined;
    options: WhatsAppAPIOptions | undefined;
    path: string;
    constructor(options?: WhatsAppAPIOptions);
    initialize(): Promise<void>;
    restart(): void;
    connectionUpdate(update: BaileysEventMap['connection.update']): void;
    message(update: BaileysEventMap['messages.upsert']): void;
    sendText(to: string, message: string): Promise<void>;
}
