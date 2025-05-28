import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestWaWebVersion,
  SocketConfig,
} from '@whiskeysockets/baileys';

import { BaileysEventMap, UserFacingSocketConfig } from '@whiskeysockets/baileys/lib/Types';

import { Boom } from '@hapi/boom';
import pino, { Logger } from 'pino';
import EventEmitter from 'events';
import { clone } from './helpers';
import { WhatsAppAPIOptions, Message } from './types';
import fs from 'fs';

export class WhatsAppAPI extends EventEmitter {
  public socket: ReturnType<typeof makeWASocket> | undefined;
  public options: WhatsAppAPIOptions | undefined;
  public path = './wp-session';

  constructor(options?: WhatsAppAPIOptions) {
    super();
    this.options = options;

    if (this.options?.sessionPath) {
      this.path = this.options.sessionPath;
    }
  }

  async initialize() {
    let { state, saveCreds } = await useMultiFileAuthState(this.path);
    const { version } = await fetchLatestWaWebVersion({});

    const socketOptions: UserFacingSocketConfig = {
      printQRInTerminal: false,
      auth: state,
      //@ts-ignore
      logger: pino({ level: 'silent' }) as Logger,
      version,
    };

    if (this.options?.deviceName) {
      socketOptions.browser = [this.options.deviceName, 'Safari', '3.0'];
    }

    if (this.options?.baileysOptions) {
      Object.assign(socketOptions, this.options.baileysOptions);
    }

    this.socket = makeWASocket(socketOptions);

    this.socket.ev.on('creds.update', saveCreds);
    this.socket.ev.on('connection.update', this.connectionUpdate.bind(this));
    this.socket.ev.on('messages.upsert', this.message.bind(this));
  }

  restart() {
    this.socket?.ev.removeAllListeners('creds.update');
    this.socket?.ev.removeAllListeners('connection.update');
    this.socket?.ev.removeAllListeners('messages.upsert');
  }

  disconnect() {
    this.restart();
    const files = fs.readdirSync(this.path);

    for (const file of files) {
      fs.unlinkSync(`${this.path}/${file}`);
    }
  }

  connectionUpdate(update: BaileysEventMap['connection.update']) {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      this.emit('qr', qr);
    }

    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        this.initialize();
      } else {
        this.disconnect();
        this.emit('disconnect', update);
      }
    } else if (connection === 'open') {
      let data = clone(this.socket?.authState.creds.me);
      if (!data) return;

      //data.id = formatPhone(data.id);
      data.session = this.socket?.authState.creds.myAppStateKeyId ? true : false;

      this.emit('ready', data);
    }
  }

  message(update: BaileysEventMap['messages.upsert']) {
    for (const _message of update.messages) {
      if (_message.key.fromMe) continue;
      if (_message.broadcast) continue;
      if (!_message.key.remoteJid) continue;
      if (!_message.message) continue;

      let text = _message.message?.conversation || '';

      const type = Object.keys(_message?.message)[0];

      if (type === 'videoMessage') text = _message.message?.videoMessage?.caption || '';
      if (type === 'imageMessage') text = _message.message?.imageMessage?.caption || '';
      if (type === 'extendedTextMessage') text = _message.message?.extendedTextMessage?.text || '';

      const message: Message = {
        from: _message.key.remoteJid,
        text,
        type,
        reply: (text) => this.reply(message, text),
        data: _message,
      };

      this.emit('message', message);

      if (text.startsWith('/')) {
        const command = text.split(' ')[0];
        message.text = text.replace(`${command} `, '');
        this.emit(command, message);
      }
    }
  }

  async reply(message: Message, text: string) {
    if (!this.socket) throw new Error('Client not initialized');
    await this.socket.sendMessage(message.from, { text }, { quoted: message.data });
  }

  async sendText(to: string, message: string) {
    if (!this.socket) throw new Error('Client not initialized');
    await this.socket.sendMessage(to, { text: message });
  }
}
