import { Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import { create } from 'zustand';

import { showAppDialog } from '../components/ui/AppDialog';
import { useAppStore, UserLocationData } from '../store/useAppStore';

export type LocationSyncStatus =
  | 'idle'
  | 'fetching'
  | 'watching'
  | 'denied'
  | 'services-disabled'
  | 'error';

interface LocationRuntimeState {
  loading: boolean;
  errorMsg: string | null;
  status: LocationSyncStatus;
  setRuntime: (patch: Partial<LocationRuntimeState>) => void;
}

export const useLocationRuntimeStore = create<LocationRuntimeState>((set) => ({
  loading: false,
  errorMsg: null,
  status: 'idle',
  setRuntime: (patch) => set(patch),
}));

const GEOCODE_MIN_DISTANCE_METERS = 300;
const GEOCODE_MAX_AGE_MS = 5 * 60 * 1000;
const LAST_KNOWN_MAX_AGE_MS = 30 * 60 * 1000;
const BALANCED_TIMEOUT_MS = 12000;
const LOW_TIMEOUT_MS = 8000;

let activeFetchPromise: Promise<boolean> | null = null;
let watchStartingPromise: Promise<void> | null = null;
let activeWatchSub: Location.LocationSubscription | null = null;
let isGeocoding = false;
let lastGeocodeCoords: { latitude: number; longitude: number } | null = null;
let lastGeocodeAt = 0;

function getDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(label)), ms);
      }),
    ]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}

function formatPlacemark(place: Location.LocationGeocodedAddress): {
  cityName: string;
  addressName: string;
} {
  const district = (place?.district || place?.subregion || '').trim();
  const city = (place?.city || place?.subregion || place?.region || '').trim();
  const region = (place?.region || '').trim();

  const parts: string[] = [];
  for (const part of [district, city]) {
    if (
      part &&
      !parts.some((existing) => existing.toLowerCase() === part.toLowerCase())
    ) {
      parts.push(part);
    }
  }

  const cityName = city || region || 'Lokasi Terdeteksi';
  const addressName = parts.join(', ') || region || 'Lokasi Terdeteksi';
  return { cityName, addressName };
}

async function applyCoordinates(coords: {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
}): Promise<void> {
  const { latitude, longitude, accuracy = null } = coords;
  const existing = useAppStore.getState().userLocation;
  const updatedLocation: UserLocationData = {
    ...(existing ?? {}),
    latitude,
    longitude,
    accuracy,
    updatedAt: Date.now(),
  };

  useAppStore.getState().setUserLocation(updatedLocation);

  const movedEnoughForGeocode =
    !lastGeocodeCoords ||
    getDistanceMeters(
      lastGeocodeCoords.latitude,
      lastGeocodeCoords.longitude,
      latitude,
      longitude
    ) >= GEOCODE_MIN_DISTANCE_METERS;
  const geocodeExpired = Date.now() - lastGeocodeAt > GEOCODE_MAX_AGE_MS;
  const shouldGeocode =
    !isGeocoding &&
    (!existing?.addressName || movedEnoughForGeocode || geocodeExpired);

  if (!shouldGeocode) {
    return;
  }

  isGeocoding = true;
  try {
    const places = await Location.reverseGeocodeAsync({ latitude, longitude });
    const place = places?.[0];
    if (place) {
      const { cityName, addressName } = formatPlacemark(place);
      const latest = useAppStore.getState().userLocation;
      useAppStore.getState().setUserLocation({
        ...(latest ?? { latitude, longitude, accuracy, updatedAt: Date.now() }),
        cityName,
        addressName,
      });
      lastGeocodeCoords = { latitude, longitude };
      lastGeocodeAt = Date.now();
      return;
    }
  } catch {
    // Fallback to coordinate string when offline / geocoder unavailable
  } finally {
    isGeocoding = false;
  }

  const latest = useAppStore.getState().userLocation;
  const movedFarWithoutAddress =
    lastGeocodeCoords &&
    getDistanceMeters(
      lastGeocodeCoords.latitude,
      lastGeocodeCoords.longitude,
      latitude,
      longitude
    ) >= 500;

  if (!latest?.addressName || movedFarWithoutAddress) {
    useAppStore.getState().setUserLocation({
      ...(latest ?? { latitude, longitude, accuracy, updatedAt: Date.now() }),
      addressName: `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`,
    });
  }
}

