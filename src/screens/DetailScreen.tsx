import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard } from '../components/GlassCard';
import { ActionPill, SegmentTag } from '../components/Pill';
import { ScreenBackground } from '../components/ScreenBackground';
import { useScan } from '../state/ScanContext';
import { colors, radius, type as t } from '../theme/theme';
import { formatINR, formatScore } from '../utils/format';
import type { ScreenProps } from '../navigation/types';

export function DetailScreen({ navigation, route }: ScreenProps<'Detail'>) {
  const { result } = useScan();
  const insets = useSafeAreaInsets();
  const signal = result?.signals.find((s) => s.symbol === route.params.symbol) ?? result?.topPick;

  if (!signal) {
    return (
      <ScreenBackground>
        <View style={[styles.center, { paddingTop: insets.top }]}>
          <Text style={styles.body}>Signal not found.</Text>
        </View>
      </ScreenBackground>
    );
  }

  const isBuy = signal.action === 'BUY';

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ marginBottom: 14 }}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>

        <View style={styles.headRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.ticker}>{signal.symbol}</Text>
            <Text style={styles.company}>{signal.name}</Text>
          </View>
          <ActionPill action={signal.action} />
        </View>
        <View style={styles.tagRow}>
          <SegmentTag label={signal.segment} />
          <SegmentTag label={signal.industry} />
        </View>

        <GlassCard style={styles.card}>
          <View style={styles.figGrid}>
            <Fig label="Entry" value={formatINR(signal.entryPrice)} />
            <Fig label="Score" value={formatScore(signal.compositeScore)} color={isBuy ? colors.buy : colors.sell} />
            <Fig label="Sell target" value={signal.targetPrice != null ? formatINR(signal.targetPrice) : '—'} color={colors.buy} />
            <Fig label="Stop-loss" value={signal.stopLoss != null ? formatINR(signal.stopLoss) : '—'} color={colors.sell} />
            <Fig label="Reassess by" value={signal.reassessBy ?? '—'} />
            <Fig label="Suggested qty" value={signal.suggestedQty != null ? String(signal.suggestedQty) : '—'} />
          </View>
        </GlassCard>

        <GlassCard style={styles.card} intensity={30}>
          <Text style={styles.h2}>Why</Text>
          <View style={{ gap: 10, marginTop: 10 }}>
            {signal.reasons
              .filter((r) => !r.startsWith('Sell target'))
              .map((r, i) => (
                <View key={i} style={styles.reasonRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.reasonText}>{r}</Text>
                </View>
              ))}
          </View>
        </GlassCard>

        {signal.newsHeadline && (
          <GlassCard style={styles.card} intensity={30}>
            <Text style={styles.h2}>Most relevant headline</Text>
            <Text style={[styles.body, { marginTop: 8, fontStyle: 'italic' }]}>"{signal.newsHeadline}"</Text>
          </GlassCard>
        )}

        <Text style={styles.disclaimer}>
          Not a guarantee the target or stop-loss will be hit by the reassess date — that's the backtested holding
          horizon, not a promise. This is decision support, not investment advice.
        </Text>
      </ScrollView>
    </ScreenBackground>
  );
}

function Fig({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.fig}>
      <Text style={[styles.figValue, color ? { color } : null]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.figLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  back: { ...t.body, color: colors.accent, fontWeight: '600' },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  ticker: { ...t.monoLg, color: colors.text },
  company: { ...t.body, color: colors.textDim, marginTop: 2 },
  tagRow: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 18 },
  card: { borderRadius: radius.lg, padding: 18, marginBottom: 14 },
  figGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 18 },
  fig: { width: '33.33%' },
  figValue: { ...t.mono, color: colors.text, fontSize: 17 },
  figLabel: { ...t.caption, color: colors.textFaint, marginTop: 3, textTransform: 'uppercase' },
  h2: { ...t.h2, color: colors.text },
  body: { ...t.body, color: colors.textDim, lineHeight: 20 },
  reasonRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bullet: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accent, marginTop: 7 },
  reasonText: { ...t.body, color: colors.textDim, flex: 1, lineHeight: 20 },
  disclaimer: { ...t.caption, color: colors.textFaint, textTransform: 'none', lineHeight: 16, marginTop: 4, paddingHorizontal: 4 },
});
