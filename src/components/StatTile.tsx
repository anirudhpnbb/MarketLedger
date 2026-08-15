import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, type as t } from '../theme/theme';

export function StatTile({ value, label, tone }: { value: string | number; label: string; tone?: 'buy' | 'sell' }) {
  const color = tone === 'buy' ? colors.buy : tone === 'sell' ? colors.sell : colors.text;
  return (
    <View style={styles.tile}>
      <Text style={[styles.value, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  value: { ...t.mono, fontSize: 19, fontWeight: '700' },
  label: { ...t.caption, color: colors.textFaint, marginTop: 3, textTransform: 'uppercase' },
});
