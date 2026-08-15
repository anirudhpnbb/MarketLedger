import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard } from '../components/GlassCard';
import { ScreenBackground } from '../components/ScreenBackground';
import { SignalRow } from '../components/SignalRow';
import { useScan } from '../state/ScanContext';
import { colors, radius, type as t } from '../theme/theme';
import type { ScreenProps } from '../navigation/types';
import type { Action, Signal } from '../services/types';

type SegFilter = 'ALL' | 'Large-cap' | 'Midcap' | 'Smallcap';

export function SignalsScreen({ navigation, route }: ScreenProps<'Signals'>) {
  const { result } = useScan();
  const insets = useSafeAreaInsets();
  const [actionFilter, setActionFilter] = useState<'ALL' | Action>(route.params?.initialFilter ?? 'ALL');
  const [segFilter, setSegFilter] = useState<SegFilter>('ALL');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const signals = result?.signals ?? [];
    const q = query.trim().toLowerCase();
    return signals
      .filter((s) => actionFilter === 'ALL' || s.action === actionFilter)
      .filter((s) => segFilter === 'ALL' || s.segment === segFilter)
      .filter(
        (s) =>
          !q ||
          s.symbol.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.industry.toLowerCase().includes(q)
      )
      .sort((a, b) => b.compositeScore - a.compositeScore);
  }, [result, actionFilter, segFilter, query]);

  return (
    <ScreenBackground>
      <View style={{ flex: 1, paddingTop: insets.top + 10 }}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
          <Text style={styles.count}>
            {filtered.length} of {result?.signals.length ?? 0}
          </Text>
        </View>
        <Text style={styles.title}>Signals</Text>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search ticker, company, industry…"
          placeholderTextColor={colors.textFaint}
          style={styles.search}
          autoCorrect={false}
        />

        <View style={styles.segRow}>
          {(['ALL', 'BUY', 'SELL'] as const).map((v) => (
            <Chip key={v} label={v === 'ALL' ? 'All' : v === 'BUY' ? 'Buy' : 'Sell'} active={actionFilter === v} onPress={() => setActionFilter(v)} />
          ))}
        </View>
        <View style={styles.segRow}>
          {(['ALL', 'Large-cap', 'Midcap', 'Smallcap'] as const).map((v) => (
            <Chip key={v} label={v === 'ALL' ? 'All caps' : v} active={segFilter === v} onPress={() => setSegFilter(v)} />
          ))}
        </View>

        <GlassCard style={styles.listCard} intensity={25}>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.symbol}
            style={{ flex: 1 }}
            renderItem={({ item }: { item: Signal }) => (
              <SignalRow signal={item} onPress={() => navigation.navigate('Detail', { symbol: item.symbol })} />
            )}
            contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 4 }}
            ListEmptyComponent={<Text style={styles.empty}>No signals match these filters.</Text>}
            keyboardShouldPersistTaps="handled"
          />
        </GlassCard>
      </View>
    </ScreenBackground>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18 },
  back: { ...t.body, color: colors.accent, fontWeight: '600' },
  count: { ...t.caption, color: colors.textFaint, textTransform: 'none' },
  title: { ...t.display, color: colors.text, paddingHorizontal: 18, marginTop: 6, marginBottom: 12 },
  search: {
    marginHorizontal: 18,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    color: colors.text,
    fontSize: 15,
  },
  segRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 18, marginBottom: 8, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineStrong,
  },
  chipActive: { backgroundColor: colors.text, borderColor: colors.text },
  chipText: { ...t.caption, color: colors.textDim, textTransform: 'none', fontWeight: '600' },
  chipTextActive: { color: colors.bg0 },
  listCard: { flex: 1, marginTop: 8, marginHorizontal: 18, marginBottom: 18, borderRadius: radius.lg, overflow: 'hidden' },
  empty: { ...t.body, color: colors.textFaint, textAlign: 'center', paddingVertical: 30 },
});
