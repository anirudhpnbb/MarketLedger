import { XMLParser } from 'fast-xml-parser';
import { SentimentIntensityAnalyzer } from 'vader-sentiment';

import aliasesData from '../data/aliases.json';
import { NEWS_FEEDS, NEWS_LOOKBACK_HOURS, NEWS_MAX_HEADLINES_PER_STOCK } from './config';
import type { Sentiment } from './types';

// See the comment on the equivalent constant in yahooFinance.ts.
const isWeb = typeof document !== 'undefined';

const aliases: Record<string, string[]> = aliasesData as Record<string, string[]>;

export interface Headline {
  title: string;
  link: string;
  publishedAt: number | null; // epoch ms
  source: string;
}

const parser = new XMLParser({ ignoreAttributes: true, trimValues: true });

function toArray<T>(v: T | T[] | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

async function fetchFeed(url: string): Promise<Headline[]> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return [];
    const xml = await res.text();
    const doc = parser.parse(xml);
    const items = toArray(doc?.rss?.channel?.item);
    return items
      .map((item: any): Headline => {
        const title = String(item?.title ?? '').trim();
        const pubDateStr = item?.pubDate ? String(item.pubDate) : null;
        const parsed = pubDateStr ? Date.parse(pubDateStr) : NaN;
        return {
          title,
          link: String(item?.link ?? ''),
          publishedAt: Number.isNaN(parsed) ? null : parsed,
          source: url,
        };
      })
      .filter((h) => h.title.length > 0);
  } catch {
    return [];
  }
}

// Some of the configured RSS feeds don't send Access-Control-Allow-Origin,
// so direct browser fetches are CORS-blocked for at least one feed. On web
// we read a snapshot built server-side (no CORS there) by
// scripts/buildStaticData.ts in CI instead of hitting the feeds directly.
async function fetchWebHeadlines(): Promise<Headline[]> {
  try {
    const res = await fetch('./data/headlines.json');
    if (!res.ok) return [];
    const json = await res.json();
    return json.headlines ?? [];
  } catch {
    return [];
  }
}

/** Fetches and dedupes headlines across all configured RSS feeds within the lookback window. */
export async function fetchRecentHeadlines(maxAgeHours = NEWS_LOOKBACK_HOURS): Promise<Headline[]> {
  const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
  const results = isWeb ? [await fetchWebHeadlines()] : await Promise.all(NEWS_FEEDS.map(fetchFeed));
  const seen = new Set<string>();
  const headlines: Headline[] = [];
  for (const feedHeadlines of results) {
    for (const h of feedHeadlines) {
      if (seen.has(h.title)) continue;
      if (h.publishedAt !== null && h.publishedAt < cutoff) continue;
      seen.add(h.title);
      headlines.push(h);
    }
  }
  return headlines;
}

export function headlinesForSymbol(symbol: string, headlines: Headline[]): Headline[] {
  const symbolAliases = aliases[symbol] ?? [symbol.toLowerCase()];
  const matched = headlines.filter((h) => {
    const lower = h.title.toLowerCase();
    return symbolAliases.some((alias) => lower.includes(alias));
  });
  return matched.slice(0, NEWS_MAX_HEADLINES_PER_STOCK);
}

export function scoreSentiment(headlines: Headline[]): Sentiment {
  if (headlines.length === 0) return { score: 0, nHeadlines: 0, topHeadline: null };

  let sum = 0;
  let topHeadline: string | null = null;
  let topAbs = 0;
  for (const h of headlines) {
    const compound = SentimentIntensityAnalyzer.polarity_scores(h.title).compound;
    sum += compound;
    if (Math.abs(compound) >= topAbs) {
      topAbs = Math.abs(compound);
      topHeadline = h.title;
    }
  }
  return { score: sum / headlines.length, nHeadlines: headlines.length, topHeadline };
}

export function getSentimentForSymbol(symbol: string, headlinesCache: Headline[]): Sentiment {
  return scoreSentiment(headlinesForSymbol(symbol, headlinesCache));
}
