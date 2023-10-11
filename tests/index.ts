import { WhatsAppAPI } from '../src/index';
import qrcode from 'qrcode-terminal';

let wp = new WhatsAppAPI({
    deviceName: 'Chrome',
    sessionPath: './wp-session',
});

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
