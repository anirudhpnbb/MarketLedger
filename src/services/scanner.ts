import { computeAll } from './indicators';
import { fetchRecentHeadlines, getSentimentForSymbol, type Headline } from './newsSentiment';
import { generateSignal } from './strategy';
import { getWatchlist } from './watchlistSource';
import { fetchPriceHistoryBatch } from './yahooFinance';
import type { ScanResult, Signal } from './types';

export interface ScanProgress {
  stage: 'watchlist' | 'news' | 'prices' | 'signals' | 'done';
  done: number;
  total: number;
}

export async function runScan(
  capital: number,
  onProgress?: (p: ScanProgress) => void
): Promise<ScanResult> {
  onProgress?.({ stage: 'watchlist', done: 0, total: 1 });
  const { entries } = await getWatchlist();
  const symbols = entries.map((e) => e.symbol);
  onProgress?.({ stage: 'watchlist', done: 1, total: 1 });

  onProgress?.({ stage: 'news', done: 0, total: 1 });
  let headlines: Headline[] = [];
  try {
    headlines = await fetchRecentHeadlines();
  } catch {
    headlines = [];
  }
  onProgress?.({ stage: 'news', done: 1, total: 1 });

  const { data: priceData, failed: priceFailed } = await fetchPriceHistoryBatch(symbols, {
    concurrency: 10,
    onProgress: (done, total) => onProgress?.({ stage: 'prices', done, total }),
  });

  const signals: Signal[] = [];
  let holds = 0;
  const failed = new Set(priceFailed);

  entries.forEach((entry, i) => {
    onProgress?.({ stage: 'signals', done: i + 1, total: entries.length });
    const candles = priceData.get(entry.symbol);
    if (!candles || candles.length < 51) {
      failed.add(entry.symbol);
      return;
    }
    try {
      const rows = computeAll(candles);
      const latest = rows[rows.length - 1];
      const sentiment = getSentimentForSymbol(entry.symbol, headlines);
      const sig = generateSignal(entry, latest, sentiment, capital);
      if (sig.action === 'HOLD') {
        holds++;
      } else {
        signals.push(sig);
      }
    } catch {
      failed.add(entry.symbol);
    }
  });

  const topPick =
    signals
      .filter((s) => s.action === 'BUY')
      .sort((a, b) => b.compositeScore - a.compositeScore)[0] ?? null;

  const now = new Date();
  onProgress?.({ stage: 'done', done: entries.length, total: entries.length });

  return {
    computedAt: now.toISOString(),
    dateKey: localDateKey(now),
    scanned: entries.length,
    failed: Array.from(failed),
    signals,
    holds,
    topPick,
  };
}

export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
