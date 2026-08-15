import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_CAPITAL_INR } from './config';

const CAPITAL_KEY = 'settings_capital_inr';

export async function getCapital(): Promise<number> {
  const raw = await AsyncStorage.getItem(CAPITAL_KEY);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_CAPITAL_INR;
}

export async function setCapital(value: number): Promise<void> {
  await AsyncStorage.setItem(CAPITAL_KEY, String(value));
}
