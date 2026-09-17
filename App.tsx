import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAppStore } from './src/store/useAppStore';

export default function App() {
  const isDarkMode = useAppStore((state) => state.isDarkMode);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}