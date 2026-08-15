import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { GlassCard } from './GlassCard';
import { colors, gradient, radius, type as t } from '../theme/theme';
import { formatINR, formatScore } from '../utils/format';
import type { Signal } from '../services/types';

export function TopPickCard({
  signal,
  sameAsYesterday,
  onPress,
}: {
  signal: Signal;
  sameAsYesterday: boolean;
  onPress: () => void;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);

  useEffect(() => {
    opacity.value = withDelay(80, withTiming(1, { duration: 420 }));
    translateY.value = withDelay(80, withTiming(0, { duration: 420 }));
  }, [signal.symbol]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
      >
        <View style={styles.glowWrap}>
          <LinearGradient colors={gradient.gold} style={styles.glowBorder} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <GlassCard style={styles.card} intensity={55}>
            <View style={styles.eyebrowRow}>
              <Text style={styles.eyebrow}>TODAY'S TOP PICK</Text>
              {sameAsYesterday && (
                <View style={styles.samePill}>
                  <Text style={styles.samePillText}>same as yesterday</Text>
                </View>
              )}
            </View>

            <View style={styles.headlineRow}>
              <Text style={styles.ticker}>{signal.symbol}</Text>
              <Text style={styles.score}>{formatScore(signal.compositeScore)}</Text>
            </View>
            <Text style={styles.company} numberOfLines={1}>
              {signal.name} · {signal.segment}
            </Text>

            <View style={styles.figRow}>
              <Fig label="Entry" value={formatINR(signal.entryPrice)} />
              <Fig label="Sell target" value={signal.targetPrice != null ? formatINR(signal.targetPrice) : '—'} accent="buy" />
              <Fig label="Stop-loss" value={signal.stopLoss != null ? formatINR(signal.stopLoss) : '—'} accent="sell" />
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Reassess by {signal.reassessBy ?? '—'}</Text>
              <Text style={styles.chevron}>Details ›</Text>
            </View>
          </GlassCard>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function Fig({ label, value, accent }: { label: string; value: string; accent?: 'buy' | 'sell' }) {
  const color = accent === 'buy' ? colors.buy : accent === 'sell' ? colors.sell : colors.text;
  return (
    <View style={styles.fig}>
      <Text style={[styles.figValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.figLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  glowWrap: { borderRadius: radius.xl + 2, padding: 1.5, shadowColor: colors.accent, shadowOpacity: 0.35, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } },
  glowBorder: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: radius.xl + 2 },
  card: { borderRadius: radius.xl, padding: 20 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { ...t.caption, color: colors.accent, fontWeight: '700', letterSpacing: 1.2 },
  samePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.08)' },
  samePillText: { ...t.caption, color: colors.textDim, fontWeight: '500' },
  headlineRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 10 },
  ticker: { ...t.monoLg, color: colors.text, fontSize: 32 },
  score: { ...t.mono, color: colors.buy, fontSize: 16 },
  company: { ...t.body, fontFamily: undefined, fontStyle: 'italic', color: colors.textDim, marginTop: 2 },
  figRow: { flexDirection: 'row', marginTop: 18, gap: 8 },
  fig: { flex: 1 },
  figValue: { ...t.mono, fontSize: 17 },
  figLabel: { ...t.caption, color: colors.textFaint, marginTop: 3, textTransform: 'uppercase' },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  footerText: { ...t.caption, color: colors.textDim, textTransform: 'none' },
  chevron: { ...t.caption, color: colors.accent, textTransform: 'none', fontWeight: '700' },
});
