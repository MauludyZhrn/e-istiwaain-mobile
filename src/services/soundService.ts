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
  source?: 'player' | 'notification' | null;
}

// Per Expo SDK 57 expo-notifications docs, category identifiers must NOT contain '-' or ':'
export const ADHAN_CATEGORY_ID = 'adhan_alarm';
export const STOP_AZAN_ACTION_ID = 'stop_azan';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const MAX_NOTIFICATION_AUDIO_MS = 210_000; // 3.5 minutes safety cap for banner state

let azanPlayer: any = null;
let currentOnFinish: (() => void) | null = null;
let statusSubscription: { remove: () => void } | null = null;
let activeNotificationId: string | null = null;
let notificationDismissWatcher: ReturnType<typeof setInterval> | null = null;
let notificationSafetyTimer: ReturnType<typeof setTimeout> | null = null;
let syncQueuePromise: Promise<boolean> = Promise.resolve(true);

let playbackState: AzanPlaybackState = {
  isPlaying: false,
  prayerKey: null,
  audioLabel: null,
  source: null,
};

const listeners = new Set<(state: AzanPlaybackState) => void>();

export function normalizeAdhanSound(
  sound?: AdhanSoundType
): 'auto' | 'biasa' | 'subuh' | 'silent' {
  switch (sound) {
    case 'biasa':
    case 'madinah':
      return 'biasa';
    case 'subuh':
      return 'subuh';
    case 'silent':
      return 'silent';
    case 'auto':
    case 'makkah':
    case 'default':
    default:
      return 'auto';
  }
}

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

function clearNotificationWatchers() {
  if (notificationDismissWatcher) {
    clearInterval(notificationDismissWatcher);
    notificationDismissWatcher = null;
  }
  if (notificationSafetyTimer) {
    clearTimeout(notificationSafetyTimer);
    notificationSafetyTimer = null;
  }
}

/**
 * Watches the Android/iOS notification tray while an adzan is active.
 * If the user swipes/deletes the notification from the tray, playback stops immediately.
 */
function startNotificationDismissWatcher(notificationId: string) {
  clearNotificationWatchers();
  if (isExpoGo) return;

  activeNotificationId = notificationId;
  const startedAt = Date.now();
  let seenPresented = false;

  notificationDismissWatcher = setInterval(async () => {
    if (!activeNotificationId || activeNotificationId !== notificationId) {
      clearNotificationWatchers();
      return;
    }

    try {
      const presented = await Notifications.getPresentedNotificationsAsync();
      const isStillPresent = presented.some(
        (n) => n.request.identifier === notificationId
      );

      if (isStillPresent) {
        seenPresented = true;
        return;
      }

      if (seenPresented || Date.now() - startedAt > 2000) {
        activeNotificationId = null;
        await stopAzanSound({ skipDismiss: true });
      }
    } catch {
      // Ignore transient query errors
    }
  }, 1000);
}

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

async function presentCompanionPlaybackNotification(
  prayerKey: string,
  audioLabel: string
): Promise<string | null> {
  if (isExpoGo) return null;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return null;

    await ensureAdhanNotificationChannels();

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🕌 Adzan Sedang Berkumandang',
        body: `${audioLabel} • Geser/hapus notifikasi ini atau ketuk Hentikan untuk mematikan adzan.`,
        sound: false,
        categoryIdentifier: ADHAN_CATEGORY_ID,
        autoDismiss: true,
        data: {
          prayerKey,
          isInAppPlayback: true,
        },
      },
      trigger:
        Platform.OS === 'android' ? { channelId: 'adhan-silent' } : null,
    });
    return identifier;
  } catch {
    return null;
  }
}

/**
 * Registers an incoming scheduled OS notification as the active adzan without
 * starting a duplicate expo-audio player (preventing echo and allowing swipe-to-stop).
 */
