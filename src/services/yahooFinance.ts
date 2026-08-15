import { mapWithConcurrency } from './concurrency';
import type { Candle } from './types';

const CHART_ENDPOINT = 'https://query1.finance.yahoo.com/v8/finance/chart';

// True only when running in a real browser DOM (react-native-web on the
// exported web build); false on native and in plain-Node CLI scripts, both
// of which should do the live fetch below. Deliberately not react-native's
// Platform.OS: importing 'react-native' breaks plain-Node execution of this
// file (esbuild/tsx can't parse its Flow syntax outside Metro), which is
// exactly the environment scripts/buildStaticData.ts runs in.
const isWeb = typeof document !== 'undefined';

// Yahoo's chart endpoint doesn't send Access-Control-Allow-Origin, so direct
// browser fetches are CORS-blocked. On web we instead read a snapshot built
// server-side (no CORS there) by scripts/buildStaticData.ts in CI.
let webPricesPromise: Promise<Record<string, Candle[]>> | null = null;
function loadWebPrices(): Promise<Record<string, Candle[]>> {
  if (!webPricesPromise) {
    webPricesPromise = fetch('./data/prices.json')
      .then((res) => (res.ok ? res.json() : { prices: {} }))
      .then((json) => json.prices ?? {})
      .catch(() => ({}));
  }
  return webPricesPromise;
}
// A phone-style UA; the public chart endpoint works fine with this and no
// crumb/cookie handshake, unlike some of Yahoo's other endpoints.
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15';

async function fetchOne(ticker: string, range: string, timeoutMs: number): Promise<Candle[] | null> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(
      `${CHART_ENDPOINT}/${encodeURIComponent(ticker)}.NS?range=${range}&interval=1d`,
      { headers: { 'User-Agent': UA }, signal: controller.signal }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const timestamps: number[] = result.timestamp ?? [];
    const quote = result.indicators?.quote?.[0] ?? {};
    const opens: (number | null)[] = quote.open ?? [];
    const highs: (number | null)[] = quote.high ?? [];
    const lows: (number | null)[] = quote.low ?? [];
    const closes: (number | null)[] = quote.close ?? [];
    const volumes: (number | null)[] = quote.volume ?? [];
    // Dividend/split-adjusted close, when Yahoo includes it. Using raw
    // `close` alone makes indicators jump across ex-dividend dates as if
    // the price had actually moved -- adjusting OHLC by the same ratio
    // (what yfinance's auto_adjust=True does) avoids that artifact.
    const adjCloses: (number | null)[] | undefined = result.indicators?.adjclose?.[0]?.adjclose;

    const candles: Candle[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] == null || opens[i] == null || highs[i] == null || lows[i] == null) continue;
      const rawClose = closes[i] as number;
      const adjClose = adjCloses?.[i] ?? rawClose;
      const ratio = rawClose !== 0 ? adjClose / rawClose : 1;
      candles.push({
        date: new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
        open: (opens[i] as number) * ratio,
        high: (highs[i] as number) * ratio,
        low: (lows[i] as number) * ratio,
        close: adjClose,
        volume: volumes[i] ?? 0,
      });
    }
    return candles.length > 0 ? candles : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export interface PriceHistoryResult {
  data: Map<string, Candle[]>;
  failed: string[];
}

/**
 * Fetches daily OHLCV history for many NSE tickers directly from Yahoo
 * Finance's public chart endpoint (same data source as yfinance, no API
 * key). Concurrency-limited since this runs on-device rather than through
 * a batch endpoint.
 */
export async function fetchPriceHistoryBatch(
  tickers: string[],
  opts: { range?: string; concurrency?: number; timeoutMs?: number; onProgress?: (done: number, total: number) => void } = {}
): Promise<PriceHistoryResult> {
  const { range = '6mo', concurrency = 8, timeoutMs = 12000, onProgress } = opts;
  const data = new Map<string, Candle[]>();
  const failed: string[] = [];

  if (isWeb) {
    const prices = await loadWebPrices();
    tickers.forEach((ticker, i) => {
      const candles = prices[ticker];
      if (candles && candles.length > 0) data.set(ticker, candles);
      else failed.push(ticker);
      onProgress?.(i + 1, tickers.length);
    });
    return { data, failed };
  }

  await mapWithConcurrency(
    tickers,
    concurrency,
    async (ticker) => {
      const candles = await fetchOne(ticker, range, timeoutMs);
      if (candles) {
        data.set(ticker, candles);
      } else {
        failed.push(ticker);
      }
    },
    onProgress
  );

  return { data, failed };
}
