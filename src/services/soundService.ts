// src/services/soundService.ts
import { Image, Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import * as Notifications from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { AdhanSoundType } from '../store/useAppStore';

export interface AzanPlaybackState {
  isPlaying: boolean;
  prayerKey: string | null;
  audioLabel: string | null;
}

let azanPlayer: any = null;
let currentOnFinish: (() => void) | null = null;
let statusSubscription: { remove: () => void } | null = null;
let playbackState: AzanPlaybackState = {
  isPlaying: false,
  prayerKey: null,
  audioLabel: null,
};

const listeners = new Set<(state: AzanPlaybackState) => void>();

function notifyListeners(next: AzanPlaybackState) {
  playbackState = next;
  listeners.forEach((fn) => {
    try {
      fn(playbackState);
    } catch {}
  });
}

export function getAzanPlaybackState(): AzanPlaybackState {
  return playbackState;
}

export function subscribeAzanState(
  listener: (state: AzanPlaybackState) => void
): () => void {
  listeners.add(listener);
  listener(playbackState);
  return () => {
    listeners.delete(listener);
  };
}

export const AZAN_AUDIO_MAP = {
  subuh: require('../../assets/audio/adzan_subuh.mp3'),
  biasa: require('../../assets/audio/adzan_biasa.mp3'),
};

async function resolveAudioAssetSource(audioModule: number): Promise<any> {
  try {
    if (requireOptionalNativeModule('ExpoAsset')) {
      const { Asset } = require('expo-asset');
      const asset = Asset.fromModule(audioModule);
      if (!asset.localUri) {
        await asset.downloadAsync();
      }
      if (asset.localUri) {
        return { uri: asset.localUri };
      }
    }
  } catch {}

  const resolved = Image.resolveAssetSource(audioModule);
  if (resolved?.uri) {
    return { uri: resolved.uri };
  }
  return audioModule;
}

export const playAzanSound = async (
  prayerName: string = 'dzuhur',
  onFinish?: () => void,
  soundPreference?: AdhanSoundType
): Promise<boolean> => {
  await stopAzanSound();
  currentOnFinish = onFinish || null;

  if (soundPreference === 'silent') {
    if (currentOnFinish) {
      currentOnFinish();
      currentOnFinish = null;
    }
    return false;
  }

  try {
    if (!requireOptionalNativeModule('ExpoAudio')) {
      console.warn('Modul native ExpoAudio belum tersedia di build APK ini.');
      if (currentOnFinish) {
        currentOnFinish();
        currentOnFinish = null;
      }
      return false;
    }

    const { createAudioPlayer, setAudioModeAsync } = require('expo-audio');
    const keyLower = prayerName.toLowerCase();
    const useSubuhAudio =
      soundPreference === 'subuh' ||
      (soundPreference !== 'biasa' &&
        (keyLower === 'subuh' || keyLower === 'fajr'));

    const audioModule = useSubuhAudio ? AZAN_AUDIO_MAP.subuh : AZAN_AUDIO_MAP.biasa;
    const audioLabel = useSubuhAudio
      ? 'Adzan Subuh (adzan_subuh.mp3)'
      : 'Adzan Standar (adzan_biasa.mp3)';

    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionModeAndroid: 'doNotMix',
        interruptionMode: 'doNotMix',
      });
    } catch {}

    const source = await resolveAudioAssetSource(audioModule);
    const player = createAudioPlayer(source);
    azanPlayer = player;

    notifyListeners({
      isPlaying: true,
      prayerKey: keyLower,
      audioLabel,
    });

    statusSubscription = player.addListener('playbackStatusUpdate', (status: any) => {
      if (status?.didJustFinish) {
        const cb = currentOnFinish;
        stopAzanSound();
        if (cb) cb();
      }
    });

    player.play();
    return true;
  } catch (error) {
    console.warn('Gagal memutar audio Azan:', error);
    const cb = currentOnFinish;
    await stopAzanSound();
    if (cb) cb();
    return false;
  }
};

