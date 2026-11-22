import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalculationMethod } from '../utils/falakMath';

export type AdhanSoundType =
  | 'auto'
  | 'biasa'
  | 'subuh'
  | 'default'
  | 'makkah'
  | 'madinah'
  | 'bip'
  | 'silent';
export type CalculationMethodType = CalculationMethod;

export interface UserLocationData {
  latitude: number;
  longitude: number;
  cityName?: string;
  addressName?: string;
  accuracy?: number | null;
  updatedAt?: number;
}

interface AppState {
  isDarkMode: boolean;
  toggleTheme: () => void;

  userLocation: UserLocationData | null;
  setUserLocation: (location: UserLocationData) => void;
  autoLocation: boolean;
  setAutoLocation: (enabled: boolean) => void;

  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  alarms: Record<string, boolean>;
  setAlarmToggle: (key: string, value: boolean) => void;
  adhanSound: AdhanSoundType;
  setAdhanSound: (sound: AdhanSoundType) => void;

  calculationMethod: CalculationMethod;
  setCalculationMethod: (method: CalculationMethod) => void;
}

const safeAsyncStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return (await AsyncStorage.getItem(name)) ?? null;
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(name, value);
    } catch {}
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(name);
    } catch {}
  },
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Tampilan
      isDarkMode: false,
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

      // Lokasi
      userLocation: null,
      setUserLocation: (location) => set({ userLocation: location }),
      autoLocation: true,
      setAutoLocation: (enabled) => set({ autoLocation: enabled }),

      // Notifikasi & Alarm
      notificationsEnabled: true,
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      alarms: {
        subuh: true,
        dzuhur: true,
        ashar: true,
        maghrib: true,
        isya: true,
      },
      setAlarmToggle: (key, value) =>
        set((state) => ({
          alarms: { ...state.alarms, [key]: value },
        })),
      adhanSound: 'makkah',
      setAdhanSound: (sound) => set({ adhanSound: sound }),

      // Metode Kalkulasi
      calculationMethod: 'Kemenag RI (Falak)',
      setCalculationMethod: (method) => set({ calculationMethod: method }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => safeAsyncStorage),
    }
  )
);