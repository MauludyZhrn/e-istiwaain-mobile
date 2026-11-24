import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

/**
 * Semantic JS/OTA release version displayed in the app UI.
 * Note: app.json "version" remains "1.0.0" to preserve runtimeVersion ("appVersion")
 * compatibility for EAS Update OTA delivery to existing installed APKs.
 */
export const APP_RELEASE_VERSION = '1.0.4';
export const APP_OTA_REVISION = 4;
export const APP_NATIVE_VERSION = Constants.expoConfig?.version ?? '1.0.0';
export const APP_VERSION_LABEL = `v${APP_RELEASE_VERSION}`;

export interface AppVersionRuntimeInfo {
  releaseVersion: string;
  nativeVersion: string;
  otaRevision: number;
  channel: string | null;
  updateIdShort: string | null;
  isEmbedded: boolean;
  summaryLine: string;
  detailMessage: string;
}

export function getAppVersionRuntimeInfo(): AppVersionRuntimeInfo {
  let channel: string | null = null;
  let updateIdShort: string | null = null;
  let isEmbedded = true;
  let runtimeVersion = APP_NATIVE_VERSION;

  try {
    channel = Updates.channel ?? null;
    updateIdShort = Updates.updateId ? Updates.updateId.slice(0, 8) : null;
    isEmbedded = Updates.isEmbeddedLaunch;
    runtimeVersion = Updates.runtimeVersion ?? APP_NATIVE_VERSION;
  } catch {
    // Fallback cleanly in Expo Go or environments where expo-updates is unavailable
  }

  const channelPart = channel ? `Channel ${channel}` : `Build ${runtimeVersion}`;
  const otaPart =
    updateIdShort && !isEmbedded
      ? `OTA #${APP_OTA_REVISION} (${updateIdShort})`
      : `OTA #${APP_OTA_REVISION}`;

  const summaryLine = `Runtime ${runtimeVersion} • ${channelPart} • ${otaPart}`;
  const detailMessage = [
    `Versi Rilis: v${APP_RELEASE_VERSION}`,
    `Runtime Native: v${runtimeVersion}`,
    `Revisi OTA: #${APP_OTA_REVISION}${updateIdShort ? ` (${updateIdShort})` : ''}`,
    `Channel: ${channel ?? 'lokal / dev'}`,
  ].join('\n');

  return {
    releaseVersion: APP_RELEASE_VERSION,
    nativeVersion: runtimeVersion,
    otaRevision: APP_OTA_REVISION,
    channel,
    updateIdShort,
    isEmbedded,
    summaryLine,
    detailMessage,
  };
}
