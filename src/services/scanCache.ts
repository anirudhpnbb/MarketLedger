import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ScanResult } from './types';

const INDEX_KEY = 'scan_index_v1';
const SCAN_KEY = (dateKey: string) => `scan_v1_${dateKey}`;
const MAX_HISTORY = 30;

async function getIndex(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(INDEX_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveScan(result: ScanResult): Promise<void> {
  await AsyncStorage.setItem(SCAN_KEY(result.dateKey), JSON.stringify(result));
  const index = await getIndex();
  const next = [result.dateKey, ...index.filter((k) => k !== result.dateKey)].slice(0, MAX_HISTORY);
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(next));
}

export async function getScan(dateKey: string): Promise<ScanResult | null> {
  const raw = await AsyncStorage.getItem(SCAN_KEY(dateKey));
  return raw ? JSON.parse(raw) : null;
}

/** Most recent cached scan, whatever its date -- used for instant cold-start display. */
export async function getLatestScan(): Promise<ScanResult | null> {
  const index = await getIndex();
  if (index.length === 0) return null;
  return getScan(index[0]);
}

/** The cached scan immediately before `dateKey`, if any -- used for the "same as yesterday" check. */
export async function getPreviousScan(dateKey: string): Promise<ScanResult | null> {
  const index = await getIndex();
  const pos = index.indexOf(dateKey);
  const prevKey = pos === -1 ? index[0] : index[pos + 1];
  return prevKey ? getScan(prevKey) : null;
}
