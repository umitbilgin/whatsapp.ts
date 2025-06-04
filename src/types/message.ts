import { WAMessage, WAProto } from '@whiskeysockets/baileys/lib/Types/Message';

export interface Message {
    from: string;
    text: string;
    type: string;
    reply: (text: string) => Promise<WAProto.WebMessageInfo | undefined>;
    data: WAMessage;
}