/**
 * Starts a single foreground GPS watcher when Auto Location is active.
 */
export async function ensureLocationWatcher(): Promise<void> {
  if (activeWatchSub) return;
  if (watchStartingPromise) {
    return watchStartingPromise;
  }

  watchStartingPromise = (async () => {
    try {
      const autoLocation = useAppStore.getState().autoLocation ?? true;
      if (!autoLocation || activeWatchSub) return;

      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== 'granted') return;

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) return;

      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 15000,
          distanceInterval: 50,
          mayShowUserSettingsDialog: true,
        },
        (loc) => {
          void applyCoordinates(loc.coords);
          useLocationRuntimeStore.getState().setRuntime({
            loading: false,
            errorMsg: null,
            status: 'watching',
          });
        },
        async () => {
          stopAutoLocationTracking();
          try {
            const enabled = await Location.hasServicesEnabledAsync();
            useLocationRuntimeStore.getState().setRuntime({
              loading: false,
              status: enabled ? 'error' : 'services-disabled',
              errorMsg: enabled
                ? 'Sinyal GPS terganggu'
                : 'GPS perangkat sedang nonaktif',
            });
          } catch {
            useLocationRuntimeStore.getState().setRuntime({
              loading: false,
              status: 'error',
              errorMsg: 'Sinyal GPS terganggu',
            });
          }
        }
      );

      if (!(useAppStore.getState().autoLocation ?? true)) {
        sub.remove();
        return;
      }

      activeWatchSub = sub;
      useLocationRuntimeStore.getState().setRuntime({
        status: 'watching',
        errorMsg: null,
      });
    } catch {
      // Ignore transient watcher startup errors; one-shot sync still ran
    } finally {
      watchStartingPromise = null;
    }
  })();

  return watchStartingPromise;
}

/**
 * Stops the active GPS watcher subscription cleanly.
 */
export function stopAutoLocationTracking(): void {
  if (activeWatchSub) {
    activeWatchSub.remove();
    activeWatchSub = null;
  }
  const current = useLocationRuntimeStore.getState();
  if (current.status === 'watching') {
    current.setRuntime({ status: 'idle' });
  }
}

/**
 * Fetches the current device position with fast last-known fix, timeout fallback,
 * permission handling, and Android location-service activation prompt.
 */