export function trackActiveNotificationAdhan(
  notificationId: string,
  prayerKey: string,
  prayerName?: string,
  soundPreference?: AdhanSoundType
) {
  const normalized = normalizeAdhanSound(soundPreference);
  if (normalized === 'silent') return;

  const keyLower = prayerKey.toLowerCase();
  if (keyLower === 'imsak' || keyLower === 'terbit') return;

  const useSubuhAudio =
    normalized === 'subuh' ||
    (normalized !== 'biasa' && (keyLower === 'subuh' || keyLower === 'fajr'));
  const audioLabel = prayerName
    ? `Adzan ${prayerName} (${useSubuhAudio ? 'Subuh' : 'Standar'})`
    : useSubuhAudio
    ? 'Adzan Subuh (adzan_subuh.mp3)'
    : 'Adzan Standar (adzan_biasa.mp3)';

  if (azanPlayer) {
    try {
      statusSubscription?.remove();
      statusSubscription = null;
      azanPlayer.pause();
      azanPlayer.remove();
    } catch {}
    azanPlayer = null;
  }

  notifyListeners({
    isPlaying: true,
    prayerKey: keyLower,
    audioLabel,
    source: 'notification',
  });

  startNotificationDismissWatcher(notificationId);

  notificationSafetyTimer = setTimeout(() => {
    if (
      playbackState.source === 'notification' &&
      activeNotificationId === notificationId
    ) {
      clearNotificationWatchers();
      activeNotificationId = null;
      notifyListeners({
        isPlaying: false,
        prayerKey: null,
        audioLabel: null,
        source: null,
      });
    }
  }, MAX_NOTIFICATION_AUDIO_MS);
}

export const playAzanSound = async (
  prayerName: string = 'dzuhur',
  onFinish?: () => void,
  soundPreference?: AdhanSoundType
): Promise<boolean> => {
  await stopAzanSound();
  currentOnFinish = onFinish || null;

  const normalized = normalizeAdhanSound(soundPreference);
  if (normalized === 'silent') {
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
      normalized === 'subuh' ||
      (normalized !== 'biasa' &&
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
      source: 'player',
    });

    statusSubscription = player.addListener('playbackStatusUpdate', (status: any) => {
      if (status?.didJustFinish) {
        const cb = currentOnFinish;
        void stopAzanSound();
        if (cb) cb();
      }
    });

    player.play();

    void presentCompanionPlaybackNotification(keyLower, audioLabel).then(
      (notifId) => {
        if (notifId && azanPlayer === player) {
          startNotificationDismissWatcher(notifId);
        } else if (notifId) {
          Notifications.dismissNotificationAsync(notifId).catch(() => {});
        }
      }
    );

    return true;
  } catch (error) {
    console.warn('Gagal memutar audio Azan:', error);
    const cb = currentOnFinish;
    await stopAzanSound();
    if (cb) cb();
    return false;
  }
};

export const stopAzanSound = async (options?: {
  skipDismiss?: boolean;
  notificationIdToDismiss?: string;
}) => {
  const notifToDismiss =
    options?.notificationIdToDismiss ?? activeNotificationId;

  clearNotificationWatchers();
  activeNotificationId = null;

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
    if (!options?.skipDismiss && !isExpoGo && notifToDismiss) {
      try {
        await Notifications.dismissNotificationAsync(notifToDismiss);
      } catch {}
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
        source: null,
      });
    }
  }
};

// ===== PENJADWALAN NOTIFIKASI & CHANNEL ADZAN ANDROID =====

