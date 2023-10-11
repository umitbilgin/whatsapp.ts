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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
class WhatsAppAPI extends events_1.default {
    constructor(options) {
        super();
        this.options = options;
    }
    initialize() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Client initializing...');
            let { state, saveCreds } = yield (0, baileys_1.useMultiFileAuthState)(((_a = this.options) === null || _a === void 0 ? void 0 : _a.sessionPath) || './wp-session');
            const { version } = yield (0, baileys_1.fetchLatestWaWebVersion)({});
            const socketOptions = {
                printQRInTerminal: false,
                auth: state,
                //@ts-ignore
                logger: (0, pino_1.default)({ level: 'silent' }),
                version,
            };
            if ((_b = this.options) === null || _b === void 0 ? void 0 : _b.deviceName) {
                socketOptions.browser = [this.options.deviceName, 'Safari', '3.0'];
            }
            this.socket = (0, baileys_1.default)(socketOptions);
            this.socket.ev.on('creds.update', saveCreds);
            this.socket.ev.on('connection.update', this.connectionUpdate.bind(this));
            this.socket.ev.on('messages.upsert', this.message.bind(this));
        });
    }
    connectionUpdate(update) {
        var _a, _b, _c;
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            this.emit('qr', qr);
        }
        if (connection === 'close') {
            const shouldReconnect = ((_b = (_a = lastDisconnect.error) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.statusCode) !== baileys_1.DisconnectReason.loggedOut;
            if (shouldReconnect)
                this.initialize();
        }
        else if (connection === 'open') {
            let data = (0, helpers_1.clone)((_c = this.socket) === null || _c === void 0 ? void 0 : _c.authState.creds.me);
            if (!data)
                return;
            data.id = (0, helpers_1.formatPhone)(data.id);
            this.emit('ready', data);
        }
    }
    message(update) {
        for (const message of update.messages) {
            if (message.key.fromMe)
                continue;
            if (message.broadcast)
                continue;
            this.emit('message', message);
        }
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
