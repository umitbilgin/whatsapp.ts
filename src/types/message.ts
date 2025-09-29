import { WAMessage, WAProto } from 'baileys/lib/Types/Message';

export interface Message {
    from: string;
    text: string;
    type: string;
    reply: (text: string) => Promise<WAProto.WebMessageInfo | undefined>;
    data: WAMessage;
}

export interface SendImageOptions {
    caption?: string;
    image: Buffer | string;
}

export interface SendFileOptions {
    caption?: string;
    path: string;
    fileName?: string;
}

export interface SendFileBufferOptions {
    caption?: string;
    document: Buffer;
    mimetype: string;
    fileName?: string;
}

export interface SendAudioOptions {
    audio: Buffer | string;
    seconds?: number; // optional, if you want to manually set the duration of the audio
    ptt?: boolean; // if set to true, will send as a `voice note`
}