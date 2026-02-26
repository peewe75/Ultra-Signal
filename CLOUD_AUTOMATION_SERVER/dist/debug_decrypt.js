"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const passwordHex = "039341a0fadf09bf0625dff9b60dd5c55e59fddeefedf23d47f1c95c8faa56a4";
const fallbackKey = "default-32-char-encryption-key!";
function tryDecrypt() {
    const encryptionKey = fallbackKey;
    const key = crypto_1.default.scryptSync(encryptionKey, 'salt', 32);
    const iv = Buffer.from(passwordHex.slice(0, 32), 'hex');
    const encrypted = Buffer.from(passwordHex.slice(32), 'hex');
    const decipher = crypto_1.default.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    console.log("Decrypted successfully:", decrypted.toString());
}
try {
    tryDecrypt();
}
catch (e) {
    console.error("Fallback key failed:", e);
}
//# sourceMappingURL=debug_decrypt.js.map