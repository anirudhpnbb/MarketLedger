import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from './src/navigation/RootNavigator';
import { ScanProvider } from './src/state/ScanContext';

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: '#0B0D10', card: '#0B0D10' },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ScanProvider>
          <NavigationContainer theme={navTheme}>
            <RootNavigator />
          </NavigationContainer>
          <StatusBar style="light" />
        </ScanProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
