export interface TradeSignal {
    side: 'BUY' | 'SELL' | 'BUY_LIMIT' | 'SELL_LIMIT' | 'BUY_STOP' | 'SELL_STOP';
    symbol: string;
    entryPrice: number | null;
    stopLoss: number | null;
    takeProfits: number[];
    sourceChatId: string;
    timestamp: Date;
    rawMessage: string;
}
export declare function parseSignalMessage(text: string, sourceChatId: string): TradeSignal | null;
export declare function validateSignal(signal: TradeSignal): boolean;
//# sourceMappingURL=parser.d.ts.map