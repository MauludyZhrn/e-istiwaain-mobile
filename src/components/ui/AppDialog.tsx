import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle2,
  Info,
  ShieldCheck,
  VolumeX,
} from 'lucide-react-native';
import { create } from 'zustand';

import { colors } from '../../constants/colors';
import { useAppStore } from '../../store/useAppStore';

export type AppDialogVariant = 'info' | 'success' | 'warning' | 'danger';

export type AppDialogIconName =
  | 'auto'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'bell'
  | 'bell-off'
  | 'volume-x'
  | 'shield';

export interface AppDialogButton {
  label: string;
  onPress?: () => void;
  style?: 'primary' | 'secondary' | 'destructive';
}

export interface ShowAppDialogOptions {
  title: string;
  message: string;
  variant?: AppDialogVariant;
  icon?: AppDialogIconName;
  dismissable?: boolean;
  confirmText?: string;
  actions?: AppDialogButton[];
}

interface AppDialogState {
  visible: boolean;
  config: ShowAppDialogOptions | null;
  show: (options: ShowAppDialogOptions) => void;
  hide: () => void;
}

export const useAppDialogStore = create<AppDialogState>((set) => ({
  visible: false,
  config: null,
  show: (options) => set({ visible: true, config: options }),
  hide: () => set({ visible: false }),
}));

/**
 * Displays a themed in-app modal dialog matching the e-Istiwaain design system.
 */
export const showAppDialog = (options: ShowAppDialogOptions) => {
  useAppDialogStore.getState().show(options);
};

export const hideAppDialog = () => {
  useAppDialogStore.getState().hide();
};

interface VariantPalette {
  accent: string;
  badgeBgLight: string;
  badgeBgDark: string;
  badgeBorder: string;
  buttonBgLight: string;
  buttonBgDark: string;
}

const VARIANT_PALETTES: Record<AppDialogVariant, VariantPalette> = {
  info: {
    accent: '#117E86',
    badgeBgLight: 'rgba(17, 126, 134, 0.12)',
    badgeBgDark: 'rgba(17, 126, 134, 0.22)',
    badgeBorder: 'rgba(17, 126, 134, 0.35)',
    buttonBgLight: colors.light.primary,
    buttonBgDark: colors.dark.primary,
  },
  success: {
    accent: '#10B981',
    badgeBgLight: 'rgba(16, 185, 129, 0.12)',
    badgeBgDark: 'rgba(16, 185, 129, 0.2)',
    badgeBorder: 'rgba(16, 185, 129, 0.35)',
    buttonBgLight: colors.light.primary,
    buttonBgDark: '#059669',
  },
  warning: {
    accent: '#F59E0B',
    badgeBgLight: 'rgba(245, 158, 11, 0.14)',
    badgeBgDark: 'rgba(245, 158, 11, 0.2)',
    badgeBorder: 'rgba(245, 158, 11, 0.38)',
    buttonBgLight: colors.light.primary,
    buttonBgDark: colors.dark.primary,
  },
  danger: {
    accent: '#EF4444',
    badgeBgLight: 'rgba(239, 68, 68, 0.12)',
    badgeBgDark: 'rgba(239, 68, 68, 0.2)',
    badgeBorder: 'rgba(239, 68, 68, 0.35)',
    buttonBgLight: '#DC2626',
    buttonBgDark: '#DC2626',
  },
};

function renderDialogIcon(
  icon: AppDialogIconName,
  variant: AppDialogVariant,
  color: string
) {
  const resolved = icon === 'auto' ? variant : icon;
  switch (resolved) {
    case 'success':
      return <CheckCircle2 color={color} size={28} />;
    case 'warning':
      return <AlertTriangle color={color} size={28} />;
    case 'danger':
      return <AlertCircle color={color} size={28} />;
    case 'bell':
      return <Bell color={color} size={28} />;
    case 'bell-off':
      return <BellOff color={color} size={28} />;
    case 'volume-x':
      return <VolumeX color={color} size={28} />;
    case 'shield':
      return <ShieldCheck color={color} size={28} />;
    case 'info':
    default:
      return <Info color={color} size={28} />;
  }
}

/**
 * Global custom popup host mounted once at the app root.
 */
