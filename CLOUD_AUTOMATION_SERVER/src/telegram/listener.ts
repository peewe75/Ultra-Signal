import { Telegraf, Context } from 'telegraf';
import { parseSignalMessage, TradeSignal } from './parser';
import { getFirestore } from '../config/firebase';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN not configured');
  process.exit(1);
}

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

interface SignalCallback {
  (signal: TradeSignal): void;
}

let signalCallback: SignalCallback | null = null;

export function onSignal(callback: SignalCallback): void {
  signalCallback = callback;
}

bot.on('message', async (ctx: Context) => {
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

  const signal = parseSignalMessage(text, chatId);

  if (signal) {
    console.log('Signal received:', JSON.stringify(signal, null, 2));

    if (signalCallback) {
      signalCallback(signal);
    } else {
      console.log('No callback registered for signal processing');
    }
  }
});

async function handlePrivateMessage(ctx: Context, text: string, chatId: string): Promise<void> {
  const normalizedText = text.trim();
  console.log(`Handling message: "${normalizedText}" from chatId: ${chatId}`);

  if (normalizedText.startsWith('/start')) {
    await ctx.reply(
      '👋 Benvenuto su BCS AI Auto-Trading!\n\n' +
      'Per attivare i tuoi servizi, invia la tua License Key.\n\n' +
      '💡 Esempio: BCS-ABCD-1234-EFGH\n\n' +
      'Se non l&apos;hai ancora attivata, vai nella tua Dashboard sul sito.'
    );
    return;
  }

  if (normalizedText.startsWith('/sync')) {
    const key = normalizedText.replace('/sync', '').trim();
    if (key) {
      await validateAndLinkLicense(ctx, key, chatId);
    } else {
      await ctx.reply('Usa il comando seguita dalla chiave, es: /sync BCS-XXXX-XXXX');
    }
    return;
  }

  // 1. Prova a vedere se è un Segnale di Trading (prioritario se il testo è lungo)
  const signal = parseSignalMessage(normalizedText, chatId);
  if (signal) {
    console.log('Simulated Signal received in private chat:', JSON.stringify(signal, null, 2));
    if (signalCallback) {
      signalCallback(signal);
      await ctx.reply('✅ Segnale ricevuto! Sto elaborando l\'ordine...');
    } else {
      await ctx.reply('⚠️ Motore di trading non pronto. Riprova tra un istante.');
    }
    return;
  }

  // 2. Se sembra una licenza (BCS- o stringa base64 molto specifica senza spazi)
  const looksLikeLicense = (normalizedText.startsWith('BCS-') && normalizedText.length > 5) ||
    (normalizedText.length > 25 && !normalizedText.includes(' '));

  if (looksLikeLicense) {
    await validateAndLinkLicense(ctx, normalizedText, chatId);
    return;
  }

  await ctx.reply(
    'Non ho riconosciuto il comando.\n\n' +
    '• Per collegarti: invia la tua License Key (BCS-XXXX-XXXX)\n' +
    '• Per i segnali: invia un messaggio nel formato BUY/SELL SYMBOL @ PRICE'
  );
}

async function validateAndLinkLicense(ctx: Context, licenseKey: string, telegramChatId: string): Promise<void> {
  try {
    const firestore = getFirestore();
    console.log(`Validating license key: ${licenseKey} for chatId: ${telegramChatId}`);
    const licensesRef = firestore.collection('licenses');

    // Cerchiamo in due modi per compatibilità: 
    // 1. licenseKey (nuovo formato e storico)
    // 2. license_key (formato dashboard subcollection) -> Note: if they are in top level, they usually use licenseKey.

    let licenseSnapshot = await licensesRef.where('licenseKey', '==', licenseKey).limit(1).get();

    // Se non la troviamo così, proviamo l'altro campo (solo se siamo sicuri della collection)
    if (licenseSnapshot.empty) {
      licenseSnapshot = await licensesRef.where('license_key', '==', licenseKey).limit(1).get();
    }

    if (licenseSnapshot.empty) {
      console.log(`License validation failed for: ${licenseKey}`);
      await ctx.reply('❌ License Key non trovata nel database. Assicurati di averla copiata correttamente dalla Dashboard.');
      return;
    }

    const licenseDoc = licenseSnapshot.docs[0];
    const licenseData = licenseDoc.data();

    if (licenseData.status !== 'ACTIVE') {
      await ctx.reply(`❌ Questa licenza non è attiva (Stato: ${licenseData.status}).`);
      return;
    }

    const userId = licenseData.userId;
    console.log(`License found! Status: ${licenseData.status}, User: ${userId}`);
    if (!userId) {
      console.error(`License ${licenseKey} has no userId! Data:`, licenseData);
      await ctx.reply('❌ Errore interno: licenza non associata a un utente.');
      return;
    }

    const usersRef = firestore.collection('users');
    const userSnapshot = await usersRef.doc(userId).get();

    if (!userSnapshot.exists) {
      await ctx.reply('❌ Utente associato alla licenza non trovato.');
      return;
    }

    await usersRef.doc(userId).update({
      telegramChatId: telegramChatId,
      telegram_id: Number(telegramChatId),
      linkedAt: new Date(),
    });

    console.log(`Successfully linked ${userId} with telegramChatId: ${telegramChatId}`);

    await ctx.reply(
      '✅ *Account Sincronizzato!*\n\n' +
      `Piano: ${licenseData.plan || 'BASIC'}\n` +
      'Il tuo Telegram ID è stato collegato correttamente.\n\n' +
      'Ora puoi configurare il tuo account MT4/MT5 dalla Dashboard Web.',
      { parse_mode: 'Markdown' }
    );

  } catch (error) {
    console.error('Error validating license:', error);
    await ctx.reply('❌ Errore durante la validazione. Riprova più tardi.');
  }
}

export function startListener(): void {
  bot.launch()
    .then(() => {
      console.log('Telegram Bot Listener started');
    })
    .catch((error) => {
      console.error('Failed to start Telegram bot:', error);
    });
}

export function stopListener(): void {
  bot.stop('SIGINT');
}

export { bot };
