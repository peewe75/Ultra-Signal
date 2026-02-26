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

  if (normalizedText.startsWith('/start')) {
    await ctx.reply(
      '👋 Benvenuto su SoftiBridge Auto-Trading!\n\n' +
      'Per attivare i tuoi servizi, invia la tua License Key.\n\n' +
      '💡 Esempio: SB-ABCD-1234-EFGH\n\n' +
      'Se non l&apos;hai ancora attivata, vai nella tua Dashboard sul sito.'
    );
    return;
  }

  if (normalizedText.startsWith('/sync')) {
    const key = normalizedText.replace('/sync', '').trim();
    if (key) {
      await validateAndLinkLicense(ctx, key, chatId);
    } else {
      await ctx.reply('Usa il comando seguita dalla chiave, es: /sync SB-XXXX-XXXX');
    }
    return;
  }

  // Se sembra una licenza (SB- o stringa lunga base64)
  if ((normalizedText.startsWith('SB-') && normalizedText.length > 5) || normalizedText.length > 20) {
    await validateAndLinkLicense(ctx, normalizedText, chatId);
    return;
  }

  // If it's not a start command and not a license key, let's see if it's a simulated signal sent in private chat
  const signal = parseSignalMessage(normalizedText, chatId);
  if (signal) {
    console.log('Simulated Signal received in private chat:', JSON.stringify(signal, null, 2));
    if (signalCallback) {
      signalCallback(signal);
      await ctx.reply('✅ Segnale di test riconosciuto e inviato al motore di esecuzione!');
    }
    return;
  }

  await ctx.reply(
    'Invia una License Key valida per collegare il tuo account.\n' +
    'Oppure usa /help per maggiori informazioni.'
  );
}

async function validateAndLinkLicense(ctx: Context, licenseKey: string, telegramChatId: string): Promise<void> {
  try {
    const firestore = getFirestore();
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
    if (!userId) {
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
      telegram_id: Number(telegramChatId), // Aggiorniamo anche questo per coerenza
      linkedAt: new Date(),
    });

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
