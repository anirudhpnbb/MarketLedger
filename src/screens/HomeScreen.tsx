import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard } from '../components/GlassCard';
import { ScanProgressView } from '../components/ScanProgressView';
import { ScreenBackground } from '../components/ScreenBackground';
import { StatTile } from '../components/StatTile';
import { TopPickCard } from '../components/TopPickCard';
import { useScan } from '../state/ScanContext';
import { colors, radius, type as t } from '../theme/theme';
import { formatDateLong } from '../utils/format';
import type { ScreenProps } from '../navigation/types';

export function HomeScreen({ navigation }: ScreenProps<'Home'>) {
  const { result, isStale, sameAsYesterday, loading, progress, error, refresh } = useScan();
  const insets = useSafeAreaInsets();

  const buyCount = result?.signals.filter((s) => s.action === 'BUY').length ?? 0;
  const sellCount = result?.signals.filter((s) => s.action === 'SELL').length ?? 0;

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 18 }]}
        refreshControl={<RefreshControl tintColor={colors.textDim} refreshing={loading && !!result} onRefresh={() => refresh(true)} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>MARKET LEDGER</Text>
            <Text style={styles.title}>Today's Read</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Settings')} hitSlop={12}>
            <View style={styles.settingsDot} />
          </Pressable>
        </View>

        {result && (
          <Text style={styles.dateLine}>
            {formatDateLong(result.dateKey)}
            {isStale ? ' · showing last available scan' : ''}
          </Text>
        )}

        {loading && !result && <ScanProgressView progress={progress} />}

        {error && !result && (
          <GlassCard style={styles.card}>
            <Text style={styles.errorTitle}>Couldn't complete the scan</Text>
            <Text style={styles.errorBody}>{error}</Text>
            <Pressable onPress={() => refresh(true)} style={styles.retryBtn}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </GlassCard>
        )}

        {result && (
          <>
            {loading && (
              <View style={{ marginBottom: 14 }}>
                <ScanProgressView progress={progress} />
              </View>
            )}

            {result.topPick ? (
              <TopPickCard
                signal={result.topPick}
                sameAsYesterday={sameAsYesterday}
                onPress={() => navigation.navigate('Detail', { symbol: result.topPick!.symbol })}
              />
            ) : (
              <GlassCard style={styles.card}>
                <Text style={styles.h2}>No BUY signal today</Text>
                <Text style={styles.body}>
                  Nothing in the watchlist cleared the buy threshold. That's a normal outcome, not an error — check back
                  tomorrow.
                </Text>
              </GlassCard>
            )}

            <GlassCard style={[styles.card, styles.statsCard]} intensity={30}>
              <StatTile value={result.scanned} label="Scanned" />
              <StatTile value={buyCount} label="Buy" tone="buy" />
              <StatTile value={sellCount} label="Sell" tone="sell" />
              <StatTile value={result.holds} label="Hold" />
            </GlassCard>

            <Pressable onPress={() => navigation.navigate('Signals', { initialFilter: 'ALL' })}>
              <GlassCard style={styles.card} intensity={30}>
                <View style={styles.rowBetween}>
                  <View>
                    <Text style={styles.h2}>All signals</Text>
                    <Text style={styles.body}>Browse every buy and sell that fired today</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </GlassCard>
            </Pressable>

            <Text style={styles.disclaimer}>
              Rules-based technical + news read, not investment advice. Backtest and paper-trade before risking money.
            </Text>
          </>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingBottom: 48, gap: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  kicker: { ...t.caption, color: colors.accent, fontWeight: '700', letterSpacing: 1.4 },
  title: { ...t.display, color: colors.text, marginTop: 4 },
  settingsDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineStrong,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  dateLine: { ...t.caption, color: colors.textFaint, textTransform: 'none', marginTop: -6 },
  card: { borderRadius: radius.lg, padding: 18 },
  statsCard: { flexDirection: 'row' },
  h2: { ...t.h2, color: colors.text },
  body: { ...t.body, color: colors.textDim, marginTop: 4, lineHeight: 20 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chevron: { color: colors.accent, fontSize: 22, fontWeight: '700' },
  errorTitle: { ...t.h2, color: colors.sell },
  errorBody: { ...t.body, color: colors.textDim, marginTop: 4 },
  retryBtn: { marginTop: 12, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.accentDim },
  retryText: { ...t.bodyStrong, color: colors.accent },
  disclaimer: { ...t.caption, color: colors.textFaint, textTransform: 'none', lineHeight: 16, marginTop: 4, paddingHorizontal: 4 },
});