export function AppDialogHost() {
  const visible = useAppDialogStore((state) => state.visible);
  const config = useAppDialogStore((state) => state.config);
  const hide = useAppDialogStore((state) => state.hide);

  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const theme = isDarkMode ? colors.dark : colors.light;
  const reducedMotion = useReducedMotion();

  const [rendered, setRendered] = useState(false);
  const [activeConfig, setActiveConfig] = useState<ShowAppDialogOptions | null>(null);
  const progress = useSharedValue(0);

  const finishClose = useCallback(() => {
    setRendered(false);
  }, []);

  useEffect(() => {
    if (visible && config) {
      setActiveConfig(config);
      setRendered(true);
      cancelAnimation(progress);
      if (reducedMotion) {
        progress.value = 1;
      } else {
        progress.value = withSpring(1, {
          damping: 22,
          stiffness: 280,
          mass: 0.72,
        });
      }
      return;
    }

    if (!visible && rendered) {
      cancelAnimation(progress);
      if (reducedMotion) {
        progress.value = 0;
        setRendered(false);
      } else {
        progress.value = withTiming(
          0,
          { duration: 140, easing: Easing.out(Easing.quad) },
          (finished) => {
            if (finished) {
              scheduleOnRN(finishClose);
            }
          }
        );
      }
    }
  }, [config, finishClose, progress, reducedMotion, rendered, visible]);

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: interpolate(progress.value, [0, 1], [0.92, 1]) },
      { translateY: interpolate(progress.value, [0, 1], [14, 0]) },
    ],
  }));

  if (!rendered || !activeConfig) {
    return null;
  }

  const variant: AppDialogVariant = activeConfig.variant ?? 'info';
  const palette = VARIANT_PALETTES[variant];
  const dismissable = activeConfig.dismissable !== false;
  const buttons: AppDialogButton[] =
    activeConfig.actions && activeConfig.actions.length > 0
      ? activeConfig.actions
      : [{ label: activeConfig.confirmText ?? 'Mengerti', style: 'primary' }];

  const handleBackdropDismiss = () => {
    if (dismissable) {
      hide();
    }
  };

  const handleButtonPress = (btn: AppDialogButton) => {
    hide();
    btn.onPress?.();
  };

  return (
    <Modal
      visible={rendered}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={handleBackdropDismiss}
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleBackdropDismiss} />
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
            cardAnimatedStyle,
          ]}
        >
          <View style={[styles.topAccentBar, { backgroundColor: palette.accent }]} />

          <View style={styles.body}>
            <View
              style={[
                styles.iconBadge,
                {
                  backgroundColor: isDarkMode ? palette.badgeBgDark : palette.badgeBgLight,
                  borderColor: palette.badgeBorder,
                },
              ]}
            >
              {renderDialogIcon(activeConfig.icon ?? 'auto', variant, palette.accent)}
            </View>

            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {activeConfig.title}
            </Text>

            <Text style={[styles.message, { color: theme.textSecondary }]}>
              {activeConfig.message}
            </Text>

            <View
              style={[
                styles.actionsRow,
                buttons.length > 2 && styles.actionsColumn,
              ]}
            >
              {buttons.map((btn, idx) => {
                const isSecondary = btn.style === 'secondary';
                const isDestructive = btn.style === 'destructive';
                const primaryBg = isDestructive
                  ? '#DC2626'
                  : isDarkMode
                  ? palette.buttonBgDark
                  : palette.buttonBgLight;

                return (
                  <TouchableOpacity
                    key={`${btn.label}-${idx}`}
                    activeOpacity={0.82}
                    onPress={() => handleButtonPress(btn)}
                    style={[
                      styles.button,
                      buttons.length <= 2 ? styles.buttonFlex : styles.buttonColumn,
                      isSecondary
                        ? {
                            backgroundColor: 'transparent',
                            borderWidth: 1,
                            borderColor: theme.border,
                          }
                        : {
                            backgroundColor: primaryBg,
                          },
                    ]}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        { color: isSecondary ? theme.textPrimary : '#FFFFFF' },
                      ]}
                    >
                      {btn.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(1, 7, 54, 0.62)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  topAccentBar: {
    height: 4,
    width: '100%',
  },
  body: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
    alignItems: 'center',
  },
  iconBadge: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  actionsColumn: {
    flexDirection: 'column',
  },
  button: {
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFlex: {
    flex: 1,
  },
  buttonColumn: {
    width: '100%',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
