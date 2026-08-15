import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, type as t } from '../theme/theme';
import type { Action } from '../services/types';

export function ActionPill({ action }: { action: Action }) {
  const isBuy = action === 'BUY';
  return (
    <View style={[styles.pill, { backgroundColor: isBuy ? colors.buyDim : colors.sellDim }]}>
      <Text style={[styles.text, { color: isBuy ? colors.buy : colors.sell }]}>{action}</Text>
    </View>
  );
}

export function SegmentTag({ label }: { label: string }) {
  return (
    <View style={styles.segTag}>
      <Text style={styles.segText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  text: {
    ...t.caption,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  segTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineStrong,
    alignSelf: 'flex-start',
  },
  segText: {
    ...t.caption,
    color: colors.textDim,
    letterSpacing: 0.2,
  },
});
