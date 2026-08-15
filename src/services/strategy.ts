import {
  ATR_STOPLOSS_MULTIPLIER,
  ATR_TARGET_MULTIPLIER,
  BUY_THRESHOLD,
  HOLDING_PERIOD_DAYS,
  RISK_PER_TRADE_PCT,
  RSI_OVERBOUGHT,
  RSI_OVERSOLD,
  SELL_THRESHOLD,
} from './config';
import type { Action, IndicatorRow, Sentiment, Signal, WatchlistEntry } from './types';

function technicalScore(row: IndicatorRow): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const close = row.close;

  if (row.sma20 !== undefined && row.sma50 !== undefined) {
    if (close > row.sma20 && row.sma20 > row.sma50) {
      score += 0.25;
      reasons.push(
        `Uptrend: price (${close.toFixed(2)}) is above both the 20-day and 50-day moving averages, and the short-term average is above the long-term one.`
      );
    } else if (close < row.sma20 && row.sma20 < row.sma50) {
      score -= 0.25;
      reasons.push(
        `Downtrend: price (${close.toFixed(2)}) is below both the 20-day and 50-day moving averages, and the short-term average is below the long-term one.`
      );
    }
  }

  if (row.rsi !== undefined) {
    if (row.rsi < RSI_OVERSOLD) {
      score += 0.25;
      reasons.push(`RSI is ${row.rsi.toFixed(1)}, below ${RSI_OVERSOLD} -> stock looks oversold.`);
    } else if (row.rsi > RSI_OVERBOUGHT) {
      score -= 0.25;
      reasons.push(`RSI is ${row.rsi.toFixed(1)}, above ${RSI_OVERBOUGHT} -> stock looks overbought.`);
    }
  }

  if (row.macdHist !== undefined) {
    if (row.macdHist > 0) {
      score += 0.25;
      reasons.push('MACD is above its signal line -> bullish momentum.');
    } else if (row.macdHist < 0) {
      score -= 0.25;
      reasons.push('MACD is below its signal line -> bearish momentum.');
    }
  }

  if (row.bbLower !== undefined && row.bbUpper !== undefined) {
    if (close <= row.bbLower) {
      score += 0.25;
      reasons.push('Price is at/below the lower Bollinger Band -> potentially oversold vs its recent range.');
    } else if (close >= row.bbUpper) {
      score -= 0.25;
      reasons.push('Price is at/above the upper Bollinger Band -> potentially overbought vs its recent range.');
    }
  }

  return { score: Math.max(-1, Math.min(1, score)), reasons };
}

/** Projects HOLDING_PERIOD_DAYS trading days forward, skipping weekends (holidays not accounted for). */
function reassessByDate(holdingPeriodDays: number, from: Date = new Date()): string {
  const d = new Date(from);
  let added = 0;
  while (added < holdingPeriodDays) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return d.toISOString().slice(0, 10);
}

export function generateSignal(
  entry: WatchlistEntry,
  latest: IndicatorRow,
  sentiment: Sentiment,
  capital: number
): Signal {
  const close = latest.close;
  const atr = latest.atr;

  const { score: techScore, reasons } = technicalScore(latest);

  let composite: number;
  if (sentiment.nHeadlines > 0) {
    composite = 0.7 * techScore + 0.3 * sentiment.score;
    const desc = sentiment.score > 0.15 ? 'positive' : sentiment.score < -0.15 ? 'negative' : 'neutral';
    reasons.push(
      `News sentiment across ${sentiment.nHeadlines} recent headline(s) is ${desc} (score ${sentiment.score.toFixed(2)}).`
    );
  } else {
    composite = techScore;
    reasons.push('No recent matching news headlines found; signal is technicals-only.');
  }

  let action: Action = 'HOLD';
  if (composite >= BUY_THRESHOLD) action = 'BUY';
  else if (composite <= SELL_THRESHOLD) action = 'SELL';

  let target: number | null = null;
  let stop: number | null = null;
  let qty: number | null = null;
  let holdingPeriodDays: number | null = null;
  let reassessBy: string | null = null;

  if (action !== 'HOLD' && atr !== undefined && atr > 0) {
    if (action === 'BUY') {
      stop = close - ATR_STOPLOSS_MULTIPLIER * atr;
      target = close + ATR_TARGET_MULTIPLIER * atr;
    } else {
      stop = close + ATR_STOPLOSS_MULTIPLIER * atr;
      target = close - ATR_TARGET_MULTIPLIER * atr;
    }

    const riskPerShare = Math.abs(close - stop);
    const maxRiskCapital = capital * (RISK_PER_TRADE_PCT / 100);
    qty = riskPerShare > 0 ? Math.floor(maxRiskCapital / riskPerShare) : 0;

    holdingPeriodDays = HOLDING_PERIOD_DAYS;
    reassessBy = reassessByDate(holdingPeriodDays);
    reasons.push(
      `Sell target Rs ${target.toFixed(2)} / stop-loss Rs ${stop.toFixed(2)} -- reassess by ${reassessBy} ` +
        `(${holdingPeriodDays} trading days from today, the horizon this rule-set is backtested on) whether ` +
        `or not either level has been hit.`
    );
  }

  return {
    symbol: entry.symbol,
    name: entry.name,
    industry: entry.industry,
    segment: entry.segment,
    action,
    compositeScore: composite,
    entryPrice: close,
    targetPrice: target,
    stopLoss: stop,
    suggestedQty: qty,
    holdingPeriodDays,
    reassessBy,
    reasons,
    newsHeadline: sentiment.topHeadline,
  };
}