export const stopAzanSound = async () => {
  try {
    if (statusSubscription) {
      statusSubscription.remove();
      statusSubscription = null;
    }
    if (azanPlayer) {
      try {
        azanPlayer.pause();
        azanPlayer.remove();
      } catch {}
      azanPlayer = null;
    }
  } catch (error) {
    console.warn('Gagal menghentikan audio:', error);
  } finally {
    currentOnFinish = null;
    if (playbackState.isPlaying) {
      notifyListeners({
        isPlaying: false,
        prayerKey: null,
        audioLabel: null,
      });
    }
  }
};

// ===== PENJADWALAN NOTIFIKASI & CHANNEL ADZAN ANDROID =====
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const ensureAdhanNotificationChannels = async () => {
  if (isExpoGo || Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('adhan-subuh', {
      name: 'Adzan Subuh',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 300, 200, 300],
      lightColor: '#09473E',
      sound: 'adzan_subuh.mp3',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    });

    await Notifications.setNotificationChannelAsync('adhan-biasa', {
      name: 'Adzan Lima Waktu',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#09473E',
      sound: 'adzan_biasa.mp3',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    });

    await Notifications.setNotificationChannelAsync('adhan-silent', {
      name: 'Pengingat Shalat (Tanpa Suara)',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 200, 200],
      lightColor: '#09473E',
      sound: null,
    });
  } catch (err) {
    console.warn('Gagal membuat channel notifikasi Adzan:', err);
  }
};

export const syncPrayerNotifications = async (
  times: Record<string, string>,
  alarms: Record<string, boolean>,
  notificationsEnabled: boolean,
  adhanSound: AdhanSoundType
): Promise<boolean> => {
  if (isExpoGo) return false;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!notificationsEnabled) return true;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return false;

    await ensureAdhanNotificationChannels();

    const prayers: { key: string; name: string; timeStr?: string }[] = [
      { key: 'imsak', name: 'Imsak', timeStr: times.imsak || times.Imsak },
      { key: 'subuh', name: 'Subuh', timeStr: times.subuh || times.Subuh },
      { key: 'dzuhur', name: 'Dzuhur', timeStr: times.dzuhur || times.Zuhur },
      { key: 'ashar', name: 'Ashar', timeStr: times.ashar || times.Asar },
      { key: 'maghrib', name: 'Maghrib', timeStr: times.maghrib || times.Maghrib },
      { key: 'isya', name: 'Isya', timeStr: times.isya || times.Isya },
    ];

    const now = new Date();

    for (const p of prayers) {
      if (!alarms[p.key] || !p.timeStr || !p.timeStr.includes(':')) continue;
      const [h, m] = p.timeStr.split(':').map(Number);
      if (isNaN(h) || isNaN(m)) continue;

      const targetDate = new Date(now);
      targetDate.setHours(h, m, 0, 0);
      if (targetDate.getTime() <= now.getTime()) {
        targetDate.setDate(targetDate.getDate() + 1);
      }

      const isSubuh =
        adhanSound === 'subuh' || (adhanSound !== 'biasa' && p.key === 'subuh');
      const channelId =
        adhanSound === 'silent'
          ? 'adhan-silent'
          : isSubuh
          ? 'adhan-subuh'
          : 'adhan-biasa';

      const soundFile =
        adhanSound === 'silent'
          ? undefined
          : isSubuh
          ? 'adzan_subuh.mp3'
          : 'adzan_biasa.mp3';

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🕌 Waktu ${p.name} Telah Tiba (${p.timeStr})`,
          body:
            p.key === 'imsak'
              ? 'Saatnya bersiap memasuki waktu Imsak.'
              : `Mari menunaikan ibadah shalat ${p.name} tepat waktu.`,
          sound: soundFile,
          data: {
            prayerKey: p.key,
            prayerName: p.name,
          },
          ...(Platform.OS === 'android' ? { channelId } : {}),
        } as any,
        trigger: {
          date: targetDate,
          ...(Platform.OS === 'android' ? { channelId } : {}),
        } as any,
      });
    }

    return true;
  } catch (err) {
    console.warn('Gagal menyinkronkan jadwal notifikasi Adzan:', err);
    return false;
  }
};