export const ensureAdhanNotificationChannels = async () => {
  if (isExpoGo) return;

  try {
    await Notifications.setNotificationCategoryAsync(ADHAN_CATEGORY_ID, [
      {
        identifier: STOP_AZAN_ACTION_ID,
        buttonTitle: 'Hentikan Adzan',
        options: {
          opensAppToForeground: false,
          isDestructive: true,
        },
      },
    ]);
  } catch (err) {
    console.warn('Gagal mendaftarkan kategori notifikasi Adzan:', err);
  }

  if (Platform.OS !== 'android') return;

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

    await Notifications.setNotificationChannelAsync('adhan-reminder', {
      name: 'Pengingat Imsak & Terbit',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 200, 200],
      lightColor: '#09473E',
      sound: 'default',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
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

export const syncPrayerNotifications = (
  times: Record<string, string>,
  alarms: Record<string, boolean>,
  notificationsEnabled: boolean,
  adhanSound: AdhanSoundType,
  options?: { requestPermission?: boolean }
): Promise<boolean> => {
  const runSync = async (): Promise<boolean> => {
    if (isExpoGo) return false;

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      if (!notificationsEnabled) {
        return true;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted' && options?.requestPermission !== false) {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return false;

      await ensureAdhanNotificationChannels();

      const normalizedSound = normalizeAdhanSound(adhanSound);
      const prayers: {
        key: string;
        name: string;
        timeStr?: string;
        isFardhu: boolean;
      }[] = [
        { key: 'imsak', name: 'Imsak', timeStr: times.imsak || times.Imsak, isFardhu: false },
        { key: 'subuh', name: 'Subuh', timeStr: times.subuh || times.Subuh, isFardhu: true },
        { key: 'terbit', name: 'Terbit', timeStr: times.terbit || times.Terbit, isFardhu: false },
        { key: 'dzuhur', name: 'Dzuhur', timeStr: times.dzuhur || times.Zuhur, isFardhu: true },
        { key: 'ashar', name: 'Ashar', timeStr: times.ashar || times.Asar, isFardhu: true },
        { key: 'maghrib', name: 'Maghrib', timeStr: times.maghrib || times.Maghrib, isFardhu: true },
        { key: 'isya', name: 'Isya', timeStr: times.isya || times.Isya, isFardhu: true },
      ];

      const now = new Date();

      for (const p of prayers) {
        if (!alarms[p.key] || !p.timeStr || !p.timeStr.includes(':')) continue;
        const [h, m] = p.timeStr.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) continue;

        const targetDate = new Date(now);
        targetDate.setHours(h, m, 0, 0);
        if (targetDate.getTime() <= now.getTime() + 1000) {
          targetDate.setDate(targetDate.getDate() + 1);
        }

        const isSubuh =
          normalizedSound === 'subuh' ||
          (normalizedSound !== 'biasa' && p.key === 'subuh');

        const channelId =
          normalizedSound === 'silent'
            ? 'adhan-silent'
            : !p.isFardhu
            ? 'adhan-reminder'
            : isSubuh
            ? 'adhan-subuh'
            : 'adhan-biasa';

        const soundOption: string | boolean =
          normalizedSound === 'silent'
            ? false
            : !p.isFardhu
            ? 'default'
            : isSubuh
            ? 'adzan_subuh.mp3'
            : 'adzan_biasa.mp3';

        await Notifications.scheduleNotificationAsync({
          identifier: `prayer-alarm-${p.key}`,
          content: {
            title: `🕌 Waktu ${p.name} Telah Tiba (${p.timeStr})`,
            body:
              p.key === 'imsak'
                ? 'Saatnya bersiap memasuki waktu Imsak.'
                : p.key === 'terbit'
                ? 'Matahari telah terbit (akhir waktu Subuh).'
                : `Mari menunaikan ibadah shalat ${p.name} tepat waktu. Geser notifikasi untuk menghentikan adzan.`,
            sound: soundOption,
            autoDismiss: true,
            categoryIdentifier: p.isFardhu ? ADHAN_CATEGORY_ID : undefined,
            priority: Notifications.AndroidNotificationPriority.MAX,
            data: {
              prayerKey: p.key,
              prayerName: p.name,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: targetDate,
            ...(Platform.OS === 'android' ? { channelId } : {}),
          },
        });
      }

      return true;
    } catch (err) {
      console.warn('Gagal menyinkronkan jadwal notifikasi Adzan:', err);
      return false;
    }
  };

  syncQueuePromise = syncQueuePromise.then(runSync, runSync);
  return syncQueuePromise;
};
