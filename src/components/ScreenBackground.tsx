import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { gradient } from '../theme/theme';

/** Shared dark gradient backdrop every screen sits on, so glass cards have something rich to refract. */
export function ScreenBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <LinearGradient colors={gradient.backdrop} style={StyleSheet.absoluteFill} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} />
      <View style={styles.glowTop} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  glowTop: {
    position: 'absolute',
    top: -160,
    left: -60,
    width: 340,
    height: 340,
    borderRadius: 340,
    backgroundColor: 'rgba(214, 168, 85, 0.10)',
  },
});
