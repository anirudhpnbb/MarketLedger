// Mirrors config.py from the original Python prototype (Downloads/files-3).

export const SMA_SHORT = 20;
export const SMA_LONG = 50;
export const RSI_PERIOD = 14;
export const RSI_OVERSOLD = 30;
export const RSI_OVERBOUGHT = 70;
export const MACD_FAST = 12;
export const MACD_SLOW = 26;
export const MACD_SIGNAL = 9;
export const ATR_PERIOD = 14;
export const BOLLINGER_PERIOD = 20;
export const BOLLINGER_STD = 2;

// Composite score ranges from -1 (max bearish) to +1 (max bullish)
export const BUY_THRESHOLD = 0.5;
export const SELL_THRESHOLD = -0.5;

// Risk management
export const ATR_STOPLOSS_MULTIPLIER = 1.5;
export const ATR_TARGET_MULTIPLIER = 3.0;
export const RISK_PER_TRADE_PCT = 1.0;

// Trading-day horizon this rule-set is backtested at. Also used to show a
// "reassess by" date alongside every BUY/SELL -- not a promise the target
// will be hit by then, just the holding period the rules were tested at.
export const HOLDING_PERIOD_DAYS = 10;

export const NEWS_FEEDS = [
  'https://www.moneycontrol.com/rss/business.xml',
  'https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms',
  'https://www.business-standard.com/rss/markets-106.rss',
];
export const NEWS_LOOKBACK_HOURS = 48;
export const NEWS_MAX_HEADLINES_PER_STOCK = 15;

export const DEFAULT_CAPITAL_INR = 100000;

// Nifty Midcap 150 / Smallcap 250 constituent CSVs -- refetched periodically
// on-device so index rebalances (twice yearly, typically March/September)
// are picked up without an app update. See watchlistSource.ts.
export const NIFTY_MIDCAP150_CSV = 'https://niftyindices.com/IndexConstituent/ind_niftymidcap150list.csv';
export const NIFTY_SMALLCAP250_CSV = 'https://niftyindices.com/IndexConstituent/ind_niftysmallcap250list.csv';

// Re-check the index constituent lists at most this often.
export const WATCHLIST_REFRESH_INTERVAL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
