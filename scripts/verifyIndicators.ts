import { fetchPriceHistoryBatch } from '../src/services/yahooFinance';
import { computeAll } from '../src/services/indicators';

async function main() {
  const { data } = await fetchPriceHistoryBatch(['RELIANCE'], { concurrency: 1 });
  const candles = data.get('RELIANCE');
  if (!candles) throw new Error('no data');
  const rows = computeAll(candles);
  const last = rows[rows.length - 1];
  console.log(
    JSON.stringify(
      {
        close: last.close,
        sma20: last.sma20,
        sma50: last.sma50,
        rsi: last.rsi,
        macd: last.macd,
        macdSignal: last.macdSignal,
        macdHist: last.macdHist,
        atr: last.atr,
        bbMid: last.bbMid,
        bbUpper: last.bbUpper,
        bbLower: last.bbLower,
      },
      null,
      2
    )
  );
}

main();
