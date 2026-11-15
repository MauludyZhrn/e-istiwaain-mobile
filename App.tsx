import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAppStore } from './src/store/useAppStore';
import {
  ensureAdhanNotificationChannels,
  playAzanSound,
} from './src/services/soundService';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export default function App() {
  const isDarkMode = useAppStore((state) => state.isDarkMode);

  useEffect(() => {
    if (isExpoGo) return;

    ensureAdhanNotificationChannels();

    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      const state = useAppStore.getState();
      if (!state.notificationsEnabled || state.adhanSound === 'silent') return;
      const data = notification.request.content.data as { prayerKey?: string } | undefined;
      const prayerKey = data?.prayerKey || 'dzuhur';
      if (prayerKey !== 'imsak' && prayerKey !== 'terbit') {
        playAzanSound(prayerKey, undefined, state.adhanSound);
      }
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const state = useAppStore.getState();
      if (!state.notificationsEnabled || state.adhanSound === 'silent') return;
      const data = response.notification.request.content.data as { prayerKey?: string } | undefined;
      const prayerKey = data?.prayerKey || 'dzuhur';
      if (prayerKey !== 'imsak' && prayerKey !== 'terbit') {
        playAzanSound(prayerKey, undefined, state.adhanSound);
      }
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={isDarkMode ? DarkTheme : DefaultTheme}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
