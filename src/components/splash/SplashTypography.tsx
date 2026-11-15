import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

export interface SplashTypographyProps {
  titleProgress: SharedValue<number>;
  taglineProgress: SharedValue<number>;
  supportProgress: SharedValue<number>;
  outroProgress: SharedValue<number>;
  reducedMotion: boolean;
}

/**
 * Staggered typographic reveal for the e-Istiwaain wordmark, tagline,
 * and supporting capabilities summary.
 */
export function SplashTypography({
  titleProgress,
  taglineProgress,
  supportProgress,
  outroProgress,
  reducedMotion,
}: SplashTypographyProps) {
  const titleStyle = useAnimatedStyle(() => {
    const enterOpacity = interpolate(titleProgress.value, [0, 1], [0, 1], Extrapolation.CLAMP);
    const exitOpacity = interpolate(outroProgress.value, [0, 0.75], [1, 0], Extrapolation.CLAMP);
    const enterY = reducedMotion
      ? 0
      : interpolate(titleProgress.value, [0, 1], [14, 0], Extrapolation.CLAMP);
    const exitY = reducedMotion
      ? 0
      : interpolate(outroProgress.value, [0, 1], [0, -6], Extrapolation.CLAMP);

    return {
      opacity: enterOpacity * exitOpacity,
      transform: [{ translateY: enterY + exitY }],
    };
  });

  const taglineStyle = useAnimatedStyle(() => {
    const enterOpacity = interpolate(taglineProgress.value, [0, 1], [0, 1], Extrapolation.CLAMP);
    const exitOpacity = interpolate(outroProgress.value, [0, 0.75], [1, 0], Extrapolation.CLAMP);
    const enterY = reducedMotion
      ? 0
      : interpolate(taglineProgress.value, [0, 1], [12, 0], Extrapolation.CLAMP);
    const exitY = reducedMotion
      ? 0
      : interpolate(outroProgress.value, [0, 1], [0, -4], Extrapolation.CLAMP);

    return {
      opacity: enterOpacity * exitOpacity,
      transform: [{ translateY: enterY + exitY }],
    };
  });

  const supportStyle = useAnimatedStyle(() => {
    const enterOpacity = interpolate(supportProgress.value, [0, 1], [0, 1], Extrapolation.CLAMP);
    const exitOpacity = interpolate(outroProgress.value, [0, 0.75], [1, 0], Extrapolation.CLAMP);
    const enterY = reducedMotion
      ? 0
      : interpolate(supportProgress.value, [0, 1], [10, 0], Extrapolation.CLAMP);
    const exitY = reducedMotion
      ? 0
      : interpolate(outroProgress.value, [0, 1], [0, -3], Extrapolation.CLAMP);

    return {
      opacity: enterOpacity * exitOpacity,
      transform: [{ translateY: enterY + exitY }],
    };
  });

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.titleBlock, titleStyle]}>
        <Text style={styles.appName} allowFontScaling={false}>
          e-Istiwaain
        </Text>
      </Animated.View>

      <Animated.View style={[styles.taglineBlock, taglineStyle]}>
        <View style={styles.goldAccentRule} />
        <Text style={styles.tagline} allowFontScaling={false}>
          Ilmu Falak Digital
        </Text>
      </Animated.View>

      <Animated.View style={[styles.supportBlock, supportStyle]}>
        <Text style={styles.supportText} allowFontScaling={false}>
          Hisab • Kompas Kiblat • Jadwal Shalat
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 18,
    paddingHorizontal: 28,
  },
  titleBlock: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 31,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  taglineBlock: {
    alignItems: 'center',
    marginTop: 10,
  },
  goldAccentRule: {
    width: 42,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#C39747',
    marginBottom: 9,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1.3,
    color: '#F9A729',
    textAlign: 'center',
  },
  supportBlock: {
    alignItems: 'center',
    marginTop: 10,
  },
  supportText: {
    fontSize: 12.5,
    fontWeight: '500',
    letterSpacing: 0.4,
    color: 'rgba(255, 255, 255, 0.78)',
    textAlign: 'center',
  },
});
