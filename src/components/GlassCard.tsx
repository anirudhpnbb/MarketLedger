import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius } from '../theme/theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  intensity?: number;
  borderColor?: string;
}

/**
 * Frosted-glass panel: BlurView for the translucent backdrop blur, plus a
 * thin light stroke and subtle fill on top so it reads as a distinct
 * surface even over busy/light content behind it. overflow: 'hidden' is
 * required for BlurView to respect borderRadius (see Expo docs).
 */
export function GlassCard({ children, style, radius: r = radius.lg, intensity = 40, borderColor }: Props) {
  return (
    <View style={[{ borderRadius: r, overflow: 'hidden' }, style]}>
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      <View
        style={[
          styles.fill,
          { borderRadius: r, borderColor: borderColor ?? colors.glassStrokeDark },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.glassFillDark,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
});
