import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { GlassCard } from './GlassCard';
import { colors, radius, type as t } from '../theme/theme';
import type { ScanProgress } from '../services/scanner';

const STAGE_LABEL: Record<ScanProgress['stage'], string> = {
  watchlist: 'Checking constituent list…',
  news: 'Reading today’s headlines…',
  prices: 'Fetching prices',
  signals: 'Scoring signals',
  done: 'Done',
};

export function ScanProgressView({ progress }: { progress: ScanProgress | null }) {
  const pct = progress && progress.total > 0 ? progress.done / progress.total : 0;
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(pct, { duration: 260 });
  }, [pct]);

  const barStyle = useAnimatedStyle(() => ({ width: `${Math.max(4, width.value * 100)}%` }));

  return (
    <GlassCard style={styles.card} intensity={35}>
      <Text style={styles.title}>Scanning today's watchlist</Text>
      <Text style={styles.subtitle}>
        {progress ? STAGE_LABEL[progress.stage] : 'Starting…'}
        {progress && progress.total > 1 ? `  ${progress.done}/${progress.total}` : ''}
      </Text>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, barStyle]} />
      </View>
      <Text style={styles.note}>First run of the day computes on-device across the full universe — usually well under a minute.</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: 18 },
  title: { ...t.h2, color: colors.text },
  subtitle: { ...t.body, color: colors.textDim, marginTop: 4 },
  track: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 14, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.accent },
  note: { ...t.caption, color: colors.textFaint, marginTop: 12, textTransform: 'none', lineHeight: 16 },
});