export async function syncCurrentLocation(options?: {
  interactive?: boolean;
}): Promise<boolean> {
  const interactive = options?.interactive ?? false;

  if (activeFetchPromise) {
    const ok = await activeFetchPromise;
    if (ok || !interactive) {
      return ok;
    }
  }

  const runFetch = async (): Promise<boolean> => {
    const setRuntime = useLocationRuntimeStore.getState().setRuntime;
    setRuntime({
      loading: true,
      status: 'fetching',
      errorMsg: null,
    });

    try {
      let perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        perm = await Location.requestForegroundPermissionsAsync();
      }

      if (perm.status !== 'granted') {
        setRuntime({
          loading: false,
          status: 'denied',
          errorMsg: 'Izin akses lokasi ditolak',
        });
        if (interactive) {
          showAppDialog({
            variant: 'warning',
            title: 'Izin Lokasi Dibutuhkan',
            message:
              'Aktifkan izin lokasi di pengaturan perangkat agar e-Istiwaain dapat mendeteksi posisi GPS Anda secara otomatis.',
            actions: [
              { label: 'Nanti', style: 'secondary' },
              {
                label: 'Buka Pengaturan',
                style: 'primary',
                onPress: () => {
                  void Linking.openSettings();
                },
              },
            ],
          });
        }
        return false;
      }

      let servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled && Platform.OS === 'android') {
        try {
          await Location.enableNetworkProviderAsync();
        } catch {
          // User declined or provider prompt unavailable
        }
        servicesEnabled = await Location.hasServicesEnabledAsync();
      }

      if (!servicesEnabled) {
        setRuntime({
          loading: false,
          status: 'services-disabled',
          errorMsg: 'GPS perangkat sedang nonaktif',
        });
        if (interactive) {
          showAppDialog({
            variant: 'warning',
            title: 'GPS Belum Aktif',
            message:
              'Nyalakan layanan Lokasi (GPS) di perangkat Anda agar koordinat, arah kiblat, dan jadwal shalat terdeteksi otomatis.',
            actions: [
              { label: 'Tutup', style: 'secondary' },
              {
                label: 'Buka Pengaturan',
                style: 'primary',
                onPress: () => {
                  void Linking.openSettings();
                },
              },
            ],
          });
        }
        return false;
      }

      try {
        let lastKnown = await Location.getLastKnownPositionAsync({
          maxAge: LAST_KNOWN_MAX_AGE_MS,
        });
        if (!lastKnown && !useAppStore.getState().userLocation) {
          lastKnown = await Location.getLastKnownPositionAsync();
        }
        if (lastKnown) {
          await applyCoordinates(lastKnown.coords);
        }
      } catch {
        // Proceed to fresh GPS fix
      }

      let freshPos: Location.LocationObject | null = null;
      try {
        freshPos = await withTimeout(
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            mayShowUserSettingsDialog: true,
          }),
          BALANCED_TIMEOUT_MS,
          'GPS balanced timeout'
        );
      } catch {
        try {
          freshPos = await withTimeout(
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Low,
              mayShowUserSettingsDialog: false,
            }),
            LOW_TIMEOUT_MS,
            'GPS low timeout'
          );
        } catch {
          freshPos = null;
        }
      }

      if (freshPos) {
        await applyCoordinates(freshPos.coords);
        setRuntime({
          errorMsg: null,
          status: activeWatchSub ? 'watching' : 'idle',
        });
        if ((useAppStore.getState().autoLocation ?? true) && !activeWatchSub) {
          void ensureLocationWatcher();
        }
        return true;
      }

      if (useAppStore.getState().userLocation) {
        setRuntime({
          errorMsg: null,
          status: activeWatchSub ? 'watching' : 'idle',
        });
        if ((useAppStore.getState().autoLocation ?? true) && !activeWatchSub) {
          void ensureLocationWatcher();
        }
        return true;
      }

      setRuntime({
        status: 'error',
        errorMsg:
          'Gagal mengambil koordinat GPS. Pastikan berada di area dengan sinyal GPS/internet.',
      });
      return false;
    } catch {
      if (useAppStore.getState().userLocation) {
        setRuntime({
          status: activeWatchSub ? 'watching' : 'idle',
          errorMsg: null,
        });
        return true;
      }
      setRuntime({
        status: 'error',
        errorMsg: 'Gagal mengambil koordinat GPS',
      });
      return false;
    } finally {
      setRuntime({ loading: false });
    }
  };

  const promise = runFetch();
  activeFetchPromise = promise;
  try {
    return await promise;
  } finally {
    if (activeFetchPromise === promise) {
      activeFetchPromise = null;
    }
  }
}

/**
 * Syncs GPS immediately and starts continuous foreground position updates.
 */
export async function startAutoLocationTracking(): Promise<void> {
  const ok = await syncCurrentLocation({ interactive: false });
  if (ok && (useAppStore.getState().autoLocation ?? true)) {
    await ensureLocationWatcher();
  }
}

/**
 * Re-syncs GPS when returning to the app foreground (e.g. from device Settings).
 */
export async function handleAppForegroundLocationSync(): Promise<void> {
  if (!(useAppStore.getState().autoLocation ?? true)) return;
  await startAutoLocationTracking();
}
