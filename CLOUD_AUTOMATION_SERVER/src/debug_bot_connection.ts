import 'dotenv/config';
import { Telegraf } from 'telegraf';

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    console.error('❌ ERRORE: TELEGRAM_BOT_TOKEN non trovato nel file .env');
    process.exit(1);
}

const bot = new Telegraf(token);

console.log('--- TEST CONNESSIONE BOT ---');
console.log('Token rilevato:', token.substring(0, 10) + '...');

bot.telegram.getMe()
    .then((me) => {
        console.log('✅ CONNESSIONE RIUSCITA!');
        console.log('Nome Bot:', me.first_name);
        console.log('Username Bot: @' + me.username);
        console.log('ID Bot:', me.id);
        console.log('\nSe il bot non risponde a /start, assicurati che il server sia acceso con:');
        console.log('npm run dev (nella cartella CLOUD_AUTOMATION_SERVER)');
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ ERRORE CONNESSIONE:', err.message);
        console.log('\nVerifica che il token sia corretto e che non ci siano firewall che bloccano le API di Telegram.');
        process.exit(1);
    });
