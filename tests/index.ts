import { SocketConfig } from '@whiskeysockets/baileys';
import { WhatsAppAPI } from '../src/index';
import qrcode from 'qrcode-terminal';

let wp = new WhatsAppAPI({
    deviceName: 'Chrome',
    sessionPath: './wp-session',
    baileysOptions: {
        browser: ['Allahyar', 'Safari', '3.0'],
    }
});

console.log("Starting");

wp.initialize();

wp.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

wp.on('ready', async (data) => {
    console.log(data);
});

wp.on('message', (message) => {
    console.dir(message, { depth: null });
});
