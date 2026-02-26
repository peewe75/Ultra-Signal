"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bot = void 0;
exports.onSignal = onSignal;
exports.startListener = startListener;
exports.stopListener = stopListener;
const telegraf_1 = require("telegraf");
const parser_1 = require("./parser");
const firebase_1 = require("../config/firebase");
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN not configured');
    process.exit(1);
}
const bot = new telegraf_1.Telegraf(TELEGRAM_BOT_TOKEN);
exports.bot = bot;
let signalCallback = null;
function onSignal(callback) {
    signalCallback = callback;
}
bot.on('message', async (ctx) => {
    console.log('Incoming update type:', ctx.updateType);
    const message = ctx.message;
    if (!message) {
        console.log('Update has no message attached.');
        return;
    }
    if (!('text' in message) || !message.text) {
        console.log('Message has no text attached.');
        return;
    }
    const chatId = message.chat.id.toString();
    const text = message.text;
    console.log(`Received text message from ${chatId}: ${text}`);
    if ('private' in message.chat || message.chat.type === 'private') {
        console.log('Message is private, routing to handler.');
        await handlePrivateMessage(ctx, text, chatId);
        return;
    }
    const signal = (0, parser_1.parseSignalMessage)(text, chatId);
    if (signal) {
        console.log('Signal received:', JSON.stringify(signal, null, 2));
        if (signalCallback) {
            signalCallback(signal);
        }
        else {
            console.log('No callback registered for signal processing');
        }
    }
});
async function handlePrivateMessage(ctx, text, chatId) {
    if (text.startsWith('/start')) {
        await ctx.reply('Benvenuto su SoftiBridge Auto-Trading!\n\n' +
            'Invia la tua License Key (es. SB-XXXX-XXXX-XXXX) per collegare il tuo account.');
        return;
    }
    const licenseKey = text.trim();
    // Strict check for license key format (SB-XXXX-XXXX-XXXX)
    if (licenseKey.startsWith('SB-') && licenseKey.length > 10) {
        await validateAndLinkLicense(ctx, licenseKey, chatId);
        return;
    }
    // If it's not a start command and not a license key, let's see if it's a simulated signal sent in private chat
    const signal = (0, parser_1.parseSignalMessage)(text, chatId);
    if (signal) {
        console.log('Simulated Signal received in private chat:', JSON.stringify(signal, null, 2));
        if (signalCallback) {
            signalCallback(signal);
            await ctx.reply('✅ Segnale di test riconosciuto e inviato al motore di esecuzione!');
        }
        return;
    }
    await ctx.reply('Per favore, invia una License Key valida (formato: SB-XXXX-XXXX-XXXX)\n' +
        'oppure usa /start per ricevere istruzioni.');
}
async function validateAndLinkLicense(ctx, licenseKey, telegramChatId) {
    try {
        const firestore = (0, firebase_1.getFirestore)();
        const licensesRef = firestore.collection('licenses');
        const licenseSnapshot = await licensesRef.where('licenseKey', '==', licenseKey).limit(1).get();
        if (licenseSnapshot.empty) {
            await ctx.reply('❌ License Key non valida. Contatta il supporto.');
            return;
        }
        const licenseDoc = licenseSnapshot.docs[0];
        const licenseData = licenseDoc.data();
        if (licenseData.status !== 'ACTIVE') {
            await ctx.reply(`❌ Licenza non attiva. Stato: ${licenseData.status}`);
            return;
        }
        const userId = licenseData.userId;
        const usersRef = firestore.collection('users');
        const userSnapshot = await usersRef.doc(userId).get();
        if (!userSnapshot.exists) {
            await ctx.reply('❌ Utente non trovato. Contatta il supporto.');
            return;
        }
        await usersRef.doc(userId).update({
            telegramChatId: telegramChatId,
            linkedAt: new Date(),
        });
        await ctx.reply('✅ *Configurazione Completata!*\n\n' +
            'Il tuo Account è collegato.\n' +
            'Tutto funzionerà in automatico.', { parse_mode: 'Markdown' });
    }
    catch (error) {
        console.error('Error validating license:', error);
        await ctx.reply('❌ Errore durante la validazione. Riprova più tardi.');
    }
}
function startListener() {
    bot.launch()
        .then(() => {
        console.log('Telegram Bot Listener started');
    })
        .catch((error) => {
        console.error('Failed to start Telegram bot:', error);
    });
}
function stopListener() {
    bot.stop('SIGINT');
}
//# sourceMappingURL=listener.js.map