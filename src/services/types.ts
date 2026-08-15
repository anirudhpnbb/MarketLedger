export type Segment = 'Large-cap' | 'Midcap' | 'Smallcap';

export interface WatchlistEntry {
  symbol: string; // NSE symbol without .NS suffix
  name: string;
  industry: string;
  segment: Segment;
}

export interface Candle {
  date: string; // ISO date
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorRow extends Candle {
  sma20?: number;
  sma50?: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  macdHist?: number;
  atr?: number;
  bbMid?: number;
  bbUpper?: number;
  bbLower?: number;
}

export type Action = 'BUY' | 'SELL' | 'HOLD';

export interface Sentiment {
  score: number;
  nHeadlines: number;
  topHeadline: string | null;
}

export interface Signal {
  symbol: string;
  name: string;
  industry: string;
  segment: Segment;
  action: Action;
  compositeScore: number;
  entryPrice: number;
  targetPrice: number | null;
  stopLoss: number | null;
  suggestedQty: number | null;
  holdingPeriodDays: number | null;
  reassessBy: string | null;
  reasons: string[];
  newsHeadline: string | null;
}

export interface ScanResult {
  computedAt: string; // ISO timestamp
  dateKey: string; // YYYY-MM-DD, local
  scanned: number;
  failed: string[];
  signals: Signal[]; // actionable only (BUY/SELL)
  holds: number;
  topPick: Signal | null;
}
