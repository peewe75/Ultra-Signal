import { Telegraf, Context } from 'telegraf';
import { TradeSignal } from './parser';
declare const bot: Telegraf<Context<import("@telegraf/types").Update>>;
interface SignalCallback {
    (signal: TradeSignal): void;
}
export declare function onSignal(callback: SignalCallback): void;
export declare function startListener(): void;
export declare function stopListener(): void;
export { bot };
//# sourceMappingURL=listener.d.ts.map