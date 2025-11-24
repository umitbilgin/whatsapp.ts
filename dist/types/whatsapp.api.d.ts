import { AuthenticationState, SocketConfig } from 'baileys';
export interface WhatsAppAPIOptions {
    sessionPath?: string;
    deviceName?: string;
    baileysOptions?: Partial<SocketConfig>;
    auth?: {
        state: AuthenticationState;
        saveCreds: () => Promise<void>;
    };
}
