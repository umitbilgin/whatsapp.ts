import { WAMessage } from '@whiskeysockets/baileys/lib/Types/Message';

export interface Message {
    from: string;
    text: string;
    type: string;
    reply: (text: string) => Promise<void>;
    data: WAMessage;
}
