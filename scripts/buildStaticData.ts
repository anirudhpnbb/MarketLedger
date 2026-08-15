// Runs in plain Node (CI), never in the browser -- so none of these requests
// are subject to browser CORS. Produces the JSON files the web build reads
// at runtime instead of hitting Yahoo Finance / RSS feeds / niftyindices.com
// directly from the browser, which is blocked by CORS on those hosts.
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import Papa from 'papaparse';

import seedWatchlist from '../src/data/watchlist.json';
import { NIFTY_MIDCAP150_CSV, NIFTY_SMALLCAP250_CSV } from '../src/services/config';
import { fetchRecentHeadlines } from '../src/services/newsSentiment';
import type { Segment, WatchlistEntry } from '../src/services/types';
import { fetchPriceHistoryBatch } from '../src/services/yahooFinance';

const OUT_DIR = join(__dirname, '..', 'public', 'data');

async function fetchIndexCsv(url: string, segment: Segment): Promise<WatchlistEntry[]> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' },
  });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  const text = await res.text();
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  return parsed.data
    .filter((row) => row['Symbol'] && row['Company Name'])
    .map((row) => ({
      symbol: row['Symbol'].trim(),
      name: row['Company Name'].trim(),
      industry: (row['Industry'] || 'Unknown').trim(),
      segment,
    }));
}

async function buildWatchlist(): Promise<WatchlistEntry[]> {
  const anchors = (seedWatchlist as WatchlistEntry[]).filter((r) => r.segment === 'Large-cap');
  try {
    const [mid, small] = await Promise.all([
      fetchIndexCsv(NIFTY_MIDCAP150_CSV, 'Midcap'),
      fetchIndexCsv(NIFTY_SMALLCAP250_CSV, 'Smallcap'),
    ]);
    if (mid.length > 50 && small.length > 50) {
      return [...anchors, ...mid, ...small];
    }
    console.warn('Index CSVs looked too small, falling back to seed watchlist');
  } catch (err) {
    console.warn('Index CSV fetch failed, falling back to seed watchlist:', err);
  }
  return seedWatchlist as WatchlistEntry[];
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const fetchedAt = Date.now();

  console.log('Fetching watchlist...');
  const entries = await buildWatchlist();
  writeFileSync(join(OUT_DIR, 'watchlist.json'), JSON.stringify({ fetchedAt, entries }));
  console.log(`  ${entries.length} entries`);

  console.log('Fetching headlines...');
  const headlines = await fetchRecentHeadlines();
  writeFileSync(join(OUT_DIR, 'headlines.json'), JSON.stringify({ fetchedAt, headlines }));
  console.log(`  ${headlines.length} headlines`);

  console.log(`Fetching prices for ${entries.length} tickers (this takes a few minutes)...`);
  const { data, failed } = await fetchPriceHistoryBatch(
    entries.map((e) => e.symbol),
    { concurrency: 8, onProgress: (done, total) => { if (done % 25 === 0 || done === total) console.log(`  ${done}/${total}`); } }
  );
  const prices: Record<string, unknown> = {};
  for (const [symbol, candles] of data) prices[symbol] = candles;
  writeFileSync(join(OUT_DIR, 'prices.json'), JSON.stringify({ fetchedAt, prices }));
  console.log(`  ${data.size} ok, ${failed.length} failed${failed.length ? ': ' + failed.slice(0, 10).join(', ') + (failed.length > 10 ? '...' : '') : ''}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
