import { Telegraf } from 'telegraf';

const bot = new Telegraf('8792161984:AAG1e1EeNmvYfuxhP2YKkBf1jQwFx93lY4g');

bot.start((ctx) => {
    console.log('Received /start command!');
    ctx.reply('Test bot is alive! Please send your license key.');
});

bot.on('text', (ctx) => {
    console.log('Received text:', ctx.message.text);
    ctx.reply(`Received: ${ctx.message.text}`);
});

bot.launch().then(() => {
    console.log('Isolated Test Bot Started Successfully.');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
