import AsyncStorage from '@react-native-async-storage/async-storage';
import Papa from 'papaparse';

import seedWatchlist from '../data/watchlist.json';
import {
  NIFTY_MIDCAP150_CSV,
  NIFTY_SMALLCAP250_CSV,
  WATCHLIST_REFRESH_INTERVAL_MS,
} from './config';
import type { Segment, WatchlistEntry } from './types';

// See the comment on the equivalent constant in yahooFinance.ts.
const isWeb = typeof document !== 'undefined';

const CACHE_KEY = 'watchlist_v1';
const LARGE_CAP_ANCHORS: WatchlistEntry[] = (seedWatchlist as WatchlistEntry[]).filter(
  (r) => r.segment === 'Large-cap'
);

interface WatchlistCache {
  fetchedAt: number;
  entries: WatchlistEntry[];
}

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

async function fetchWebWatchlist(): Promise<WatchlistEntry[]> {
  const res = await fetch('./data/watchlist.json');
  if (!res.ok) throw new Error(`web watchlist -> HTTP ${res.status}`);
  const json = await res.json();
  return json.entries ?? [];
}

/**
 * Nifty Midcap 150 / Smallcap 250 membership changes roughly twice a year
 * (NSE rebalances in March/September). Rather than shipping a list that
 * silently goes stale, this re-fetches the official constituent CSVs from
 * niftyindices.com at most once every WATCHLIST_REFRESH_INTERVAL_MS and
 * caches the result on-device. On any failure (offline, site down, schema
 * change) it falls back to the last good cache, then to the bundled seed
 * captured when this app was built.
 */
export async function getWatchlist(forceRefresh = false): Promise<{
  entries: WatchlistEntry[];
  source: 'live' | 'cache' | 'seed';
  fetchedAt: number | null;
}> {
  const cachedRaw = await AsyncStorage.getItem(CACHE_KEY);
  const cached: WatchlistCache | null = cachedRaw ? JSON.parse(cachedRaw) : null;

  const isStale = !cached || Date.now() - cached.fetchedAt > WATCHLIST_REFRESH_INTERVAL_MS;

  if (forceRefresh || isStale) {
    try {
      // niftyindices.com doesn't send CORS headers, so on web we read the
      // snapshot scripts/buildStaticData.ts builds server-side in CI instead
      // of fetching the constituent CSVs directly from the browser.
      const entries: WatchlistEntry[] = isWeb
        ? await fetchWebWatchlist()
        : await (async () => {
            const [mid, small] = await Promise.all([
              fetchIndexCsv(NIFTY_MIDCAP150_CSV, 'Midcap'),
              fetchIndexCsv(NIFTY_SMALLCAP250_CSV, 'Smallcap'),
            ]);
            if (mid.length <= 50 || small.length <= 50) throw new Error('index CSVs too small');
            return [...LARGE_CAP_ANCHORS, ...mid, ...small];
          })();
      if (entries.length > 50) {
        const fresh: WatchlistCache = { fetchedAt: Date.now(), entries };
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
        return { entries, source: 'live', fetchedAt: fresh.fetchedAt };
      }
    } catch {
      // fall through to cache / seed below
    }
  }

  if (cached) {
    return { entries: cached.entries, source: 'cache', fetchedAt: cached.fetchedAt };
  }

  return { entries: seedWatchlist as WatchlistEntry[], source: 'seed', fetchedAt: null };
}
