"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppAPI = void 0;
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const pino_1 = __importDefault(require("pino"));
const events_1 = __importDefault(require("events"));
const helpers_1 = require("./helpers");
const fs_1 = __importDefault(require("fs"));
class WhatsAppAPI extends events_1.default {
    constructor(options) {
        var _a;
        super();
        this.path = './wp-session';
        this.options = options;
        if ((_a = this.options) === null || _a === void 0 ? void 0 : _a.sessionPath) {
            this.path = this.options.sessionPath;
        }
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            let { state, saveCreds } = yield (0, baileys_1.useMultiFileAuthState)(this.path);
            const { version } = yield (0, baileys_1.fetchLatestWaWebVersion)({});
            const socketOptions = {
                printQRInTerminal: false,
                auth: state,
                //@ts-ignore
                logger: (0, pino_1.default)({ level: 'silent' }),
                version,
            };
            if ((_a = this.options) === null || _a === void 0 ? void 0 : _a.deviceName) {
                socketOptions.browser = [this.options.deviceName, 'Safari', '3.0'];
            }
            if ((_b = this.options) === null || _b === void 0 ? void 0 : _b.baileysOptions) {
                Object.assign(socketOptions, this.options.baileysOptions);
            }
            this.socket = (0, baileys_1.default)(socketOptions);
            this.socket.ev.on('creds.update', saveCreds);
            this.socket.ev.on('connection.update', this.connectionUpdate.bind(this));
            this.socket.ev.on('messages.upsert', this.message.bind(this));
        });
    }
    restart() {
        var _a, _b, _c;
        (_a = this.socket) === null || _a === void 0 ? void 0 : _a.ev.removeAllListeners('creds.update');
        (_b = this.socket) === null || _b === void 0 ? void 0 : _b.ev.removeAllListeners('connection.update');
        (_c = this.socket) === null || _c === void 0 ? void 0 : _c.ev.removeAllListeners('messages.upsert');
    }
    disconnect() {
        this.restart();
        const files = fs_1.default.readdirSync(this.path);
        for (const file of files) {
            fs_1.default.unlinkSync(`${this.path}/${file}`);
        }
    }
    connectionUpdate(update) {
        var _a, _b, _c, _d;
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            this.emit('qr', qr);
        }
        if (connection === 'close') {
            const shouldReconnect = ((_b = (_a = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.statusCode) !== baileys_1.DisconnectReason.loggedOut;
            if (shouldReconnect) {
                this.initialize();
            }
            else {
                this.disconnect();
                this.emit('disconnect', update);
            }
        }
        else if (connection === 'open') {
            let data = (0, helpers_1.clone)((_c = this.socket) === null || _c === void 0 ? void 0 : _c.authState.creds.me);
            if (!data)
                return;
            //data.id = formatPhone(data.id);
            data.session = ((_d = this.socket) === null || _d === void 0 ? void 0 : _d.authState.creds.myAppStateKeyId) ? true : false;
            this.emit('ready', data);
        }
    }
    message(update) {
        var _a, _b, _c, _d, _e, _f, _g;
        for (const _message of update.messages) {
            if (_message.key.fromMe)
                continue;
            if (_message.broadcast)
                continue;
            if (!_message.key.remoteJid)
                continue;
            if (!_message.message)
                continue;
            let text = ((_a = _message.message) === null || _a === void 0 ? void 0 : _a.conversation) || '';
            const type = Object.keys(_message === null || _message === void 0 ? void 0 : _message.message)[0];
            if (type === 'videoMessage')
                text = ((_c = (_b = _message.message) === null || _b === void 0 ? void 0 : _b.videoMessage) === null || _c === void 0 ? void 0 : _c.caption) || '';
            if (type === 'imageMessage')
                text = ((_e = (_d = _message.message) === null || _d === void 0 ? void 0 : _d.imageMessage) === null || _e === void 0 ? void 0 : _e.caption) || '';
            if (type === 'extendedTextMessage')
                text = ((_g = (_f = _message.message) === null || _f === void 0 ? void 0 : _f.extendedTextMessage) === null || _g === void 0 ? void 0 : _g.text) || '';
            const message = {
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
    reply(message, text) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.socket)
                throw new Error('Client not initialized');
            yield this.socket.sendMessage(message.from, { text }, { quoted: message.data });
        });
    }
    sendText(to, message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.socket)
                throw new Error('Client not initialized');
            yield this.socket.sendMessage(to, { text: message });
        });
    }
}
exports.WhatsAppAPI = WhatsAppAPI;
