import React, { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Calculator, Compass, Clock, Settings } from 'lucide-react-native';

import { DashboardScreen } from '../features/dashboard/DashboardScreen';
import { HisabScreen } from '../features/hisab/HisabScreen';
import { CompassScreen } from '../features/compass/CompassScreen';
import { PrayerTimeScreen } from '../features/prayertime/PrayerTimeScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { ModuleDetailScreen } from '../features/modules/ModuleDetailScreen';
import { IstiwaComponentScreen } from '../features/modules/IstiwaComponentScreen';

import { useAppStore } from '../store/useAppStore';
import { colors } from '../constants/colors';
import {
  handleAppForegroundLocationSync,
  startAutoLocationTracking,
  stopAutoLocationTracking,
} from '../services/locationService';

// Tipe Param untuk Tab Bawah
export type RootTabParamList = {
  Home: undefined;
  Hisab: undefined;
  Compass: undefined;
  PrayerTime: undefined;
  Settings: undefined;
};

// Tipe Param Utama (Stack)
export type RootStackParamList = {
  MainTabs: undefined;
  Modules: undefined;
  Komponen: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

// 1. Komponen Khusus Menu Tab Bawah
const MainTabNavigator = () => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.iconi,
        tabBarInactiveTintColor: theme.iconiSecondary,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Hisab"
        component={HisabScreen}
        options={{
          tabBarLabel: 'Hisab',
          tabBarIcon: ({ color, size }) => <Calculator color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Compass"
        component={CompassScreen}
        options={{
          tabBarLabel: 'Kompas',
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="PrayerTime"
        component={PrayerTimeScreen}
        options={{
          tabBarLabel: 'Jadwal Sholat',
          tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
};

// 2. Root Navigator Pembungkus Utama
export const RootNavigator = () => {
  const autoLocation = useAppStore((state) => state.autoLocation) ?? true;
  const [hasHydrated, setHasHydrated] = useState(() =>
    useAppStore.persist.hasHydrated()
  );
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (useAppStore.persist.hasHydrated()) {
      setHasHydrated(true);
      return;
    }
    const unsub = useAppStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;

    if (autoLocation) {
      void startAutoLocationTracking();
    } else {
      stopAutoLocationTracking();
    }

    return () => {
      stopAutoLocationTracking();
    };
  }, [hasHydrated, autoLocation]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      if (
        (prevState === 'background' || prevState === 'inactive') &&
        nextState === 'active' &&
        hasHydrated &&
        (useAppStore.getState().autoLocation ?? true)
      ) {
        void handleAppForegroundLocationSync();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [hasHydrated]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Layar Utama dengan Bottom Tab */}
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      
      {/* Layar Detail yang diakses via Dashboard (Tanpa Bottom Tab) */}
      <Stack.Screen name="Modules" component={ModuleDetailScreen} />
      {/* <Stack.Screen name="Komponen" component={KomponenScreen} /> */}
      <Stack.Screen name="Komponen" component={IstiwaComponentScreen} />
    </Stack.Navigator>
  );
};