import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard } from '../components/GlassCard';
import { ScreenBackground } from '../components/ScreenBackground';
import { RISK_PER_TRADE_PCT, HOLDING_PERIOD_DAYS } from '../services/config';
import { getCapital, setCapital } from '../services/settingsStore';
import { useScan } from '../state/ScanContext';
import { colors, radius, type as t } from '../theme/theme';
import { formatCapital } from '../utils/format';
import type { ScreenProps } from '../navigation/types';

export function SettingsScreen({ navigation }: ScreenProps<'Settings'>) {
  const insets = useSafeAreaInsets();
  const { result, refresh, loading } = useScan();
  const [capitalText, setCapitalText] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getCapital().then((c) => setCapitalText(String(c)));
  }, []);

  async function save() {
    const n = Number(capitalText.replace(/[^0-9.]/g, ''));
    if (Number.isFinite(n) && n > 0) {
      await setCapital(n);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      refresh(true);
    }
  }

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ marginBottom: 14 }}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>

        <GlassCard style={styles.card}>
          <Text style={styles.h2}>Capital</Text>
          <Text style={styles.body}>Used only for position-size suggestions ({RISK_PER_TRADE_PCT}% risked per trade) — not connected to any brokerage.</Text>
          <View style={styles.inputRow}>
            <Text style={styles.rupee}>₹</Text>
            <TextInput
              value={capitalText}
              onChangeText={setCapitalText}
              keyboardType="number-pad"
              style={styles.input}
              placeholderTextColor={colors.textFaint}
            />
          </View>
          <Pressable onPress={save} style={styles.saveBtn}>
            <Text style={styles.saveText}>{saved ? 'Saved ✓' : 'Save & rescan'}</Text>
          </Pressable>
        </GlassCard>

        <GlassCard style={styles.card} intensity={30}>
          <Text style={styles.h2}>Rules</Text>
          <Row label="Risk per trade" value={`${RISK_PER_TRADE_PCT}% of ${formatCapital(Number(capitalText) || 0)}`} />
          <Row label="Reassess horizon" value={`${HOLDING_PERIOD_DAYS} trading days`} />
          <Row label="Universe" value="Nifty Midcap 150 + Smallcap 250 + 5 large-cap anchors" />
          {result && <Row label="Last scan" value={new Date(result.computedAt).toLocaleString('en-IN')} />}
        </GlassCard>

        <Pressable onPress={() => refresh(true)} disabled={loading}>
          <GlassCard style={styles.card} intensity={30}>
            <Text style={[styles.h2, loading && { opacity: 0.5 }]}>{loading ? 'Rescanning…' : 'Force a fresh rescan'}</Text>
            <Text style={styles.body}>Re-fetches prices, news, and the index constituent list right now.</Text>
          </GlassCard>
        </Pressable>

        <Text style={styles.disclaimer}>
          This is a rules-based decision-support tool, not investment advice, and not a guaranteed-profit system.
          Backtest and paper-trade before risking real money. All computation runs on this device — nothing is sent
          to a server.
        </Text>
      </ScrollView>
    </ScreenBackground>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingBottom: 48 },
  back: { ...t.body, color: colors.accent, fontWeight: '600' },
  title: { ...t.display, color: colors.text, marginBottom: 16 },
  card: { borderRadius: radius.lg, padding: 18, marginBottom: 14 },
  h2: { ...t.h2, color: colors.text },
  body: { ...t.body, color: colors.textDim, marginTop: 4, lineHeight: 20 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    paddingHorizontal: 14,
  },
  rupee: { ...t.mono, color: colors.textDim, fontSize: 17, marginRight: 6 },
  input: { ...t.mono, color: colors.text, fontSize: 17, flex: 1, paddingVertical: 12 },
  saveBtn: { marginTop: 12, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: colors.accentDim },
  saveText: { ...t.bodyStrong, color: colors.accent },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairline, gap: 10 },
  rowLabel: { ...t.body, color: colors.textDim },
  rowValue: { ...t.body, color: colors.text, flexShrink: 1, textAlign: 'right' },
  disclaimer: { ...t.caption, color: colors.textFaint, textTransform: 'none', lineHeight: 16, marginTop: 10, paddingHorizontal: 4 },
});
