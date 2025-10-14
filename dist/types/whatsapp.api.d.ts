import { SocketConfig } from '@whiskeysockets/baileys';
export interface WhatsAppAPIOptions {
    sessionPath?: string;
    deviceName?: string;
    baileysOptions?: Partial<SocketConfig>;
}
