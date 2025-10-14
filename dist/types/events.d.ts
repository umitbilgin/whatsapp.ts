import { Message } from './message';
import { WhatsAppReady } from './whatsapp.ready';
import { BaileysEventMap } from '@whiskeysockets/baileys/lib/Types';
export interface WhatsAppEvents extends Record<string, (...args: any[]) => void> {
    qr: (qr: string) => void;
    ready: (data: WhatsAppReady) => void;
    disconnect: (update: BaileysEventMap['connection.update']) => void;
    message: (message: Message) => void;
    [key: `/${string}`]: (message: Message) => void;
}
