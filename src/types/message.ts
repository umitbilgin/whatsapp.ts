import { WAMessage } from '@whiskeysockets/baileys/lib/Types/Message';

export interface Message {
    from: string;
    text: string;
    type: string;
    reply: (message: string) => Promise<void>;
    data: WAMessage;
}
