import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import RootNavigator from './src/navigation/RootNavigator';
import { useLoadFonts } from './src/theme/fonts';
import { View, Text } from 'react-native';
import { tokens } from './src/theme/tokens';
import { queryClient } from './src/api/queryClient';
import { AuthProvider } from './src/auth/AuthContext';

export default function App() {
  const fontsLoaded = useLoadFonts();
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.bg }}>
        <Text style={{ color: tokens.textSecondary }}>Loading…</Text>
      </View>
    );
  }
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <RootNavigator />
            <StatusBar style="dark" />
          </NavigationContainer>
        </SafeAreaProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
