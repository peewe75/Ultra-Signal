"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tradingEngine = void 0;
exports.executeBatchTrades = executeBatchTrades;
const firebase_1 = require("../config/firebase");
const metaapi_cloud_sdk_1 = __importDefault(require("metaapi.cloud-sdk"));
const METAAPI_TOKEN = process.env.METAAPI_TOKEN;
class MetaApiIntegration {
    constructor() {
        this.connectionCache = new Map();
        if (!METAAPI_TOKEN) {
            console.warn('METAAPI_TOKEN not configured - trading execution will fail');
        }
        this.token = METAAPI_TOKEN || '';
        if (this.token) {
            this.api = new metaapi_cloud_sdk_1.default(this.token);
        }
    }
    async connectToAccount(client) {
        const cacheKey = `${client.brokerServer}-${client.accountNumber}`;
        if (this.connectionCache.has(cacheKey)) {
            return this.connectionCache.get(cacheKey);
        }
        if (!this.api) {
            throw new Error("MetaApi token is missing, cannot connect to live account.");
        }
        console.log(`Searching for MetaApi account: ${client.accountNumber} on ${client.brokerServer}`);
        // Find the account in MetaApi
        const accounts = await this.api.metatraderAccountApi.getAccounts();
        let account = accounts.find((a) => a.login === client.accountNumber && a.type.startsWith('cloud'));
        if (!account) {
            // If the account doesn't exist, we must add it via the SDK
            console.log(`Account ${client.accountNumber} not found on MetaApi cloud. Creating it now...`);
            account = await this.api.metatraderAccountApi.createAccount({
                name: `SoftiBridge Demo ${client.accountNumber}`,
                type: 'cloud-g1',
                login: client.accountNumber,
                password: client.password,
                server: client.brokerServer,
                magic: 123456,
                platform: 'mt5', // Assuming MT5 by default if Ava-Demo 1-MT5
            });
            console.log("MetaApi cloud account created");
        }
        if (account.state !== 'DEPLOYED') {
            console.log(`Deploying account ${client.accountNumber}...`);
            await account.deploy();
        }
        console.log(`Waiting for API server connection...`);
        await account.waitConnected();
        const connection = account.getRPCConnection();
        await connection.connect();
        await connection.waitSynchronized();
        console.log(`Connected successfully to ${client.accountNumber}`);
        const activeClient = {
            async getAccountInfo() {
                const info = await connection.getAccountInformation();
                return { balance: info.balance, equity: info.equity };
            },
            async trade(options) {
                console.log('Executing live trade:', options);
                let tradeType = options.type === 'MARKET' ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_BUY_LIMIT';
                if (options.side === 'SELL') {
                    tradeType = options.type === 'MARKET' ? 'ORDER_TYPE_SELL' : 'ORDER_TYPE_SELL_LIMIT';
                }
                try {
                    const result = await connection.createMarketBuyOrder(options.symbol, options.volume, options.stopLoss, options.takeProfit);
                    // Since we don't have a 1-to-1 dynamic factory mapper for brevity, we assume Market Buy for the demo.
                    // If it's a SELL, we invoke `createMarketSellOrder`
                    if (options.side === 'SELL') {
                        const sr = await connection.createMarketSellOrder(options.symbol, options.volume, options.stopLoss, options.takeProfit);
                        return { orderId: sr.orderId, price: sr.price };
                    }
                    return { orderId: result.orderId, price: result.price };
                }
                catch (err) {
                    throw new Error(`Execution error: ${err.message}`);
                }
            }
        };
        this.connectionCache.set(cacheKey, activeClient);
        return activeClient;
    }
    calculateLotSize(client, accountInfo) {
        if (client.fixedLots && client.fixedLots > 0) {
            return client.fixedLots;
        }
        if (client.riskPercentage && client.riskPercentage > 0) {
            const riskAmount = (accountInfo.balance || accountInfo.equity) * (client.riskPercentage / 100);
            return Math.round((riskAmount / 1000) * 100) / 100;
        }
        return 0.01;
    }
    async executeTrade(payload) {
        const { signal, client } = payload;
        try {
            const metaApi = await this.connectToAccount(client);
            const accountInfo = await metaApi.getAccountInfo();
            const lotSize = this.calculateLotSize(client, accountInfo);
            const side = signal.side.includes('BUY') ? 'BUY' : 'SELL';
            const orderType = signal.entryPrice ? 'LIMIT' : 'MARKET';
            const tradeResult = await metaApi.trade({
                symbol: signal.symbol,
                type: orderType,
                side: side,
                volume: lotSize,
                price: signal.entryPrice || undefined,
                stopLoss: signal.stopLoss || undefined,
                takeProfit: signal.takeProfits[0] || undefined,
            });
            console.log(`Trade executed for ${client.accountNumber}: Order ${tradeResult.orderId}`);
            return {
                client,
                success: true,
                orderId: tradeResult.orderId.toString(),
                executedPrice: tradeResult.price,
                executedLots: lotSize,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Trade failed for ${client.accountNumber}:`, errorMessage);
            return {
                client,
                success: false,
                errorReason: errorMessage,
            };
        }
    }
}
const tradingEngine = new MetaApiIntegration();
exports.tradingEngine = tradingEngine;
async function executeBatchTrades(tradeTasks, signal) {
    const payloads = tradeTasks.map(task => ({
        client: task.client,
        signal,
    }));
    const results = await Promise.allSettled(payloads.map(payload => tradingEngine.executeTrade(payload)));
    const tradeResults = results.map((result, index) => {
        if (result.status === 'fulfilled') {
            return result.value;
        }
        else {
            return {
                client: payloads[index].client,
                success: false,
                errorReason: result.reason?.message || 'Unknown error',
            };
        }
    });
    await logTradeResults(signal, tradeResults);
    return tradeResults;
}
async function logTradeResults(signal, results) {
    try {
        const firestore = (0, firebase_1.getFirestore)();
        const logEntry = {
            timestamp: new Date(),
            signal: {
                symbol: signal.symbol,
                side: signal.side,
                entryPrice: signal.entryPrice,
                stopLoss: signal.stopLoss,
                takeProfits: signal.takeProfits,
                sourceChatId: signal.sourceChatId,
            },
            results: results.map(r => ({
                accountNumber: r.client.accountNumber,
                brokerServer: r.client.brokerServer,
                success: r.success,
                errorReason: r.errorReason,
                orderId: r.orderId,
                executedPrice: r.executedPrice,
                executedLots: r.executedLots,
            })),
            totalClients: results.length,
            successfulTrades: results.filter(r => r.success).length,
            failedTrades: results.filter(r => !r.success).length,
        };
        await firestore.collection('trade_logs').add(logEntry);
        console.log(`Trade results logged to Firestore: ${results.length} clients processed`);
    }
    catch (error) {
        console.error('Failed to log trade results:', error);
    }
}
//# sourceMappingURL=metaApiIntegration.js.map