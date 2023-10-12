import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestWaWebVersion,
  SocketConfig,
} from "@whiskeysockets/baileys";

import { BaileysEventMap } from "@whiskeysockets/baileys/lib/Types/Events";

import { Boom } from "@hapi/boom";
import pino, { Logger } from "pino";
import EventEmitter from "events";
import { clone, formatPhone } from "./helpers";
import { WhatsAppAPIOptions } from "./types";
import fs from "fs";

export class WhatsAppAPI extends EventEmitter {
  public socket: ReturnType<typeof makeWASocket> | undefined;
  public options: WhatsAppAPIOptions | undefined;
  public path = "./wp-session";

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

    const socketOptions: SocketConfig = {
      printQRInTerminal: false,
      auth: state,
      //@ts-ignore
      logger: pino({ level: "silent" }) as Logger,
      version,
    };

    if (this.options?.deviceName) {
      socketOptions.browser = [this.options.deviceName, "Safari", "3.0"];
    }

    if (this.options?.baileysOptions) {
      Object.assign(socketOptions, this.options.baileysOptions);
    }

    this.socket = makeWASocket(socketOptions);

    this.socket.ev.on("creds.update", saveCreds);
    this.socket.ev.on("connection.update", this.connectionUpdate.bind(this));
    this.socket.ev.on("messages.upsert", this.message.bind(this));
  }

  restart() {
    this.socket?.ev.removeAllListeners("creds.update");
    this.socket?.ev.removeAllListeners("connection.update");
    this.socket?.ev.removeAllListeners("messages.upsert");
  }

  connectionUpdate(update: BaileysEventMap["connection.update"]) {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      this.emit("qr", qr);
    }

    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut;
      if (shouldReconnect) {
        this.initialize();
      } else {
        this.emit("disconnect", update);
        this.restart();
        const files = fs.readdirSync(this.path);

        for (const file of files) {
          fs.unlinkSync(`${this.path}/${file}`);
        }
      }
    } else if (connection === "open") {
      let data = clone(this.socket?.authState.creds.me);
      if (!data) return;

      data.id = formatPhone(data.id);
      data.session = this.socket?.authState.creds.myAppStateKeyId
        ? true
        : false;

      this.emit("ready", data);
    }
  }

  message(update: BaileysEventMap["messages.upsert"]) {
    for (const message of update.messages) {
      if (message.key.fromMe) continue;
      if (message.broadcast) continue;
      this.emit("message", message);
    }
  }

  async sendText(to: string, message: string) {
    if (!this.socket) throw new Error("Client not initialized");

    await this.socket.sendMessage(to, { text: message });
  }
}
