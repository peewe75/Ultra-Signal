import { TradeSignal } from '../telegram/parser';
export interface TradeClient {
    userId: string;
    accountNumber: string;
    brokerServer: string;
    password: string;
    riskPercentage?: number;
    fixedLots?: number;
    allowedSignalSource: string;
    telegramChatId?: string;
}
export interface TradeTask {
    client: TradeClient;
    signal: TradeSignal;
}
export declare function getActiveAccountsForSource(signalSourceId: string): Promise<TradeClient[]>;
export declare function getAllActiveClientsForSignal(signal: TradeSignal): Promise<TradeTask[]>;
//# sourceMappingURL=subscriptionService.d.ts.map