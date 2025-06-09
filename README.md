# whatsapp.ts

A simple Node.js library for simplifying WhatsApp Web socket connection using the [WhiskeySockets/Baileys](https://github.com/WhiskeySockets/Baileys) library.

## Installation

You can install `whatsapp.ts` via npm:

```bash
npm install whatsapp.ts
```

## Purpose

The primary purpose of this library is to provide a more user-friendly and streamlined way of creating WhatsApp Web socket connections using the WhiskeySockets/Baileys library. It simplifies the process and offers additional functionalities.

## Features

### All Baileys Socket Options Supported
You can pass all the socket configuration options supported by the Baileys library through the baileysOptions parameter in the constructor of the WhatsAppAPI class.

### Direct Access to Baileys Socket
With whatsapp.ts, you can access the underlying socket created by Baileys directly using the wp.socket property. This means that you can utilize any events and functions that are available in Baileys but not included in this library.

## Events

* `qr`: Triggered when a QR code is received. The QR code data is passed as a parameter.
* `ready`: Fired when a successful login to WhatsApp is established. Account information is passed as a parameter.
* `disconnect`: Triggered when you log out of WhatsApp. The reason for disconnection is passed as a parameter.
* `message`: Triggered when a message is received. The full message details are passed as a parameter.
* `/command`: Triggered when a message with a command (starting with /) is received. The full message details are passed as a parameter.

## Functions

`sendText(to, message)`

Sends a text message to the specified phone number. The first parameter should be in the WhatsApp number format (e.g., number@c.us or number@s.whatsapp.net). The second parameter is the message you want to send.

`sendImage(to, options)`

Sends an image to the specified phone number. The first parameter should be in the WhatsApp number format. The second parameter is an options object containing:
- `image`: Buffer or string (file path) - The image data or path to image file
- `caption`: string (optional) - Caption text for the image

`sendFile(to, options)`

Sends a document file to the specified phone number. The first parameter should be in the WhatsApp number format. The second parameter is an options object containing:
- `path`: string - Path to the file to be sent
- `caption`: string (optional) - Caption text for the file
- `fileName`: string (optional) - Custom filename for the document

`sendFileBuffer(to, options)`

Sends a document file using buffer data to the specified phone number. The first parameter should be in the WhatsApp number format. The second parameter is an options object containing:
- `document`: Buffer - File data as buffer
- `mimetype`: string - MIME type of the file
- `caption`: string (optional) - Caption text for the file
- `fileName`: string (optional) - Custom filename for the document

`sendAudio(to, options)`

Sends an audio file to the specified phone number. The first parameter should be in the WhatsApp number format. The second parameter is an options object containing:
- `audio`: Buffer or string (file path) - The audio data or path to audio file
- `ptt`: boolean (optional) - If set to true, will send as a voice note
- `seconds`: number (optional) - Duration of the audio in seconds

`message.reply(text)`

This function is used to reply to a received message. You can pass the `text` parameter to send a response to the message that triggered the event.

## Example
Below is an example of how to use the `whatsapp.ts` library:

```typescript
import { WhatsAppAPI } from '../src/index';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import mime from 'mime-types';

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

wp.on('/image', async (message) => {
    // Buffer example
    const file = fs.readFileSync('./tests/example.jpg');
    await wp.sendImage(message.from, {
        image: file,
        caption: 'Image buffer example'
    });

    // Path example
    await wp.sendImage(message.from, {
        image: './tests/example.jpg',
        caption: 'Image path example'
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
        fileName: 'example.txt'
    });

    // Path example
    await wp.sendFile(message.from, {
        path: './tests/example.txt',
        caption: 'File path example',
        fileName: 'example.txt'
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
```

## License

This section can be found in LICENSE file.


