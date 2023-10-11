"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clone = void 0;
const clone = (obj) => JSON.parse(JSON.stringify(obj));
exports.clone = clone;
