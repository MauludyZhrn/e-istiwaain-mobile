import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalculationMethod } from '../utils/falakMath';

export type AdhanSoundType = 'default' | 'makkah' | 'madinah' | 'bip' | 'silent';
export type CalculationMethodType = 'Kemenag RI (Falak)' | 'MWL' | 'Egyptian' | 'Umm al-Qura';

interface AppState {
  isDarkMode: boolean;
  toggleTheme: () => void;

  userLocation: {
    latitude: number;
    longitude: number;
    cityName?: string;
  } | null;
  setUserLocation: (location: { latitude: number; longitude: number; cityName?: string }) => void;
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
      storage: createJSONStorage(() => ({
        getItem: (name) => null,
        setItem: (name, value) => {},
        removeItem: (name) => {},
      })),
    }
  )
);