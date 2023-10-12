import { WhatsAppAPI } from '../src/index';
import qrcode from 'qrcode-terminal';

let wp = new WhatsAppAPI({
    deviceName: 'Chrome',
    sessionPath: './wp-session',
    baileysOptions: {},
});

wp.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

wp.on('ready', async (data) => {
    console.log(data);
    wp.sendText('90500000000', 'Hello World!');
});

wp.on('disconnect', (reason) => {
    console.log('Disconnected: ' + reason);
    wp.initialize();
});

wp.on('message', (message) => {
    console.dir(message, { depth: null });
});

wp.initialize();
