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

## Functions

`sendText(to, message)`

Sends a text message to the specified phone number. The first parameter should be in the WhatsApp number format (e.g., number@c.us or number@s.whatsapp.net). The second parameter is the message you want to send.

## Example
Below is an example of how to use the `whatsapp.ts` library:

```javascript
import { WhatsAppAPI } from 'whatsapp.ts';
import qrcode from 'qrcode-terminal';

let wp = new WhatsAppAPI({
    deviceName: 'Chrome',
    sessionPath: './wp-session22',
    baileysOptions: {},
});

wp.initialize();

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
```
## License

This section can be found in LICENSE file.


