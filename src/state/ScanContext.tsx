import React, { createContext, useContext } from 'react';

import { useDailyScan, type DailyScanState } from '../hooks/useDailyScan';

const ScanContext = createContext<DailyScanState | null>(null);

export function ScanProvider({ children }: { children: React.ReactNode }) {
  const state = useDailyScan();
  return <ScanContext.Provider value={state}>{children}</ScanContext.Provider>;
}

export function useScan(): DailyScanState {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error('useScan must be used within ScanProvider');
  return ctx;
}
