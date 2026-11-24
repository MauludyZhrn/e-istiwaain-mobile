import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { RootNavigator } from './src/navigation/RootNavigator';
import { FluidSplash } from './src/components/splash/FluidSplash';
import { AppDialogHost } from './src/components/ui/AppDialog';
import { colors } from './src/constants/colors';
import { useAppStore } from './src/store/useAppStore';
import {
  ensureAdhanNotificationChannels,
  normalizeAdhanSound,
  stopAzanSound,
  trackActiveNotificationAdhan,
} from './src/services/soundService';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

SplashScreen.preventAutoHideAsync().catch(() => {});
if (!isExpoGo) {
  try {
    SplashScreen.setOptions({ duration: 0, fade: false });
  } catch {
    // Ignore on platforms/runtimes where setOptions is unavailable
  }
}

export default function App() {
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashReady = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  useEffect(() => {
    if (isExpoGo) return;

    ensureAdhanNotificationChannels();

    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      const state = useAppStore.getState();
      const data = notification.request.content.data as
        | { prayerKey?: string; prayerName?: string; isInAppPlayback?: boolean }
        | undefined;
      if (data?.isInAppPlayback) return;
      if (!state.notificationsEnabled || normalizeAdhanSound(state.adhanSound) === 'silent') {
        return;
      }
      const prayerKey = data?.prayerKey || 'dzuhur';
      trackActiveNotificationAdhan(
        notification.request.identifier,
        prayerKey,
        data?.prayerName,
        state.adhanSound
      );
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      void stopAzanSound({
        notificationIdToDismiss: response.notification.request.identifier,
      });
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  const rootBackground = isDarkMode ? colors.dark.background : colors.light.background;

  return (
    <SafeAreaProvider style={{ backgroundColor: rootBackground }}>
      <StatusBar style={showSplash || isDarkMode ? 'light' : 'dark'} />
      {showSplash ? (
        <FluidSplash onReady={handleSplashReady} onFinish={handleSplashFinish} />
      ) : (
        <NavigationContainer theme={isDarkMode ? DarkTheme : DefaultTheme}>
          <RootNavigator />
        </NavigationContainer>
      )}
      <AppDialogHost />
    </SafeAreaProvider>
  );
}
