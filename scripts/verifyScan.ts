import { computeAll } from '../src/services/indicators';
import { fetchRecentHeadlines, getSentimentForSymbol } from '../src/services/newsSentiment';
import { generateSignal } from '../src/services/strategy';
import { fetchPriceHistoryBatch } from '../src/services/yahooFinance';
import type { WatchlistEntry } from '../src/services/types';

const sample: WatchlistEntry[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', industry: 'Large-cap anchor', segment: 'Large-cap' },
  { symbol: 'INFY', name: 'Infosys Ltd.', industry: 'Large-cap anchor', segment: 'Large-cap' },
  { symbol: 'JUBLFOOD', name: 'Jubilant Foodworks Ltd.', industry: 'Consumer Services', segment: 'Midcap' },
  { symbol: 'DIXON', name: 'Dixon Technologies (India) Ltd.', industry: 'Consumer Durables', segment: 'Midcap' },
  { symbol: 'SUZLON', name: 'Suzlon Energy Ltd.', industry: 'Capital Goods', segment: 'Midcap' },
];

async function main() {
  console.log('Fetching headlines...');
  const headlines = await fetchRecentHeadlines();
  console.log(`  ${headlines.length} headlines\n`);

  console.log('Fetching prices...');
  const { data, failed } = await fetchPriceHistoryBatch(sample.map((s) => s.symbol), { concurrency: 5 });
  console.log(`  ${data.size} ok, ${failed.length} failed\n`);

  for (const entry of sample) {
    const candles = data.get(entry.symbol);
    if (!candles) {
      console.log(entry.symbol, 'NO DATA');
      continue;
    }
    const rows = computeAll(candles);
    const latest = rows[rows.length - 1];
    const sentiment = getSentimentForSymbol(entry.symbol, headlines);
    const sig = generateSignal(entry, latest, sentiment, 100000);
    console.log(`${sig.symbol} -> ${sig.action} (score ${sig.compositeScore.toFixed(2)})`);
    console.log(`  entry ${sig.entryPrice.toFixed(2)} target ${sig.targetPrice?.toFixed(2)} stop ${sig.stopLoss?.toFixed(2)} reassessBy ${sig.reassessBy}`);
    sig.reasons.forEach((r) => console.log('  -', r));
    console.log();
  }
}

main();
