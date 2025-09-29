import { SocketConfig } from 'baileys';
export interface WhatsAppAPIOptions {
    sessionPath?: string;
    deviceName?: string;
    baileysOptions?: Partial<SocketConfig>;
}
