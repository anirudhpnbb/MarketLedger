import { useCallback, useEffect, useRef, useState } from 'react';

import { getCapital } from '../services/settingsStore';
import { getLatestScan, getPreviousScan, getScan, saveScan } from '../services/scanCache';
import { localDateKey, runScan, type ScanProgress } from '../services/scanner';
import type { ScanResult } from '../services/types';

export interface DailyScanState {
  result: ScanResult | null;
  isStale: boolean; // showing a cached result from a day before today
  sameAsYesterday: boolean;
  loading: boolean;
  progress: ScanProgress | null;
  error: string | null;
  refresh: (force?: boolean) => void;
}

export function useDailyScan(): DailyScanState {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [sameAsYesterday, setSameAsYesterday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const runToken = useRef(0);

  const load = useCallback(async (force: boolean) => {
    const token = ++runToken.current;
    setError(null);
    const todayKey = localDateKey(new Date());

    // Show whatever we have immediately so the UI is never blank.
    const latest = await getLatestScan();
    if (token !== runToken.current) return;
    if (latest) {
      setResult(latest);
      setIsStale(latest.dateKey !== todayKey);
    }

    const cachedToday = force ? null : await getScan(todayKey);
    if (cachedToday) {
      setResult(cachedToday);
      setIsStale(false);
      const prev = await getPreviousScan(todayKey);
      setSameAsYesterday(Boolean(prev?.topPick && cachedToday.topPick && prev.topPick.symbol === cachedToday.topPick.symbol));
      setLoading(false);
      return;
    }

    setLoading(true);
    setProgress({ stage: 'watchlist', done: 0, total: 1 });
    try {
      const capital = await getCapital();
      const fresh = await runScan(capital, (p) => {
        if (token === runToken.current) setProgress(p);
      });
      if (token !== runToken.current) return;
      await saveScan(fresh);
      const prev = await getPreviousScan(fresh.dateKey);
      setResult(fresh);
      setIsStale(false);
      setSameAsYesterday(Boolean(prev?.topPick && fresh.topPick && prev.topPick.symbol === fresh.topPick.symbol));
    } catch (e: any) {
      if (token === runToken.current) setError(e?.message ?? 'Scan failed');
    } finally {
      if (token === runToken.current) {
        setLoading(false);
        setProgress(null);
      }
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const refresh = useCallback((force = true) => load(force), [load]);

  return { result, isStale, sameAsYesterday, loading, progress, error, refresh };
}
