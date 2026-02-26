import { TradeClient, TradeTask } from '../services/subscriptionService';
import { getFirestore } from '../config/firebase';
import { TradeSignal } from '../telegram/parser';
import MetaApi from 'metaapi.cloud-sdk';

export interface TradeResult {
  client: TradeClient;
  success: boolean;
  errorReason?: string;
  orderId?: string;
  executedPrice?: number;
  executedLots?: number;
}

export interface TradeExecutionPayload {
  signal: TradeSignal;
  client: TradeClient;
}

const METAAPI_TOKEN = process.env.METAAPI_TOKEN;

class MetaApiIntegration {
  private token: string;
  private api: any; // MetaApi instance
  private connectionCache: Map<string, any> = new Map();

  constructor() {
    this.token = process.env.METAAPI_TOKEN || METAAPI_TOKEN || '';
    if (!this.token) {
      console.warn('METAAPI_TOKEN not configured - trading execution will fail');
    } else {
      console.log('Using MetaAPI Token starting with:', this.token.substring(0, 30));
      this.api = new MetaApi(this.token);
    }
  }

  async connectToAccount(client: TradeClient): Promise<any> {
    const cacheKey = `${client.brokerServer}-${client.accountNumber}`;

    if (this.connectionCache.has(cacheKey)) {
      return this.connectionCache.get(cacheKey)!;
    }

    if (!this.api) {
      throw new Error("MetaApi token is missing, cannot connect to live account.");
    }

    // Find the account in MetaApi
    const accountsList = await this.api.metatraderAccountApi.getAccountsWithClassicPagination();
    let account = accountsList.items.find((a: any) => a.login === client.accountNumber && a.type.startsWith('cloud'));

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
      connection,
      async getAccountInfo() {
        const info = await connection.getAccountInformation();
        return { balance: info.balance, equity: info.equity };
      },
      async trade(options: any) {
        console.log('Executing live trade:', options);
        try {
          let result;
          const isLimit = options.type === 'LIMIT';
          const isStop = options.type === 'STOP';

          if (options.side === 'BUY') {
            if (isLimit) {
              result = await connection.createLimitBuyOrder(options.symbol, options.volume, options.price, options.stopLoss, options.takeProfit);
            } else if (isStop) {
              result = await connection.createStopBuyOrder(options.symbol, options.volume, options.price, options.stopLoss, options.takeProfit);
            } else {
              result = await connection.createMarketBuyOrder(options.symbol, options.volume, options.stopLoss, options.takeProfit);
            }
          } else { // SELL
            if (isLimit) {
              result = await connection.createLimitSellOrder(options.symbol, options.volume, options.price, options.stopLoss, options.takeProfit);
            } else if (isStop) {
              result = await connection.createStopSellOrder(options.symbol, options.volume, options.price, options.stopLoss, options.takeProfit);
            } else {
              result = await connection.createMarketSellOrder(options.symbol, options.volume, options.stopLoss, options.takeProfit);
            }
          }
          return { orderId: result.orderId, price: result.price || options.price };
        } catch (err: any) {
          throw new Error(`Execution error: ${err.message}`);
        }
      }
    };

    this.connectionCache.set(cacheKey, activeClient);
    return activeClient;
  }

  calculateLotSize(client: TradeClient, accountInfo: { balance: number; equity: number }): number {
    if (client.fixedLots && client.fixedLots > 0) {
      return client.fixedLots;
    }

    if (client.riskPercentage && client.riskPercentage > 0) {
      const riskAmount = (accountInfo.balance || accountInfo.equity) * (client.riskPercentage / 100);
      return Math.round((riskAmount / 1000) * 100) / 100;
    }

    return 0.01;
  }

  async executeTrade(payload: TradeExecutionPayload): Promise<TradeResult> {
    const { signal, client } = payload;

    try {
      const metaApi = await this.connectToAccount(client);

      const accountInfo = await metaApi.getAccountInfo();
      const lotSize = this.calculateLotSize(client, accountInfo);

      const side = signal.side.includes('BUY') ? 'BUY' : 'SELL';

      let orderType: 'MARKET' | 'LIMIT' | 'STOP' = 'MARKET';
      if (signal.entryPrice) {
        try {
          // Fetch current price to decide between LIMIT and STOP
          const priceInfo = await metaApi.connection.getSymbolPrice(signal.symbol);
          const currentPrice = side === 'BUY' ? priceInfo.ask : priceInfo.bid;

          if (side === 'BUY') {
            orderType = signal.entryPrice > currentPrice ? 'STOP' : 'LIMIT';
          } else {
            orderType = signal.entryPrice < currentPrice ? 'STOP' : 'LIMIT';
          }
          console.log(`Current ${signal.symbol} price: ${currentPrice}. Entry: ${signal.entryPrice}. Selected Type: ${orderType}`);
        } catch (e) {
          console.warn(`Could not fetch current price for ${signal.symbol}, defaulting to LIMIT:`, e);
          orderType = 'LIMIT';
        }
      }

      const tradeResult = await metaApi.trade({
        symbol: signal.symbol,
        type: orderType,
        side: side as 'BUY' | 'SELL',
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

    } catch (error: any) {
      const errorMessage = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
      console.error(`Trade failed for ${client.accountNumber}:`, error);

      return {
        client,
        success: false,
        errorReason: errorMessage,
      };
    }
  }
}

const tradingEngine = new MetaApiIntegration();

export async function executeBatchTrades(
  tradeTasks: TradeTask[],
  signal: TradeSignal
): Promise<TradeResult[]> {
  const payloads: TradeExecutionPayload[] = tradeTasks.map(task => ({
    client: task.client,
    signal,
  }));

  const results = await Promise.allSettled(
    payloads.map(payload => tradingEngine.executeTrade(payload))
  );

  const tradeResults: TradeResult[] = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
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

async function logTradeResults(signal: TradeSignal, results: TradeResult[]): Promise<void> {
  try {
    const firestore = getFirestore();

    const logEntry = {
      timestamp: new Date(),
      signal: {
        symbol: signal.symbol,
        side: signal.side,
        entryPrice: signal.entryPrice || null,
        stopLoss: signal.stopLoss || null,
        takeProfits: signal.takeProfits || [],
        sourceChatId: signal.sourceChatId || null,
      },
      results: results.map(r => ({
        accountNumber: r.client.accountNumber,
        brokerServer: r.client.brokerServer,
        success: r.success,
        errorReason: r.errorReason ? String(r.errorReason) : null,
        orderId: r.orderId || null,
        executedPrice: r.executedPrice || null,
        executedLots: r.executedLots || null,
      })),
      totalClients: results.length,
      successfulTrades: results.filter(r => r.success).length,
      failedTrades: results.filter(r => !r.success).length,
    };

    await firestore.collection('trade_logs').add(logEntry);
    console.log(`Trade results logged to Firestore: ${results.length} clients processed`);

  } catch (error) {
    console.error('Failed to log trade results:', error);
  }
}

export { tradingEngine };
