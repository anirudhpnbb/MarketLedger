import {
  ATR_PERIOD,
  BOLLINGER_PERIOD,
  BOLLINGER_STD,
  MACD_FAST,
  MACD_SIGNAL,
  MACD_SLOW,
  RSI_PERIOD,
  SMA_LONG,
  SMA_SHORT,
} from './config';
import type { Candle, IndicatorRow } from './types';

function sma(values: number[], period: number, i: number): number | undefined {
  if (i + 1 < period) return undefined;
  let sum = 0;
  for (let k = i - period + 1; k <= i; k++) sum += values[k];
  return sum / period;
}

/** Sample stdev (ddof=1), matching pandas' default .rolling().std(). */
function stdev(values: number[], period: number, i: number, mean: number): number | undefined {
  if (i + 1 < period) return undefined;
  let sumSq = 0;
  for (let k = i - period + 1; k <= i; k++) sumSq += (values[k] - mean) ** 2;
  return Math.sqrt(sumSq / (period - 1));
}

/** Wilder-style EWM with alpha = 1/period, matching pandas .ewm(alpha=1/period, min_periods=period). */
function ewmAlpha(values: number[], period: number): (number | undefined)[] {
  const alpha = 1 / period;
  const out: (number | undefined)[] = new Array(values.length).fill(undefined);
  let prev: number | undefined;
  for (let i = 0; i < values.length; i++) {
    if (Number.isNaN(values[i])) continue;
    prev = prev === undefined ? values[i] : alpha * values[i] + (1 - alpha) * prev;
    out[i] = i >= period - 1 ? prev : undefined;
  }
  return out;
}

/** Standard EMA with span, matching pandas .ewm(span=span, adjust=False). */
function ewmSpan(values: number[], span: number): number[] {
  const alpha = 2 / (span + 1);
  const out: number[] = new Array(values.length);
  let prev = values[0];
  out[0] = prev;
  for (let i = 1; i < values.length; i++) {
    prev = alpha * values[i] + (1 - alpha) * prev;
    out[i] = prev;
  }
  return out;
}

export function computeAll(candles: Candle[]): IndicatorRow[] {
  const n = candles.length;
  const closes = candles.map((c) => c.close);
  const rows: IndicatorRow[] = candles.map((c) => ({ ...c }));

  // SMA 20 / 50
  for (let i = 0; i < n; i++) {
    rows[i].sma20 = sma(closes, SMA_SHORT, i);
    rows[i].sma50 = sma(closes, SMA_LONG, i);
  }

  // RSI (Wilder smoothing of gains/losses)
  const gains: number[] = new Array(n).fill(NaN);
  const losses: number[] = new Array(n).fill(NaN);
  for (let i = 1; i < n; i++) {
    const delta = closes[i] - closes[i - 1];
    gains[i] = Math.max(delta, 0);
    losses[i] = Math.max(-delta, 0);
  }
  const avgGain = ewmAlpha(gains, RSI_PERIOD);
  const avgLoss = ewmAlpha(losses, RSI_PERIOD);
  for (let i = 0; i < n; i++) {
    const ag = avgGain[i];
    const al = avgLoss[i];
    if (ag === undefined || al === undefined) {
      rows[i].rsi = 50; // neutral when undefined, matches indicators.py fillna(50)
    } else if (al === 0) {
      rows[i].rsi = 100;
    } else {
      const rs = ag / al;
      rows[i].rsi = 100 - 100 / (1 + rs);
    }
  }

  // MACD
  const emaFast = ewmSpan(closes, MACD_FAST);
  const emaSlow = ewmSpan(closes, MACD_SLOW);
  const macd = emaFast.map((v, i) => v - emaSlow[i]);
  const macdSignal = ewmSpan(macd, MACD_SIGNAL);
  for (let i = 0; i < n; i++) {
    rows[i].macd = macd[i];
    rows[i].macdSignal = macdSignal[i];
    rows[i].macdHist = macd[i] - macdSignal[i];
  }

  // ATR
  const tr: number[] = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    const highLow = candles[i].high - candles[i].low;
    if (i === 0) {
      tr[i] = highLow;
    } else {
      const highClose = Math.abs(candles[i].high - candles[i - 1].close);
      const lowClose = Math.abs(candles[i].low - candles[i - 1].close);
      tr[i] = Math.max(highLow, highClose, lowClose);
    }
  }
  const atr = ewmAlpha(tr, ATR_PERIOD);
  for (let i = 0; i < n; i++) rows[i].atr = atr[i];

  // Bollinger Bands
  for (let i = 0; i < n; i++) {
    const mid = sma(closes, BOLLINGER_PERIOD, i);
    if (mid === undefined) continue;
    const sd = stdev(closes, BOLLINGER_PERIOD, i, mid);
    rows[i].bbMid = mid;
    rows[i].bbUpper = mid + BOLLINGER_STD * (sd ?? 0);
    rows[i].bbLower = mid - BOLLINGER_STD * (sd ?? 0);
  }

  return rows;
}
