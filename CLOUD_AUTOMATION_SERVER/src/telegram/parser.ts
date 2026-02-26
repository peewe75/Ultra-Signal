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

const GARBAGE_PATTERNS = [
  /^(buon|buongiorno|buonasera|ciao|hello|hi|hey)/i,
  /(grazie|thanks|thank you)/i,
  /(profit|pprofit|guadagno|prelievo|deposito|bonus)/i,
  /(chiuso|closed|stop|terminate)/i,
  /^\s*$/,
  /^[\d\s]*$/,
];

function isGarbargeMessage(text: string): boolean {
  return GARBAGE_PATTERNS.some(pattern => pattern.test(text.trim()));
}

const SIDE_PATTERNS = [
  /\b(BUY|SELL|BUY\s*LIMIT|SELL\s*LIMIT|BUY\s*STOP|SELL\s*STOP)\b/i,
];

const SYMBOL_PATTERNS = [
  /\b(XAUUSD|XAUUSD\.?|GOLD|XTIUSD|WTI|Brent|BCO)\b/i,
  /\b(EURUSD|GBPUSD|USDJPY|USDCHF|AUDUSD|USDCAD|NZDUSD)\b/i,
  /\b(EURJPY|GBPJPY|AUDJPY|NZDJPY|CADJPY|CHFJPY)\b/i,
  /\b(EURGBP|EURCHF|AUDNZD|CADCHF|AUDCAD|GBPAUD|GBPCAD)\b/i,
  /\b(US30|US500|US100|NAS100|NASDAQ|DOW|JPN225|NIKKEI|GER40|UK100|FRA40|EU50)\b/i,
  /\b([A-Z]{2,6}\d{3,6}|[A-Z]{3,6})\b/i,
];

const ENTRY_PATTERNS = [
  /entry[:\s]*[@\s]*([\d.]+)/i,
  /price[:\s]*[@\s]*([\d.]+)/i,
  /(@\s*)?([\d.]+)/,
  /(?:entrance|enter|entry\s*price)[:\s]*([\d.]+)/i,
];

const SL_PATTERNS = [
  /sl[:\s]*([\d.]+)/i,
  /(?:stop\s*loss|stoploss)[:\s]*([\d.]+)/i,
];

const TP_PATTERNS = [
  /tp1[:\s]*([\d.]+)/i,
  /tp2[:\s]*([\d.]+)/i,
  /tp3[:\s]*([\d.]+)/i,
  /tp[:\s]*([\d.]+)/i,
  /(?:take\s*profit|takeprofit)[:\s]*([\d.]+)/gi,
];

function extractSide(text: string): TradeSignal['side'] | null {
  const normalized = text.toUpperCase();
  
  if (normalized.includes('BUY LIMIT')) return 'BUY_LIMIT';
  if (normalized.includes('SELL LIMIT')) return 'SELL_LIMIT';
  if (normalized.includes('BUY STOP')) return 'BUY_STOP';
  if (normalized.includes('SELL STOP')) return 'SELL_STOP';
  if (normalized.includes('BUY')) return 'BUY';
  if (normalized.includes('SELL')) return 'SELL';
  
  return null;
}

function extractSymbol(text: string): string | null {
  for (const pattern of SYMBOL_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return match[0].toUpperCase().replace(/\./g, '');
    }
  }
  return null;
}

function extractPrice(text: string, patterns: RegExp[]): number | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const price = parseFloat(match[1] || match[2]);
      if (!isNaN(price) && price > 0) {
        return price;
      }
    }
  }
  return null;
}

function extractStopLoss(text: string): number | null {
  return extractPrice(text, SL_PATTERNS);
}

function extractTakeProfits(text: string): number[] {
  const tps: number[] = [];
  
  const tp1Match = text.match(/tp1[:\s]*([\d.]+)/i);
  if (tp1Match) tps.push(parseFloat(tp1Match[1]));
  
  const tp2Match = text.match(/tp2[:\s]*([\d.]+)/i);
  if (tp2Match) tps.push(parseFloat(tp2Match[1]));
  
  const tp3Match = text.match(/tp3[:\s]*([\d.]+)/i);
  if (tp3Match) tps.push(parseFloat(tp3Match[1]));
  
  const genericTpMatches = text.matchAll(/(?:tp|take\s*profit)[:\s]*([\d.]+)/gi);
  for (const match of genericTpMatches) {
    const tp = parseFloat(match[1]);
    if (!tps.includes(tp)) {
      tps.push(tp);
    }
  }
  
  return tps.sort((a, b) => a - b);
}

export function parseSignalMessage(text: string, sourceChatId: string): TradeSignal | null {
  if (isGarbargeMessage(text)) {
    return null;
  }

  const side = extractSide(text);
  if (!side) {
    return null;
  }

  const symbol = extractSymbol(text);
  if (!symbol) {
    return null;
  }

  const entryPrice = extractEntryPrice(text);
  const stopLoss = extractStopLoss(text);
  const takeProfits = extractTakeProfits(text);

  if (!entryPrice && !stopLoss && takeProfits.length === 0) {
    return null;
  }

  return {
    side,
    symbol,
    entryPrice,
    stopLoss,
    takeProfits,
    sourceChatId,
    timestamp: new Date(),
    rawMessage: text,
  };
}

function extractEntryPrice(text: string): number | null {
  const atMatch = text.match(/@\s*([\d.]+)/);
  if (atMatch) {
    return parseFloat(atMatch[1]);
  }
  
  return extractPrice(text, ENTRY_PATTERNS);
}

export function validateSignal(signal: TradeSignal): boolean {
  if (!signal.symbol || signal.symbol.length < 2) {
    return false;
  }

  if (signal.side && !['BUY', 'SELL', 'BUY_LIMIT', 'SELL_LIMIT', 'BUY_STOP', 'SELL_STOP'].includes(signal.side)) {
    return false;
  }

  return true;
}
