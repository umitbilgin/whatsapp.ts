import { WhatsAppAPI } from '../src/index';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import mime from 'mime-types';
import { fetchLatestWaWebVersion } from 'baileys';

(async () => {
    const { version, isLatest } = await fetchLatestWaWebVersion({});
    console.log(version, isLatest);
    let wp = new WhatsAppAPI({
        deviceName: 'My Device',
        sessionPath: './wp-session',
        baileysOptions: {
            // version,
        },
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

    wp.on('/image', async (message) => {
        // Buffer example
        const file = fs.readFileSync('./tests/example.jpg');
        await wp.sendImage(message.from, {
            image: file,
            caption: 'Image buffer example',
        });

        // Path example
        await wp.sendImage(message.from, {
            image: './tests/example.jpg',
            caption: 'Image path example',
        });
    });

    wp.on('/file', async (message) => {
        // Buffer example
        const file = fs.readFileSync('./tests/example.txt');
        const mimetype = mime.lookup('./tests/example.txt');

        await wp.sendFileBuffer(message.from, {
            document: file,
            caption: 'File buffer example',
            mimetype: mimetype || 'application/octet-stream',
            fileName: 'example.txt',
        });

        // Path example
        await wp.sendFile(message.from, {
            path: './tests/example.txt',
            caption: 'File path example',
            fileName: 'example.txt',
        });
    });

    wp.on('/audio', async (message) => {
        const file = fs.readFileSync('./tests/example.mp3');

        // Voice note example
        await wp.sendAudio(message.from, {
            audio: file,
            ptt: true, // if set to true, will send as a `voice note`
        });

        // Audio example
        await wp.sendAudio(message.from, {
            audio: file,
        });
    });

    wp.initialize();
})();
