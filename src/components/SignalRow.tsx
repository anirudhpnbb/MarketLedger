import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionPill, SegmentTag } from './Pill';
import { colors, type as t } from '../theme/theme';
import { formatINR } from '../utils/format';
import type { Signal } from '../services/types';

export function SignalRow({ signal, onPress }: { signal: Signal; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.left}>
        <Text style={styles.ticker}>{signal.symbol}</Text>
        <Text style={styles.company} numberOfLines={1}>
          {signal.name}
        </Text>
        <SegmentTag label={signal.segment} />
      </View>
      <View style={styles.right}>
        <ActionPill action={signal.action} />
        <Text style={styles.entry}>{formatINR(signal.entryPrice)}</Text>
        <Text style={styles.target}>→ {signal.targetPrice != null ? formatINR(signal.targetPrice) : '—'}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  pressed: { opacity: 0.6 },
  left: { flex: 1, gap: 3, paddingRight: 10 },
  ticker: { ...t.mono, color: colors.text, fontSize: 16 },
  company: { ...t.caption, color: colors.textDim, textTransform: 'none' },
  right: { alignItems: 'flex-end', gap: 4 },
  entry: { ...t.mono, color: colors.text, fontSize: 13 },
  target: { ...t.mono, color: colors.textFaint, fontSize: 12 },
});
