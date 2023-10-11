"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPhone = void 0;
const formatPhone = (number) => {
    if (number.includes('@'))
        number = number.split('@')[0];
    if (number.includes(':'))
        number = number.split(':')[0];
    return number;
};
exports.formatPhone = formatPhone;
