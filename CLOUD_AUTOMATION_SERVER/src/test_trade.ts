import 'dotenv/config';
import { tradingEngine } from './trading/metaApiIntegration';
import { TradeClient } from './services/subscriptionService';

async function testTrade() {
    const client: TradeClient = {
        accountNumber: '101671232',
        password: 'Merlino1976!', // The latest tested password
        brokerServer: 'Ava-Demo 1-MT5',
        userId: 'test_user',
        telegramChatId: '8203155688',
        fixedLots: 0.01,
        allowedSignalSource: '8203155688'
    };

    const signal = {
        symbol: 'GOLD',
        side: 'BUY' as const,
        entryPrice: null,
        stopLoss: null,
        takeProfits: [],
        sourceChatId: '8203155688',
        timestamp: new Date(),
        rawMessage: 'BUY GOLD @ 2650.50 SL: 2640.00 TP1: 2660.00'
    };

    console.log("Triggering test trade for: ", client.accountNumber);
    console.log("Token parts length:", process.env.METAAPI_TOKEN?.split('.').length);
    console.log("Is string?", typeof process.env.METAAPI_TOKEN === 'string');
    try {
        const result = await tradingEngine.executeTrade({ signal, client });
        console.log("Result:", result);
    } catch (error: any) {
        console.error("Critical Failure:", error);
        console.error("HTTP Status:", error.status);
        console.error("Details:", error.details || error.message);
    }
}

testTrade().then(() => {
    console.log("Test execution finished.");
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
