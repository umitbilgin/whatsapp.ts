import { WhatsAppAPI } from '../src/index';
import qrcode from 'qrcode-terminal';
import { Message } from '../src/types';

let wp = new WhatsAppAPI({
    deviceName: 'My Device',
    sessionPath: './wp-session',
    baileysOptions: {},
});

wp.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

wp.on('ready', async (data) => {
    console.log(data);
});

wp.on('disconnect', (reason) => {
    console.log('Disconnected: ' + reason);
    wp.initialize();
});

wp.on('message', (message: Message) => {
    if (message.text.includes('ping')) {
        message.reply('pong');
    }
});

wp.on('/test', (message: Message) => {
    message.reply(message.text);
});

wp.initialize();
