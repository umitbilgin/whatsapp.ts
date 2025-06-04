import { WhatsAppAPI } from '../src/index';
import qrcode from 'qrcode-terminal';

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

wp.on('message', (message) => {
    if (message.text.includes('ping')) {
        message.reply('pong');
    }
});

wp.on('/test', async (message) => {
    const reply = await message.reply(message.text);
    if (!reply?.key) return;
    await wp.deleteMessageForMe(reply, message.from);
});

wp.initialize();
