import { TradeSignal } from '../telegram/parser';
import { TradeClient, TradeTask } from '../services/subscriptionService';
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
declare class MetaApiIntegration {
    private token;
    private api;
    private connectionCache;
    constructor();
    connectToAccount(client: TradeClient): Promise<any>;
    calculateLotSize(client: TradeClient, accountInfo: {
        balance: number;
        equity: number;
    }): number;
    executeTrade(payload: TradeExecutionPayload): Promise<TradeResult>;
}
declare const tradingEngine: MetaApiIntegration;
export declare function executeBatchTrades(tradeTasks: TradeTask[], signal: TradeSignal): Promise<TradeResult[]>;
export { tradingEngine };
//# sourceMappingURL=metaApiIntegration.d.ts.map